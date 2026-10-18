import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import type { Booking } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../identity-access/audit.service';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { resolvePropertyScope } from '../../common/auth/property-scope.helper';
import {
  ConfirmPaymentDto,
  confirmPaymentSchema,
  CreatePaymentIntentDto,
  createPaymentIntentSchema,
} from './dto/payments.dto';
import { StripeSignatureVerifier } from './stripe-signature.verifier';
import { StripeLocalMateClient } from './stripe-localmate.client';
import {
  STRIPE_CHECKOUT_EXPIRY_SECONDS,
  getCheckoutSessionIdempotencyKey,
} from './stripe-localmate.constants';

const BANK_CONFIG = {
  bank_code: 'MB',
  bin: '970422',
  bank_name: 'MBBank (Napas 247)',
  account_number: '0388889999',
  account_holder: 'AURUM HAVEN RESORT',
};

export interface StripeEventObject {
  id?: string;
  client_reference_id?: string;
  payment_status?: string;
  amount_total?: number;
  amount?: number;
  amount_refunded?: number;
  currency?: string;
  payment_intent?: string;
  metadata?: Record<string, string>;
}

export interface StripeWebhookPayload {
  id?: string;
  type?: string;
  data?: {
    object?: StripeEventObject;
  };
}

function normalizePhone(value: string): string {
  const stripped = value.trim().replace(/[\s().-]/g, '');
  if (stripped.startsWith('+84')) return `0${stripped.slice(3)}`;
  if (stripped.startsWith('84') && stripped.length >= 10) {
    return `0${stripped.slice(2)}`;
  }
  return stripped;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly signatureVerifier: StripeSignatureVerifier,
    private readonly stripeClient: StripeLocalMateClient,
  ) {}

  private normalizeActor(
    user?: AuthenticatedUser | null,
  ): AuthenticatedUser | null {
    return user ?? null;
  }

  private authorizeBookingAccess(
    booking: {
      id: string;
      accountId?: string | null;
      propertyId: string;
      guestEmail: string;
      guestPhone: string;
    },
    user?: AuthenticatedUser | null,
    contact?: string,
  ): void {
    const actor = this.normalizeActor(user);

    if (actor) {
      return;
    }

    // Unauthenticated guest lookup capability
    if (contact && contact.trim()) {
      const cleanContact = contact.trim().toLowerCase();
      const guestEmail = (booking.guestEmail || '').toLowerCase();
      const guestPhone = normalizePhone(booking.guestPhone || '');
      const cleanPhone = normalizePhone(cleanContact);

      const emailMatches = guestEmail === cleanContact;
      const phoneMatches = cleanPhone.length >= 8 && guestPhone === cleanPhone;

      if (emailMatches || phoneMatches) {
        return;
      }
      throw new ForbiddenException(
        'Thông tin liên hệ không khớp với đơn đặt phòng',
      );
    }

    throw new UnauthorizedException(
      'Yêu cầu xác thực tài khoản hoặc thông tin liên hệ đặt phòng để thao tác thanh toán',
    );
  }

  // ---------------------------------------------------------------------------
  // 1. Stripe LocalMate Architecture Pattern: createDepositCheckout
  // ---------------------------------------------------------------------------

  async createDepositCheckout(
    bookingCode: string,
    lookupToken?: string,
    idempotencyKey?: string,
    returnBaseUrl?: string,
  ) {
    const cleanCode = bookingCode.trim();
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode: cleanCode },
      include: { property: true, roomType: true },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
    }

    // Capability check: If booking has lookupTokenHash, verify it strictly
    if (booking.lookupTokenHash) {
      if (!lookupToken || !lookupToken.trim()) {
        throw new UnauthorizedException(
          'Yêu cầu mã tra cứu (lookup capability) để thực hiện thanh toán',
        );
      }
      const tokenHash = crypto
        .createHash('sha256')
        .update(lookupToken.trim())
        .digest('hex');
      const bufExpected = Buffer.from(booking.lookupTokenHash, 'hex');
      const bufActual = Buffer.from(tokenHash, 'hex');
      if (
        bufExpected.length !== bufActual.length ||
        !crypto.timingSafeEqual(bufExpected, bufActual)
      ) {
        throw new ForbiddenException(
          'Mã tra cứu không hợp lệ hoặc không khớp với đơn đặt phòng',
        );
      }
    }

    // Validate booking is PENDING and unexpired
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException(
        'Không thể thanh toán cho đơn đặt phòng đã bị hủy',
      );
    }

    if (
      booking.status === 'CONFIRMED' ||
      booking.paymentStatus === 'DEPOSIT_PAID' ||
      booking.paymentStatus === 'PAID'
    ) {
      throw new BadRequestException(
        'Đơn đặt phòng này đã được xác nhận thanh toán',
      );
    }

    if (booking.status === 'EXPIRED') {
      throw new BadRequestException('Đơn đặt phòng đã hết hạn thanh toán');
    }

    const now = new Date();
    if (
      booking.holdExpiresAt &&
      booking.holdExpiresAt.getTime() <= now.getTime()
    ) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException(
        'Thời gian giữ phòng đã hết hạn. Vui lòng tạo đơn đặt phòng mới.',
      );
    }

    if (booking.status !== 'PENDING') {
      throw new BadRequestException(
        `Đơn đặt phòng đang ở trạng thái ${booking.status}, không thể thanh toán`,
      );
    }

    // Amount is exactly the 30% depositAmount snapshotted on the booking
    const depositAmount =
      booking.depositAmount ??
      Math.round(
        (booking.totalPrice * (booking.depositRateBps || 3000)) / 10000,
      );

    // Reuse existing open session if within expiry (1800s)
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        bookingId: booking.id,
        purpose: 'DEPOSIT',
        status: { in: ['OPEN', 'PENDING'] },
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPayment && existingPayment.providerSessionId) {
      const metadata =
        (existingPayment.rawMetadata as Record<string, string>) || {};
      return {
        payment_id: existingPayment.id,
        booking_code: booking.bookingCode,
        session_id: existingPayment.providerSessionId,
        checkout_url: metadata.checkoutUrl || existingPayment.qrCodeUrl || null,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        status: existingPayment.status,
        expires_at: existingPayment.expiresAt?.toISOString() || null,
        is_reused: true,
      };
    }

    // Mark previous expired sessions if any
    await this.prisma.payment.updateMany({
      where: {
        bookingId: booking.id,
        status: { in: ['OPEN', 'PENDING'] },
        expiresAt: { lte: now },
      },
      data: { status: 'EXPIRED' },
    });

    // Create a new Stripe Checkout session
    const paymentId = crypto.randomUUID();
    const sessionExpiresAt = new Date(
      now.getTime() + STRIPE_CHECKOUT_EXPIRY_SECONDS * 1000,
    );
    const sessionExpiresAtUnix = Math.floor(sessionExpiresAt.getTime() / 1000);

    const stripeSession = await this.stripeClient.createCheckoutSession({
      paymentId,
      bookingCode: booking.bookingCode,
      lookupToken,
      amount: depositAmount,
      currency: booking.currency || 'VND',
      expiresAtUnixSeconds: sessionExpiresAtUnix,
      returnBaseUrl,
    });

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const transactionRef = `TXN-${booking.bookingCode}-${randomSuffix}`;
    const stripeIdempotencyKey = getCheckoutSessionIdempotencyKey(paymentId);

    const paymentRecord = await this.prisma.payment.create({
      data: {
        id: paymentId,
        bookingId: booking.id,
        paymentMethod: 'STRIPE_LOCALMATE',
        amount: depositAmount,
        currency: booking.currency || 'VND',
        purpose: 'DEPOSIT',
        status: 'OPEN',
        providerName: 'STRIPE_LOCALMATE',
        providerSessionId: stripeSession.id,
        providerPaymentId: stripeSession.payment_intent ?? null,
        transactionRef,
        expiresAt: sessionExpiresAt,
        rawMetadata: {
          checkoutUrl: stripeSession.url,
          idempotencyKey: stripeIdempotencyKey,
          callerIdempotencyKey: idempotencyKey ?? null,
        },
      },
    });

    await this.auditService.logEvent({
      actorId: booking.accountId || 'anonymous-guest',
      action: 'DEPOSIT_CHECKOUT_CREATED',
      boundedContext: 'payments',
      resourceType: 'Payment',
      resourceId: paymentRecord.id,
      metadata: {
        bookingCode: booking.bookingCode,
        amount: depositAmount,
        sessionId: stripeSession.id,
      },
    });

    return {
      payment_id: paymentRecord.id,
      booking_code: booking.bookingCode,
      session_id: stripeSession.id,
      checkout_url: stripeSession.url,
      amount: depositAmount,
      currency: paymentRecord.currency,
      status: paymentRecord.status,
      expires_at: sessionExpiresAt.toISOString(),
      is_reused: false,
    };
  }

  async verifyCheckoutSession(
    bookingCode: string,
    sessionId?: string,
    lookupToken?: string,
  ) {
    const cleanCode = bookingCode.trim();
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode: cleanCode },
      include: {
        property: true,
        roomType: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
    }

    if (lookupToken && booking.lookupTokenHash) {
      const tokenHash = crypto
        .createHash('sha256')
        .update(lookupToken.trim())
        .digest('hex');
      const bufExpected = Buffer.from(booking.lookupTokenHash, 'hex');
      const bufActual = Buffer.from(tokenHash, 'hex');
      if (
        bufExpected.length !== bufActual.length ||
        !crypto.timingSafeEqual(bufExpected, bufActual)
      ) {
        throw new ForbiddenException(
          'Mã tra cứu không hợp lệ hoặc không khớp với đơn đặt phòng',
        );
      }
    }

    if (
      booking.paymentStatus === 'DEPOSIT_PAID' ||
      booking.paymentStatus === 'PAID' ||
      booking.status === 'CONFIRMED'
    ) {
      return {
        booking_code: booking.bookingCode,
        status: booking.status,
        payment_status: booking.paymentStatus,
        is_paid: true,
        paid_at:
          booking.payments.find((p) => p.status === 'SUCCESS')?.paidAt?.toISOString() ||
          new Date().toISOString(),
        lookup_token: lookupToken || undefined,
      };
    }

    const payment = sessionId
      ? booking.payments.find((p) => p.providerSessionId === sessionId)
      : booking.payments.find(
          (p) =>
            p.purpose === 'DEPOSIT' &&
            Boolean(p.providerSessionId) &&
            (p.status === 'OPEN' || p.status === 'PENDING'),
        );

    const targetSessionId = sessionId || payment?.providerSessionId;
    if (!targetSessionId || !payment) {
      return {
        booking_code: booking.bookingCode,
        status: booking.status,
        payment_status: booking.paymentStatus,
        is_paid: false,
      };
    }

    try {
      const stripeSession =
        await this.stripeClient.getCheckoutSession(targetSessionId);
      if (
        stripeSession &&
        (stripeSession.payment_status === 'paid' ||
          stripeSession.status === 'complete')
      ) {
        const paidAt = new Date();
        const providerPaymentId =
          typeof stripeSession.payment_intent === 'string'
            ? stripeSession.payment_intent
            : payment.providerPaymentId;

        await this.prisma.$transaction(async (tx) => {
          await tx.booking.updateMany({
            where: { id: booking.id, status: 'PENDING' },
            data: { status: 'CONFIRMING' },
          });

          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CONFIRMED',
              paymentStatus: 'DEPOSIT_PAID',
            },
          });

          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCESS',
              paidAt,
              providerPaymentId,
            },
          });

          await tx.paymentWebhookEvent.create({
            data: {
              providerEventId: `verify-sync-${targetSessionId}`,
              eventType: 'checkout.session.completed',
              payloadHash: crypto
                .createHash('sha256')
                .update(targetSessionId)
                .digest('hex'),
              status: 'PROCESSED',
              processedAt: paidAt,
            },
          });
        });

        this.auditService.logEvent({
          action: 'PAYMENT_VERIFIED_SYNC',
          actorId: booking.accountId || 'anonymous-guest',
          boundedContext: 'payments',
          resourceType: 'Payment',
          resourceId: payment.id,
          metadata: {
            actorRole: 'GUEST',
            bookingCode: booking.bookingCode,
            sessionId: targetSessionId,
            status: 'SUCCESS',
          },
        });

        return {
          booking_code: booking.bookingCode,
          status: 'CONFIRMED',
          payment_status: 'DEPOSIT_PAID',
          is_paid: true,
          paid_at: paidAt.toISOString(),
          lookup_token: lookupToken || undefined,
        };
      }
    } catch (err) {
      this.logger.warn(
        `Failed to verify checkout session with Stripe for booking ${bookingCode}: ${err}`,
      );
    }

    return {
      booking_code: booking.bookingCode,
      status: booking.status,
      payment_status: booking.paymentStatus,
      is_paid: false,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. Stripe LocalMate Architecture Pattern: handleWebhook
  // ---------------------------------------------------------------------------

  async handleWebhook(
    payload: Buffer | string,
    signatureHeader?: string | null,
  ): Promise<{ received: boolean; status: string; duplicate?: boolean }> {
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_localmate_secret';

    // Verify raw-body signature with 300s tolerance
    this.signatureVerifier.verify({
      rawBody: payload,
      signatureHeader,
      secret: webhookSecret,
    });

    const bodyString = Buffer.isBuffer(payload)
      ? payload.toString('utf8')
      : String(payload);

    let event: StripeWebhookPayload;
    try {
      event = JSON.parse(bodyString) as StripeWebhookPayload;
    } catch {
      throw new BadRequestException('Malformed JSON payload in Stripe webhook');
    }

    const eventId = event?.id;
    const eventType = event?.type;
    const eventObject = event?.data?.object;

    if (
      !eventId ||
      typeof eventId !== 'string' ||
      !eventType ||
      typeof eventType !== 'string'
    ) {
      throw new BadRequestException('Invalid Stripe event structure');
    }

    const payloadHash = crypto
      .createHash('sha256')
      .update(bodyString)
      .digest('hex');

    // Deduplicate event via PaymentWebhookEvent table
    const existingEvent = await this.prisma.paymentWebhookEvent.findUnique({
      where: { providerEventId: eventId },
    });

    if (existingEvent) {
      return {
        received: true,
        duplicate: true,
        status: existingEvent.status,
      };
    }

    try {
      switch (eventType) {
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded':
          return await this.handleCheckoutSessionCompleted(
            eventId,
            eventType,
            payloadHash,
            eventObject,
          );

        case 'checkout.session.expired':
          return await this.handleCheckoutSessionExpired(
            eventId,
            eventType,
            payloadHash,
            eventObject,
          );

        case 'charge.refunded':
          return await this.handleChargeRefunded(
            eventId,
            eventType,
            payloadHash,
            eventObject,
          );

        default:
          await this.prisma.paymentWebhookEvent.create({
            data: {
              providerEventId: eventId,
              eventType,
              payloadHash,
              status: 'IGNORED',
            },
          });
          return { received: true, status: 'IGNORED' };
      }
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        const raced = await this.prisma.paymentWebhookEvent.findUnique({
          where: { providerEventId: eventId },
        });
        if (raced) {
          return { received: true, duplicate: true, status: raced.status };
        }
      }
      throw err;
    }
  }

  private async findPaymentForSession(session?: StripeEventObject) {
    if (!session) return null;
    let payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          ...(session.id ? [{ providerSessionId: session.id }] : []),
          ...(session.metadata?.paymentId
            ? [{ id: session.metadata.paymentId }]
            : []),
        ],
      },
      include: { booking: true },
    });

    if (!payment && session.client_reference_id) {
      payment = await this.prisma.payment.findFirst({
        where: { booking: { bookingCode: session.client_reference_id } },
        orderBy: { createdAt: 'desc' },
        include: { booking: true },
      });
    }

    return payment;
  }

  private async handleCheckoutSessionCompleted(
    eventId: string,
    eventType: string,
    payloadHash: string,
    session?: StripeEventObject,
  ) {
    const payment = await this.findPaymentForSession(session);

    if (!payment) {
      await this.prisma.paymentWebhookEvent.create({
        data: {
          providerEventId: eventId,
          eventType,
          payloadHash,
          status: 'IGNORED',
          error: 'payment_not_found',
        },
      });
      return { received: true, status: 'IGNORED', reason: 'payment_not_found' };
    }

    const isPaid = session?.payment_status === 'paid';
    const sessionAmount = Number(session?.amount_total);
    const sessionCurrency = String(session?.currency || '').toLowerCase();
    const expectedAmount = payment.amount;
    const expectedCurrency = payment.currency.toLowerCase();

    if (
      !isPaid ||
      sessionAmount !== expectedAmount ||
      sessionCurrency !== expectedCurrency
    ) {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
        await tx.paymentWebhookEvent.create({
          data: {
            providerEventId: eventId,
            eventType,
            payloadHash,
            status: 'FAILED',
            error: 'amount_or_currency_mismatch',
          },
        });
      });
      return {
        received: true,
        status: 'FAILED',
        reason: 'amount_or_currency_mismatch',
      };
    }

    // Atomic CAS transition: PENDING -> CONFIRMING -> CONFIRMED
    await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: payment.bookingId },
      });

      if (!booking) {
        throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
      }

      const paidAt = new Date();
      const providerPaymentId =
        typeof session?.payment_intent === 'string'
          ? session.payment_intent
          : payment.providerPaymentId;

      if (booking.status === 'CANCELLED') {
        // Race condition: booking was cancelled before payment captured
        // Money was captured, mark payment REFUND_PENDING
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'REFUND_PENDING',
            paidAt,
            providerPaymentId,
          },
        });
        await tx.paymentWebhookEvent.create({
          data: {
            providerEventId: eventId,
            eventType,
            payloadHash,
            status: 'PROCESSED',
            processedAt: paidAt,
          },
        });
        return;
      }

      // 1. CAS transition step: PENDING -> CONFIRMING
      await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: 'PENDING',
        },
        data: {
          status: 'CONFIRMING',
        },
      });

      // 2. Finalize step: CONFIRMING -> CONFIRMED, paymentStatus -> DEPOSIT_PAID
      // Ensures allotment remains locked and held ("giữ allotment")
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'DEPOSIT_PAID',
        },
      });

      // 3. Update payment to SUCCESS
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          paidAt,
          providerPaymentId,
        },
      });

      // 4. Record deduplicated event
      await tx.paymentWebhookEvent.create({
        data: {
          providerEventId: eventId,
          eventType,
          payloadHash,
          status: 'PROCESSED',
          processedAt: paidAt,
        },
      });
    });

    return { received: true, status: 'PROCESSED' };
  }

  private async handleCheckoutSessionExpired(
    eventId: string,
    eventType: string,
    payloadHash: string,
    session?: StripeEventObject,
  ) {
    const payment = await this.findPaymentForSession(session);

    if (!payment) {
      await this.prisma.paymentWebhookEvent.create({
        data: {
          providerEventId: eventId,
          eventType,
          payloadHash,
          status: 'IGNORED',
          error: 'payment_not_found',
        },
      });
      return { received: true, status: 'IGNORED' };
    }

    await this.prisma.$transaction(async (tx) => {
      if (payment.status === 'OPEN' || payment.status === 'PENDING') {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'EXPIRED' },
        });
      }

      await tx.paymentWebhookEvent.create({
        data: {
          providerEventId: eventId,
          eventType,
          payloadHash,
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });
    });

    return { received: true, status: 'PROCESSED' };
  }

  private async handleChargeRefunded(
    eventId: string,
    eventType: string,
    payloadHash: string,
    charge?: StripeEventObject,
  ) {
    const paymentIntentId = charge?.payment_intent;
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          ...(paymentIntentId ? [{ providerPaymentId: paymentIntentId }] : []),
          ...(charge?.id ? [{ providerPaymentId: charge.id }] : []),
        ],
      },
      include: { booking: true },
    });

    if (!payment) {
      await this.prisma.paymentWebhookEvent.create({
        data: {
          providerEventId: eventId,
          eventType,
          payloadHash,
          status: 'IGNORED',
          error: 'payment_not_found',
        },
      });
      return { received: true, status: 'IGNORED' };
    }

    const amountRefunded = Number(
      charge?.amount_refunded ?? charge?.amount ?? 0,
    );
    const isFullRefund = amountRefunded >= payment.amount;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isFullRefund ? 'REFUNDED' : 'REFUND_PENDING',
          refundedAmount: amountRefunded,
        },
      });

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        },
      });

      await tx.paymentWebhookEvent.create({
        data: {
          providerEventId: eventId,
          eventType,
          payloadHash,
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });
    });

    return { received: true, status: 'PROCESSED' };
  }

  // ---------------------------------------------------------------------------
  // 3. Legacy compatibility methods (preserved intact)
  // ---------------------------------------------------------------------------

  async createPaymentIntent(
    rawDto: CreatePaymentIntentDto,
    user?: AuthenticatedUser | null,
  ) {
    const parsed = createPaymentIntentSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu khởi tạo thanh toán không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const { booking_id, payment_method, contact } = parsed.data;

    const booking = await this.prisma.booking.findUnique({
      where: { id: booking_id },
      include: { property: true, roomType: true },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đơn đặt phòng');
    }

    // Verify booking ownership, staff role, or valid guest contact capability
    this.authorizeBookingAccess(booking, user, contact);

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException(
        'Không thể thanh toán cho đơn đặt phòng đã bị hủy',
      );
    }

    if (booking.paymentStatus === 'PAID') {
      throw new BadRequestException(
        'Đơn đặt phòng này đã được thanh toán hoàn tất',
      );
    }

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const transactionRef = `TXN-${booking.bookingCode}-${randomSuffix}`;

    // Standard VietQR URL format
    const qrCodeUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bin}-${BANK_CONFIG.account_number}-compact2.png?amount=${booking.totalPrice}&addInfo=${encodeURIComponent(booking.bookingCode)}&accountName=${encodeURIComponent(BANK_CONFIG.account_holder)}`;

    const paymentRecord = await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        paymentMethod: payment_method,
        amount: booking.totalPrice,
        currency: 'VND',
        status: 'PENDING',
        transactionRef,
        qrCodeUrl,
      },
    });

    const actor = this.normalizeActor(user);
    if (actor?.id) {
      await this.auditService.logEvent({
        actorId: actor.id,
        action: 'PAYMENT_INTENT_CREATED',
        boundedContext: 'payments',
        resourceType: 'Payment',
        resourceId: paymentRecord.id,
        metadata: {
          bookingCode: booking.bookingCode,
          amount: booking.totalPrice,
          paymentMethod: payment_method,
          transactionRef,
        },
      });
    }

    return {
      id: paymentRecord.id,
      booking_id: booking.id,
      booking_code: booking.bookingCode,
      amount: booking.totalPrice,
      currency: 'VND',
      payment_method: payment_method,
      status: 'PENDING',
      transaction_ref: transactionRef,
      bank_code: BANK_CONFIG.bank_code,
      bank_name: BANK_CONFIG.bank_name,
      account_number: BANK_CONFIG.account_number,
      account_holder: BANK_CONFIG.account_holder,
      transfer_content: booking.bookingCode,
      qr_code_url: qrCodeUrl,
      created_at: paymentRecord.createdAt.toISOString(),
    };
  }

  async confirmPayment(
    rawDto: ConfirmPaymentDto,
    user?: AuthenticatedUser | null,
  ) {
    const actor = this.normalizeActor(user);
    if (!actor) {
      throw new ForbiddenException(
        'Yêu cầu đăng nhập tài khoản quản trị để xác nhận thanh toán thủ công',
      );
    }

    const parsed = confirmPaymentSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu xác nhận thanh toán không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const { booking_id, transaction_ref } = parsed.data;

    let booking: Booking | null = null;
    if (booking_id) {
      booking = await this.prisma.booking.findUnique({
        where: { id: booking_id },
      });
    } else if (transaction_ref) {
      const payment = await this.prisma.payment.findUnique({
        where: { transactionRef: transaction_ref },
        include: { booking: true },
      });
      if (payment) {
        booking = payment.booking;
      }
    }

    if (!booking) {
      throw new NotFoundException(
        'Không tìm thấy thông tin đơn đặt phòng khớp với giao dịch',
      );
    }

    if (
      actor.managedPropertyId &&
      booking.propertyId !== actor.managedPropertyId
    ) {
      throw new ForbiddenException('Không có quyền thao tác trên cơ sở này');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException(
        'Không thể xác nhận thanh toán cho đơn đặt phòng đã hủy',
      );
    }

    const paidAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Claim the pending booking atomically so cancellation cannot race payment confirmation.
      const claimed = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
        },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
        },
      });

      if (claimed.count !== 1) {
        throw new BadRequestException(
          'Đơn đặt phòng đã được xử lý bởi một yêu cầu khác',
        );
      }

      // Update Payment record to SUCCESS if payment table is present
      if (tx.payment) {
        if (transaction_ref) {
          await tx.payment.updateMany({
            where: { transactionRef: transaction_ref },
            data: { status: 'SUCCESS', paidAt },
          });
        } else {
          await tx.payment.updateMany({
            where: { bookingId: booking.id, status: 'PENDING' },
            data: { status: 'SUCCESS', paidAt },
          });
        }
      }
    });

    await this.auditService.logEvent({
      actorId: actor.id,
      action: 'PAYMENT_CONFIRMED',
      boundedContext: 'payments',
      resourceType: 'Booking',
      resourceId: booking.id,
      metadata: {
        bookingCode: booking.bookingCode,
        amount: booking.totalPrice,
        paymentStatus: 'PAID',
        bookingStatus: 'CONFIRMED',
        paidAt: paidAt.toISOString(),
      },
    });

    return {
      booking_id: booking.id,
      booking_code: booking.bookingCode,
      amount: booking.totalPrice,
      payment_status: 'PAID',
      booking_status: 'CONFIRMED',
      paid_at: paidAt.toISOString(),
      message:
        'Xác nhận thanh toán thành công. Đơn đặt phòng đã được xác nhận.',
    };
  }

  async listPayments(
    user: AuthenticatedUser,
    filter: {
      propertyId?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    if (!user) {
      throw new UnauthorizedException(
        'Yêu cầu xác thực tài khoản để truy cập danh sách thanh toán',
      );
    }

    const scope = resolvePropertyScope(user, filter?.propertyId);

    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (scope.propertyId) {
      where.booking = { propertyId: scope.propertyId };
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          booking: {
            include: {
              property: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        id: p.id,
        booking_id: p.bookingId,
        booking_code: p.booking?.bookingCode,
        property_id: p.booking?.propertyId,
        property_name: p.booking?.property?.name,
        guest_name: p.booking?.guestName,
        payment_method: p.paymentMethod,
        amount: p.amount,
        currency: p.currency,
        purpose: p.purpose,
        status: p.status,
        provider_name: p.providerName,
        provider_payment_id: p.providerPaymentId,
        transaction_ref: p.transactionRef,
        qr_code_url: p.qrCodeUrl,
        expires_at: p.expiresAt?.toISOString() ?? null,
        refunded_amount: p.refundedAmount,
        paid_at: p.paidAt?.toISOString() ?? null,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      })),
      page,
      page_size: pageSize,
      total,
      has_next: skip + items.length < total,
    };
  }

  async getPaymentByBookingId(
    bookingId: string,
    user?: AuthenticatedUser | null,
    contact?: string,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        OR: [{ id: bookingId }, { bookingCode: bookingId }],
      },
      include: {
        property: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy đơn đặt phòng');
    }

    if (
      user?.managedPropertyId &&
      booking.propertyId !== user.managedPropertyId
    ) {
      throw new ForbiddenException(
        'Không có quyền truy cập thanh toán của cơ sở khác',
      );
    }

    // Authorize read access
    this.authorizeBookingAccess(booking, user, contact);

    const payments = await this.prisma.payment.findMany({
      where: { bookingId: booking.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      booking_id: booking.id,
      booking_code: booking.bookingCode,
      total_price: booking.totalPrice,
      payment_status: booking.paymentStatus,
      booking_status: booking.status,
      bank_code: BANK_CONFIG.bank_code,
      bank_name: BANK_CONFIG.bank_name,
      account_number: BANK_CONFIG.account_number,
      account_holder: BANK_CONFIG.account_holder,
      transfer_content: booking.bookingCode,
      qr_code_url: `https://img.vietqr.io/image/${BANK_CONFIG.bin}-${BANK_CONFIG.account_number}-compact2.png?amount=${booking.totalPrice}&addInfo=${encodeURIComponent(booking.bookingCode)}&accountName=${encodeURIComponent(BANK_CONFIG.account_holder)}`,
      payments: payments.map((p) => ({
        id: p.id,
        payment_method: p.paymentMethod,
        amount: p.amount,
        status: p.status,
        transaction_ref: p.transactionRef,
        paid_at: p.paidAt?.toISOString() ?? null,
        created_at: p.createdAt.toISOString(),
      })),
    };
  }
}
