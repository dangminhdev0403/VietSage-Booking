import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  GatewayTimeoutException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../identity-access/audit.service';
import { StripeSignatureVerifier } from './stripe-signature.verifier';
import { StripeLocalMateClient } from './stripe-localmate.client';
import { VietSageSyncService } from '../vietsage-sync/vietsage-sync.service';
import { createPaymentIntentSchema } from './dto/payments.dto';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;
  let audit: any;
  let signatureVerifier: StripeSignatureVerifier;
  let stripeClient: StripeLocalMateClient;
  let vietSageSyncService: any;

  const validBookingId = 'a0000000-0000-0000-0000-000000000001';
  const nonExistentBookingId = 'f0000000-0000-0000-0000-000000000000';
  const ownerId = 'u0000000-0000-0000-0000-000000000001';
  const defaultWebhookSecret = 'whsec_test_localmate_secret';

  const generateSignatureHeader = (
    timestamp: number,
    payload: string,
    secret = defaultWebhookSecret,
  ): string => {
    const signed = `${timestamp}.${payload}`;
    const sig = crypto
      .createHmac('sha256', secret)
      .update(signed, 'utf8')
      .digest('hex');
    return `t=${timestamp},v1=${sig}`;
  };

  const mockBooking = {
    id: validBookingId,
    bookingCode: 'OTA-202610-ABCD',
    propertyId: 'p0000000-0000-0000-0000-000000000001',
    roomTypeId: 'r0000000-0000-0000-0000-000000000001',
    accountId: ownerId,
    guestName: 'Nguyễn Văn Du Khách',
    guestEmail: 'dukhach@aurumhaven.vn',
    guestPhone: '0901234567',
    totalPrice: 4500000,
    depositAmount: 1350000,
    depositRateBps: 3000,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    property: {
      id: 'p0000000-0000-0000-0000-000000000001',
      name: 'Legacy Yên Tử MGallery',
    },
    roomType: {
      id: 'r0000000-0000-0000-0000-000000000001',
      name: 'Deluxe Heritage Room',
    },
  };

  const partnerUser: AuthenticatedUser = {
    id: 'partner-001',
    role: 'ADMIN',
    displayName: 'Partner Quản Lý',
    email: 'partner@aurumhaven.vn',
    username: 'partner',
    permissions: [],
    managedPropertyId: mockBooking.propertyId,
  };

  const otherPartnerUser: AuthenticatedUser = {
    id: 'partner-999',
    role: 'ADMIN',
    displayName: 'Đối Tác Khác',
    email: 'other@example.com',
    username: 'other_partner',
    permissions: [],
    managedPropertyId: 'prop-different-999',
  };

  const adminUser: AuthenticatedUser = {
    id: 'admin-001',
    role: 'ADMIN',
    displayName: 'Admin Quản Trị',
    email: 'admin@aurumhaven.vn',
    username: 'admin',
    permissions: ['bookings:manage', 'payments:manage'],
  };

  beforeEach(async () => {
    signatureVerifier = new StripeSignatureVerifier();
    stripeClient = new StripeLocalMateClient();

    prisma = {
      booking: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      payment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      paymentWebhookEvent: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      roomAllotment: {
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      account: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    audit = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    vietSageSyncService = {
      confirmHold: jest.fn(),
      releaseHold: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: StripeSignatureVerifier, useValue: signatureVerifier },
        { provide: StripeLocalMateClient, useValue: stripeClient },
        { provide: VietSageSyncService, useValue: vietSageSyncService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent for authorized hotel partner', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.account.findUnique.mockResolvedValue({
        id: partnerUser.id,
        managedPropertyId: mockBooking.propertyId,
      });
      const mockCreatedPayment = {
        id: 'pay-001',
        bookingId: mockBooking.id,
        paymentMethod: 'BANK_TRANSFER',
        amount: mockBooking.totalPrice,
        currency: 'VND',
        status: 'PENDING',
        transactionRef: 'TXN-OTA-202610-ABCD-999999',
        qrCodeUrl: null,
        createdAt: new Date('2026-10-17T03:00:00Z'),
      };
      prisma.payment.create.mockResolvedValue(mockCreatedPayment);

      const result = await service.createPaymentIntent(
        { booking_id: mockBooking.id, payment_method: 'BANK_TRANSFER' },
        partnerUser,
      );

      expect(prisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: mockBooking.id },
        include: { property: true, roomType: true },
      });
      expect(result.booking_id).toBe(mockBooking.id);
      expect(result.amount).toBe(mockBooking.totalPrice);
      expect(result.bank_code).toBe('MB');
      expect(result.account_number).toBe('0388889999');
      expect(result.transfer_content).toBe(mockBooking.bookingCode);
      expect(result.qr_code_url).toBeNull();
      expect(audit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYMENT_INTENT_CREATED',
          actorId: partnerUser.id,
        }),
      );
    });

    it('should create payment intent for authorized staff (ADMIN)', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      const mockCreatedPayment = {
        id: 'pay-admin',
        bookingId: mockBooking.id,
        paymentMethod: 'BANK_TRANSFER',
        amount: mockBooking.totalPrice,
        currency: 'VND',
        status: 'PENDING',
        transactionRef: 'TXN-OTA-ADMIN-111111',
        qrCodeUrl: null,
        createdAt: new Date('2026-10-17T03:00:00Z'),
      };
      prisma.payment.create.mockResolvedValue(mockCreatedPayment);

      const result = await service.createPaymentIntent(
        { booking_id: mockBooking.id, payment_method: 'BANK_TRANSFER' },
        adminUser,
      );

      expect(result.booking_id).toBe(mockBooking.id);
      expect(audit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYMENT_INTENT_CREATED',
          actorId: adminUser.id,
        }),
      );
    });

    it('should allow unauthenticated guest with valid email contact capability', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      const mockCreatedPayment = {
        id: 'pay-guest',
        bookingId: mockBooking.id,
        paymentMethod: 'BANK_TRANSFER',
        amount: mockBooking.totalPrice,
        currency: 'VND',
        status: 'PENDING',
        transactionRef: 'TXN-GUEST-001',
        qrCodeUrl: null,
        createdAt: new Date('2026-10-17T03:00:00Z'),
      };
      prisma.payment.create.mockResolvedValue(mockCreatedPayment);

      const result = await service.createPaymentIntent(
        {
          booking_id: mockBooking.id,
          payment_method: 'BANK_TRANSFER',
          contact: 'dukhach@aurumhaven.vn',
        },
        null,
      );

      expect(result.booking_id).toBe(mockBooking.id);
    });

    it('should allow unauthenticated guest with valid phone contact capability', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      const mockCreatedPayment = {
        id: 'pay-guest-phone',
        bookingId: mockBooking.id,
        paymentMethod: 'BANK_TRANSFER',
        amount: mockBooking.totalPrice,
        currency: 'VND',
        status: 'PENDING',
        transactionRef: 'TXN-GUEST-PHONE',
        qrCodeUrl: null,
        createdAt: new Date('2026-10-17T03:00:00Z'),
      };
      prisma.payment.create.mockResolvedValue(mockCreatedPayment);

      const result = await service.createPaymentIntent(
        {
          booking_id: mockBooking.id,
          payment_method: 'BANK_TRANSFER',
          contact: '0901234567',
        },
        null,
      );

      expect(result.booking_id).toBe(mockBooking.id);
    });

    it('should throw UnauthorizedException if unauthenticated and no contact provided', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.createPaymentIntent(
          { booking_id: mockBooking.id, payment_method: 'BANK_TRANSFER' },
          null,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if unauthenticated with wrong contact', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.createPaymentIntent(
          {
            booking_id: mockBooking.id,
            payment_method: 'BANK_TRANSFER',
            contact: 'wrong@example.com',
          },
          null,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects a phone substring as guest payment capability', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.createPaymentIntent(
          {
            booking_id: mockBooking.id,
            payment_method: 'BANK_TRANSFER',
            contact: '012345',
          },
          null,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow authenticated staff/admin to create payment intent regardless of property', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue({
        id: 'pay-new-001',
        bookingId: mockBooking.id,
        amount: mockBooking.totalPrice,
        currency: 'VND',
        status: 'PENDING',
        transactionRef: 'TXN-TEST',
        createdAt: new Date('2026-10-17T03:00:00.000Z'),
      });

      const result = await service.createPaymentIntent(
        { booking_id: mockBooking.id, payment_method: 'BANK_TRANSFER' },
        adminUser,
      );
      expect(result.id).toBe('pay-new-001');
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent(
          {
            booking_id: nonExistentBookingId,
            payment_method: 'BANK_TRANSFER',
            contact: 'any@test.com',
          },
          null,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if booking is CANCELLED', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'CANCELLED',
      });

      await expect(
        service.createPaymentIntent(
          { booking_id: mockBooking.id, payment_method: 'BANK_TRANSFER' },
          adminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking is already PAID', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        paymentStatus: 'PAID',
      });

      await expect(
        service.createPaymentIntent(
          { booking_id: mockBooking.id, payment_method: 'BANK_TRANSFER' },
          adminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment when called by authorized staff (ADMIN)', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      });
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.confirmPayment(
        { booking_id: mockBooking.id },
        adminUser,
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.booking.updateMany).toHaveBeenCalledWith({
        where: {
          id: mockBooking.id,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
        },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
        },
      });
      expect(result.payment_status).toBe('PAID');
      expect(result.booking_status).toBe('CONFIRMED');
      expect(audit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYMENT_CONFIRMED',
          actorId: adminUser.id,
        }),
      );
    });

    it('should reject client-forged confirmation from unauthenticated caller', async () => {
      await expect(
        service.confirmPayment({ booking_id: mockBooking.id }, null),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject client-forged confirmation when user is undefined', async () => {
      await expect(
        service.confirmPayment({ booking_id: mockBooking.id }, undefined),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if booking is CANCELLED', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'CANCELLED',
      });

      await expect(
        service.confirmPayment({ booking_id: mockBooking.id }, adminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects confirmation if cancellation won the concurrent state transition', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.confirmPayment({ booking_id: mockBooking.id }, adminUser),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    });

    it('should reject partner confirming payment for a different property', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.confirmPayment(
          { booking_id: mockBooking.id },
          otherPartnerUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listPayments', () => {
    it('should reject unauthenticated request with UnauthorizedException', async () => {
      await expect(service.listPayments(undefined as any, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should list payments globally for admin and redact sensitive fields', async () => {
      const mockPaymentItem = {
        id: 'pay-001',
        bookingId: mockBooking.id,
        paymentMethod: 'BANK_TRANSFER',
        amount: 4500000,
        currency: 'VND',
        purpose: 'DEPOSIT',
        status: 'PENDING',
        providerName: 'STRIPE_LOCALMATE',
        providerSessionId: 'cs_test_sensitive_secret',
        providerPaymentId: 'pi_test_123',
        transactionRef: 'TXN-001',
        qrCodeUrl: 'https://example.com/qr.png',
        expiresAt: new Date('2026-10-18T00:00:00Z'),
        refundedAmount: null,
        rawMetadata: { sensitive_card_info: 'redacted' },
        paidAt: null,
        createdAt: new Date('2026-10-17T00:00:00Z'),
        updatedAt: new Date('2026-10-17T00:00:00Z'),
        booking: {
          id: mockBooking.id,
          bookingCode: mockBooking.bookingCode,
          propertyId: mockBooking.propertyId,
          guestName: mockBooking.guestName,
          property: mockBooking.property,
        },
      };

      prisma.payment.findMany.mockResolvedValue([mockPaymentItem]);
      prisma.payment.count.mockResolvedValue(1);

      const result = await service.listPayments(adminUser, {});

      expect(result.total).toBe(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0].id).toBe('pay-001');
      expect((result.items[0] as any).rawMetadata).toBeUndefined();
      expect((result.items[0] as any).providerSessionId).toBeUndefined();
    });

    it('should scope listPayments to managedPropertyId for partner', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await service.listPayments(partnerUser, {});

      const callArgs = prisma.payment.findMany.mock.calls[0][0];
      expect(callArgs.where.booking).toEqual({
        propertyId: mockBooking.propertyId,
      });
    });

    it('should reject partner querying another propertyId', async () => {
      await expect(
        service.listPayments(partnerUser, { propertyId: 'different-prop-id' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should filter by payment status', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await service.listPayments(adminUser, { status: 'SUCCESS' });

      const callArgs = prisma.payment.findMany.mock.calls[0][0];
      expect(callArgs.where.status).toBe('SUCCESS');
    });
  });

  describe('getPaymentByBookingId', () => {
    beforeEach(() => {
      prisma.booking.findFirst.mockResolvedValue(mockBooking);
      prisma.payment.findMany.mockResolvedValue([
        {
          id: 'pay-001',
          bookingId: mockBooking.id,
          paymentMethod: 'BANK_TRANSFER',
          amount: mockBooking.totalPrice,
          status: 'PENDING',
          transactionRef: 'TXN-001',
          paidAt: null,
          createdAt: new Date('2026-10-17T03:00:00Z'),
        },
      ]);
    });

    it('should return payment info for authorized hotel partner', async () => {
      prisma.account.findUnique.mockResolvedValue({
        id: partnerUser.id,
        managedPropertyId: mockBooking.propertyId,
      });

      const result = await service.getPaymentByBookingId(
        mockBooking.id,
        partnerUser,
      );

      expect(result.booking_id).toBe(mockBooking.id);
      expect(result.total_price).toBe(mockBooking.totalPrice);
      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].status).toBe('PENDING');
    });

    it('should return payment info for authorized staff (ADMIN)', async () => {
      const result = await service.getPaymentByBookingId(
        mockBooking.id,
        adminUser,
      );

      expect(result.booking_id).toBe(mockBooking.id);
    });

    it('should return payment info for guest with valid contact', async () => {
      const result = await service.getPaymentByBookingId(
        mockBooking.id,
        null,
        'dukhach@aurumhaven.vn',
      );

      expect(result.booking_id).toBe(mockBooking.id);
    });

    it('should throw UnauthorizedException if unauthenticated and no contact', async () => {
      await expect(
        service.getPaymentByBookingId(mockBooking.id, null),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should allow authenticated staff/admin to retrieve payment details without property restrictions', async () => {
      prisma.booking.findFirst.mockResolvedValue(mockBooking);

      const result = await service.getPaymentByBookingId(
        mockBooking.id,
        adminUser,
      );
      expect(result.booking_id).toBe(mockBooking.id);
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);

      await expect(
        service.getPaymentByBookingId('non-existent', adminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject partner accessing payment of a different property', async () => {
      prisma.booking.findFirst.mockResolvedValue(mockBooking);

      await expect(
        service.getPaymentByBookingId(mockBooking.id, otherPartnerUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createDepositCheckout', () => {
    it('should create 30% deposit checkout for PENDING unexpired booking and generate localmate idempotency key', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        depositAmount: 1350000,
        holdExpiresAt: new Date(Date.now() + 3600 * 1000),
      });
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, createdAt: new Date() }),
      );

      const result = await service.createDepositCheckout(
        mockBooking.bookingCode,
        undefined,
        'client-idemp-123',
      );

      expect(result.booking_code).toBe(mockBooking.bookingCode);
      expect(result.amount).toBe(1350000);
      expect(result.is_reused).toBe(false);
      expect(result.session_id).toMatch(/^cs_test_/);
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 1350000,
            paymentMethod: 'STRIPE_LOCALMATE',
            rawMetadata: expect.objectContaining({
              idempotencyKey: expect.stringMatching(
                /^localmate:[a-f0-9-]+:checkout:v1$/,
              ),
              callerIdempotencyKey: 'client-idemp-123',
            }),
          }),
        }),
      );
    });

    it('should reuse existing open session if within expiry (1800s)', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        depositAmount: 1350000,
      });

      const futureExpiry = new Date(Date.now() + 1200 * 1000);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay-open-001',
        bookingId: mockBooking.id,
        purpose: 'DEPOSIT',
        status: 'OPEN',
        providerSessionId: 'cs_test_existing_session_456',
        amount: 1350000,
        currency: 'VND',
        expiresAt: futureExpiry,
        rawMetadata: {
          checkoutUrl:
            'https://checkout.stripe.com/c/pay/cs_test_existing_session_456',
        },
      });

      const result = await service.createDepositCheckout(
        mockBooking.bookingCode,
      );

      expect(result.is_reused).toBe(true);
      expect(result.session_id).toBe('cs_test_existing_session_456');
      expect(result.amount).toBe(1350000);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('should reject payment if booking is CANCELLED', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'CANCELLED',
      });

      await expect(
        service.createDepositCheckout(mockBooking.bookingCode),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject payment if booking is already CONFIRMED or PAID', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'CONFIRMED',
        paymentStatus: 'DEPOSIT_PAID',
      });

      await expect(
        service.createDepositCheckout(mockBooking.bookingCode),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject payment if booking hold has expired', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'PENDING',
        holdExpiresAt: new Date(Date.now() - 5000),
      });

      await expect(
        service.createDepositCheckout(mockBooking.bookingCode),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate lookupToken against lookupTokenHash with constant-time check', async () => {
      const lookupToken = 'secret-lookup-token-123';
      const tokenHash = crypto
        .createHash('sha256')
        .update(lookupToken)
        .digest('hex');

      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        lookupTokenHash: tokenHash,
      });
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, createdAt: new Date() }),
      );

      // 1. Missing lookup token
      await expect(
        service.createDepositCheckout(mockBooking.bookingCode, ''),
      ).rejects.toThrow(UnauthorizedException);

      // 2. Wrong lookup token
      await expect(
        service.createDepositCheckout(mockBooking.bookingCode, 'wrong-token'),
      ).rejects.toThrow(ForbiddenException);

      // 3. Valid lookup token
      const result = await service.createDepositCheckout(
        mockBooking.bookingCode,
        lookupToken,
      );
      expect(result.booking_code).toBe(mockBooking.bookingCode);
    });
  });

  describe('handleWebhook', () => {
    const webhookSecret = 'whsec_test_localmate_secret';
    let originalWebhookSecret: string | undefined;

    beforeEach(() => {
      originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
    });

    afterEach(() => {
      if (originalWebhookSecret !== undefined) {
        process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
      } else {
        delete process.env.STRIPE_WEBHOOK_SECRET;
      }
    });

    const generateSignatureHeader = (
      timestamp: number,
      payload: string,
      secret = webhookSecret,
    ): string => {
      const signed = `${timestamp}.${payload}`;
      const sig = crypto
        .createHmac('sha256', secret)
        .update(signed, 'utf8')
        .digest('hex');
      return `t=${timestamp},v1=${sig}`;
    };

    it('should reject webhook with invalid signature', async () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify({ id: 'evt_bad', type: 'test' });
      const badHeader = `t=${now},v1=invalidsignature`;

      await expect(service.handleWebhook(payload, badHeader)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should deduplicate already recorded webhook event', async () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify({
        id: 'evt_dup_001',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_dup' } },
      });
      const header = generateSignatureHeader(now, payload);

      prisma.paymentWebhookEvent.findUnique.mockResolvedValue({
        id: 'evt-rec-1',
        providerEventId: 'evt_dup_001',
        status: 'PROCESSED',
      });

      const result = await service.handleWebhook(payload, header);

      expect(result.duplicate).toBe(true);
      expect(result.status).toBe('PROCESSED');
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('should handle checkout.session.completed with compare-and-set transition PENDING -> CONFIRMING -> CONFIRMED, payment SUCCESS, DEPOSIT_PAID', async () => {
      const now = Math.floor(Date.now() / 1000);
      const sessionId = 'cs_test_completed_123';
      const paymentIntentId = 'pi_test_completed_123';
      const eventPayload = {
        id: 'evt_completed_001',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            client_reference_id: mockBooking.bookingCode,
            payment_status: 'paid',
            amount_total: 1350000,
            currency: 'vnd',
            payment_intent: paymentIntentId,
          },
        },
      };
      const rawBody = JSON.stringify(eventPayload);
      const header = generateSignatureHeader(now, rawBody);

      const mockPaymentRecord = {
        id: 'pay-001',
        bookingId: mockBooking.id,
        amount: 1350000,
        currency: 'VND',
        status: 'OPEN',
        providerSessionId: sessionId,
        booking: mockBooking,
      };

      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue(mockPaymentRecord);
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      });

      const result = await service.handleWebhook(rawBody, header);

      expect(result.received).toBe(true);
      expect(result.status).toBe('PROCESSED');

      // Check CAS: first updateMany PENDING -> CONFIRMING
      expect(prisma.booking.updateMany).toHaveBeenCalledWith({
        where: { id: mockBooking.id, status: 'PENDING' },
        data: { status: 'CONFIRMING' },
      });

      // Then update CONFIRMING -> CONFIRMED with DEPOSIT_PAID
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: mockBooking.id },
        data: { status: 'CONFIRMED', paymentStatus: 'DEPOSIT_PAID' },
      });

      // Payment updated to SUCCESS with paidAt and providerPaymentId
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: mockPaymentRecord.id },
        data: expect.objectContaining({
          status: 'SUCCESS',
          providerPaymentId: paymentIntentId,
        }),
      });

      // Webhook event recorded
      expect(prisma.paymentWebhookEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            providerEventId: 'evt_completed_001',
            status: 'PROCESSED',
          }),
        }),
      );
    });

    it('should transition payment to REFUND_PENDING if booking was CANCELLED before payment captured', async () => {
      const now = Math.floor(Date.now() / 1000);
      const sessionId = 'cs_test_late_pay';
      const eventPayload = {
        id: 'evt_late_pay_001',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            payment_status: 'paid',
            amount_total: 1350000,
            currency: 'vnd',
            payment_intent: 'pi_late',
          },
        },
      };
      const rawBody = JSON.stringify(eventPayload);
      const header = generateSignatureHeader(now, rawBody);

      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay-002',
        bookingId: mockBooking.id,
        amount: 1350000,
        currency: 'VND',
        status: 'OPEN',
      });
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'CANCELLED',
      });

      const result = await service.handleWebhook(rawBody, header);

      expect(result.status).toBe('PROCESSED');
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-002' },
        data: expect.objectContaining({
          status: 'REFUND_PENDING',
        }),
      });
    });

    it('should handle checkout.session.expired by transitioning payment to EXPIRED', async () => {
      const now = Math.floor(Date.now() / 1000);
      const sessionId = 'cs_test_exp_123';
      const eventPayload = {
        id: 'evt_exp_001',
        type: 'checkout.session.expired',
        data: {
          object: {
            id: sessionId,
          },
        },
      };
      const rawBody = JSON.stringify(eventPayload);
      const header = generateSignatureHeader(now, rawBody);

      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay-exp-001',
        bookingId: mockBooking.id,
        status: 'OPEN',
      });

      const result = await service.handleWebhook(rawBody, header);

      expect(result.status).toBe('PROCESSED');
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-exp-001' },
        data: { status: 'EXPIRED' },
      });
    });

    it('should handle charge.refunded by transitioning payment and booking to REFUNDED', async () => {
      const now = Math.floor(Date.now() / 1000);
      const paymentIntentId = 'pi_test_refund_123';
      const eventPayload = {
        id: 'evt_ref_001',
        type: 'charge.refunded',
        data: {
          object: {
            payment_intent: paymentIntentId,
            amount_refunded: 1350000,
          },
        },
      };
      const rawBody = JSON.stringify(eventPayload);
      const header = generateSignatureHeader(now, rawBody);

      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay-ref-001',
        bookingId: mockBooking.id,
        amount: 1350000,
        currency: 'VND',
        status: 'SUCCESS',
      });

      const result = await service.handleWebhook(rawBody, header);

      expect(result.status).toBe('PROCESSED');
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-ref-001' },
        data: { status: 'REFUNDED', refundedAmount: 1350000 },
      });
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: mockBooking.id },
        data: { paymentStatus: 'REFUNDED' },
      });
    });

    it('confirms booking only when payment succeeds AND VietSage confirmHold returns reservation', async () => {
      const now = Math.floor(Date.now() / 1000);
      const sessionId = 'cs_test_vietsage_confirm';
      const eventPayload = {
        id: 'evt_vs_confirm_001',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            payment_status: 'paid',
            amount_total: 1350000,
            currency: 'vnd',
            payment_intent: 'pi_vs_123',
          },
        },
      };
      const rawBody = JSON.stringify(eventPayload);
      const header = generateSignatureHeader(now, rawBody);

      const bookingWithHold = {
        ...mockBooking,
        id: 'b-vs-hold-001',
        holdId: 'vs-hold-active-123',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      };

      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay-vs-001',
        bookingId: bookingWithHold.id,
        amount: 1350000,
        currency: 'VND',
        status: 'OPEN',
        providerSessionId: sessionId,
        booking: bookingWithHold,
      });
      prisma.booking.findUnique.mockResolvedValue(bookingWithHold);

      vietSageSyncService.confirmHold.mockResolvedValue({
        status: 'CONFIRMED',
        reservationId: 'vs-res-confirmed-999',
      });

      const result = await service.handleWebhook(rawBody, header);

      expect(result.status).toBe('PROCESSED');
      expect(vietSageSyncService.confirmHold).toHaveBeenCalledWith(
        'vs-hold-active-123',
        bookingWithHold.id,
      );
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: bookingWithHold.id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'DEPOSIT_PAID',
          vietSageReservationId: 'vs-res-confirmed-999',
        },
      });
    });

    it('saves assigned room number to specialRequests and decrements room allotments when VietSage confirmHold returns assignedRoom', async () => {
      const now = Math.floor(Date.now() / 1000);
      const sessionId = 'cs_test_vietsage_assigned_room';
      const eventPayload = {
        id: 'evt_vs_assigned_001',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            payment_status: 'paid',
            amount_total: 1350000,
            currency: 'vnd',
            payment_intent: 'pi_vs_assigned_001',
          },
        },
      };
      const rawBody = JSON.stringify(eventPayload);
      const header = generateSignatureHeader(now, rawBody);

      const bookingWithAssigned = {
        ...mockBooking,
        id: 'b-vs-assigned-001',
        holdId: 'vs-hold-assigned-123',
        roomTypeId: 'r-test-room-1',
        checkIn: new Date('2026-11-20'),
        checkOut: new Date('2026-11-22'),
        specialRequests: 'Tầng cao yên tĩnh',
      };

      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay-vs-assigned-001',
        bookingId: bookingWithAssigned.id,
        amount: 1350000,
        currency: 'VND',
        status: 'OPEN',
        providerSessionId: sessionId,
        booking: bookingWithAssigned,
      });
      prisma.booking.findUnique.mockResolvedValue(bookingWithAssigned);

      vietSageSyncService.confirmHold.mockResolvedValue({
        status: 'CONFIRMED',
        reservationId: 'vs-res-assigned-888',
        assignedRoom: {
          roomNumber: '405',
          floor: 4,
        },
      });

      const result = await service.handleWebhook(rawBody, header);

      expect(result.status).toBe('PROCESSED');
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: bookingWithAssigned.id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'DEPOSIT_PAID',
          vietSageReservationId: 'vs-res-assigned-888',
          specialRequests: 'Tầng cao yên tĩnh [Phòng gán: 405]',
        },
      });

      expect(prisma.roomAllotment.updateMany).toHaveBeenCalled();
    });

    it('records indeterminate status CONFIRMING and does NOT fail when VietSage confirmHold times out', async () => {
      const now = Math.floor(Date.now() / 1000);
      const sessionId = 'cs_test_vietsage_timeout';
      const eventPayload = {
        id: 'evt_vs_timeout_001',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            payment_status: 'paid',
            amount_total: 1350000,
            currency: 'vnd',
            payment_intent: 'pi_vs_timeout',
          },
        },
      };
      const rawBody = JSON.stringify(eventPayload);
      const header = generateSignatureHeader(now, rawBody);

      const bookingWithHold = {
        ...mockBooking,
        id: 'b-vs-hold-002',
        holdId: 'vs-hold-timeout-456',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      };

      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay-vs-002',
        bookingId: bookingWithHold.id,
        amount: 1350000,
        currency: 'VND',
        status: 'OPEN',
        providerSessionId: sessionId,
        booking: bookingWithHold,
      });
      prisma.booking.findUnique.mockResolvedValue(bookingWithHold);

      vietSageSyncService.confirmHold.mockRejectedValue(
        new GatewayTimeoutException('VietSage request timed out'),
      );

      const result = await service.handleWebhook(rawBody, header);

      expect(result.status).toBe('PROCESSED');
      expect(vietSageSyncService.confirmHold).toHaveBeenCalledWith(
        'vs-hold-timeout-456',
        bookingWithHold.id,
      );
      // CAS step marked it CONFIRMING
      expect(prisma.booking.updateMany).toHaveBeenCalledWith({
        where: { id: bookingWithHold.id, status: 'PENDING' },
        data: { status: 'CONFIRMING' },
      });
      // But update to CONFIRMED was NOT called due to indeterminate timeout outcome
      expect(prisma.booking.update).not.toHaveBeenCalled();
      // Payment was successfully recorded
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-vs-002' },
        data: expect.objectContaining({ status: 'SUCCESS' }),
      });
    });
  });

  describe('VietQR Zero Policy', () => {
    it('verifies zero-VietQR policy: rejects VIETQR payment method in DTO', () => {
      const result = createPaymentIntentSchema.safeParse({
        booking_id: validBookingId,
        payment_method: 'VIETQR',
      });
      expect(result.success).toBe(false);

      const validResult = createPaymentIntentSchema.safeParse({
        booking_id: validBookingId,
        payment_method: 'STRIPE_LOCALMATE',
      });
      expect(validResult.success).toBe(true);
    });
  });
});
