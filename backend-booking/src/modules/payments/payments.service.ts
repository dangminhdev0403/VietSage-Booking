import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import type { Booking } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../identity-access/audit.service';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import {
  ConfirmPaymentDto,
  confirmPaymentSchema,
  CreatePaymentIntentDto,
  createPaymentIntentSchema,
} from './dto/payments.dto';

const BANK_CONFIG = {
  bank_code: 'MB',
  bin: '970422',
  bank_name: 'MBBank (Napas 247)',
  account_number: '0388889999',
  account_holder: 'AURUM HAVEN RESORT',
};

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private normalizeActor(
    user?: AuthenticatedUser | null,
  ): AuthenticatedUser | null {
    return user ?? null;
  }

  private async authorizeBookingAccess(
    booking: {
      id: string;
      accountId?: string | null;
      propertyId: string;
      guestEmail: string;
      guestPhone: string;
    },
    user?: AuthenticatedUser | null,
    contact?: string,
  ): Promise<void> {
    const actor = this.normalizeActor(user);

    if (actor) {
      if (actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN') {
        return;
      }

      if (actor.role === 'HOTEL_PARTNER') {
        const partnerAccount = this.prisma.account
          ? await this.prisma.account.findUnique({ where: { id: actor.id } })
          : null;
        if (
          partnerAccount?.managedPropertyId &&
          partnerAccount.managedPropertyId === booking.propertyId
        ) {
          return;
        }
        throw new ForbiddenException(
          'Tài khoản đối tác không có quyền truy cập đơn của cơ sở khác',
        );
      }

      if (actor.role === 'TRAVELER') {
        const isOwnerAccount =
          booking.accountId && booking.accountId === actor.id;
        const isOwnerEmail =
          booking.guestEmail &&
          actor.email &&
          booking.guestEmail.toLowerCase() === actor.email.toLowerCase();
        if (isOwnerAccount || isOwnerEmail) {
          return;
        }
        throw new ForbiddenException(
          'Bạn không có quyền truy cập thông tin thanh toán của đơn đặt phòng này',
        );
      }

      throw new ForbiddenException(
        'Quyền hạn không hợp lệ để thao tác thanh toán',
      );
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
    await this.authorizeBookingAccess(booking, user, contact);

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
    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN')) {
      throw new ForbiddenException(
        'Chỉ nhân viên quản trị viên / vận hành mới có quyền xác nhận thanh toán thủ công',
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

    // Authorize read access
    await this.authorizeBookingAccess(booking, user, contact);

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
