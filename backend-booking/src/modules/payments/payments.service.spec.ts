import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../identity-access/audit.service';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;
  let audit: any;

  const validBookingId = 'a0000000-0000-0000-0000-000000000001';
  const nonExistentBookingId = 'f0000000-0000-0000-0000-000000000000';
  const ownerId = 'u0000000-0000-0000-0000-000000000001';

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

  const ownerUser: AuthenticatedUser = {
    id: ownerId,
    role: 'TRAVELER',
    displayName: 'Nguyễn Văn Du Khách',
    email: 'dukhach@aurumhaven.vn',
    username: 'dukhach',
    permissions: [],
  };

  const strangerTraveler: AuthenticatedUser = {
    id: 'u0000000-0000-0000-0000-000000000999',
    role: 'TRAVELER',
    displayName: 'Người Lạ',
    email: 'stranger@example.com',
    username: 'stranger',
    permissions: [],
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
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      account: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    audit = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent for authenticated booking owner', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      const mockCreatedPayment = {
        id: 'pay-001',
        bookingId: mockBooking.id,
        paymentMethod: 'VIETQR',
        amount: mockBooking.totalPrice,
        currency: 'VND',
        status: 'PENDING',
        transactionRef: 'TXN-OTA-202610-ABCD-999999',
        qrCodeUrl: 'https://img.vietqr.io/image/970422-0388889999-compact2.png',
        createdAt: new Date('2026-10-17T03:00:00Z'),
      };
      prisma.payment.create.mockResolvedValue(mockCreatedPayment);

      const result = await service.createPaymentIntent(
        { booking_id: mockBooking.id, payment_method: 'VIETQR' },
        ownerUser,
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
      expect(result.qr_code_url).toContain('img.vietqr.io');
      expect(audit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYMENT_INTENT_CREATED',
          actorId: ownerUser.id,
        }),
      );
    });

    it('should create payment intent for authorized staff (ADMIN)', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      const mockCreatedPayment = {
        id: 'pay-admin',
        bookingId: mockBooking.id,
        paymentMethod: 'VIETQR',
        amount: mockBooking.totalPrice,
        currency: 'VND',
        status: 'PENDING',
        transactionRef: 'TXN-OTA-ADMIN-111111',
        qrCodeUrl: 'https://img.vietqr.io/image/970422-0388889999-compact2.png',
        createdAt: new Date('2026-10-17T03:00:00Z'),
      };
      prisma.payment.create.mockResolvedValue(mockCreatedPayment);

      const result = await service.createPaymentIntent(
        { booking_id: mockBooking.id, payment_method: 'VIETQR' },
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
        paymentMethod: 'VIETQR',
        amount: mockBooking.totalPrice,
        currency: 'VND',
        status: 'PENDING',
        transactionRef: 'TXN-GUEST-001',
        qrCodeUrl: 'https://img.vietqr.io/image/970422-0388889999-compact2.png',
        createdAt: new Date('2026-10-17T03:00:00Z'),
      };
      prisma.payment.create.mockResolvedValue(mockCreatedPayment);

      const result = await service.createPaymentIntent(
        {
          booking_id: mockBooking.id,
          payment_method: 'VIETQR',
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
        paymentMethod: 'VIETQR',
        amount: mockBooking.totalPrice,
        currency: 'VND',
        status: 'PENDING',
        transactionRef: 'TXN-GUEST-PHONE',
        qrCodeUrl: 'https://img.vietqr.io/image/970422-0388889999-compact2.png',
        createdAt: new Date('2026-10-17T03:00:00Z'),
      };
      prisma.payment.create.mockResolvedValue(mockCreatedPayment);

      const result = await service.createPaymentIntent(
        {
          booking_id: mockBooking.id,
          payment_method: 'VIETQR',
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
          { booking_id: mockBooking.id, payment_method: 'VIETQR' },
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
            payment_method: 'VIETQR',
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
            payment_method: 'VIETQR',
            contact: '012345',
          },
          null,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if authenticated traveler does not own the booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.createPaymentIntent(
          { booking_id: mockBooking.id, payment_method: 'VIETQR' },
          strangerTraveler,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent(
          {
            booking_id: nonExistentBookingId,
            payment_method: 'VIETQR',
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
          { booking_id: mockBooking.id, payment_method: 'VIETQR' },
          ownerUser,
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
          { booking_id: mockBooking.id, payment_method: 'VIETQR' },
          ownerUser,
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

    it('should reject client-forged confirmation from regular TRAVELER', async () => {
      await expect(
        service.confirmPayment({ booking_id: mockBooking.id }, ownerUser),
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
  });

  describe('getPaymentByBookingId', () => {
    beforeEach(() => {
      prisma.booking.findFirst.mockResolvedValue(mockBooking);
      prisma.payment.findMany.mockResolvedValue([
        {
          id: 'pay-001',
          bookingId: mockBooking.id,
          paymentMethod: 'VIETQR',
          amount: mockBooking.totalPrice,
          status: 'PENDING',
          transactionRef: 'TXN-001',
          paidAt: null,
          createdAt: new Date('2026-10-17T03:00:00Z'),
        },
      ]);
    });

    it('should return payment info for booking owner', async () => {
      const result = await service.getPaymentByBookingId(
        mockBooking.id,
        ownerUser,
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

    it('should throw ForbiddenException if traveler does not own the booking', async () => {
      await expect(
        service.getPaymentByBookingId(mockBooking.id, strangerTraveler),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);

      await expect(
        service.getPaymentByBookingId('non-existent', adminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
