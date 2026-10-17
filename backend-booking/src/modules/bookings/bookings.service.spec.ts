import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../identity-access/audit.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: any;
  let audit: any;

  const mockProperty = {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Luxury Sanctuary',
    isActive: true,
  };

  const mockRoomType = {
    id: 'b0000000-0000-0000-0000-000000000001',
    propertyId: mockProperty.id,
    name: 'Presidential Suite',
    basePrice: 5000000,
    isActive: true,
  };

  const mockAddon = {
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Airport VIP Transfer',
    price: 800000,
    isActive: true,
  };

  const unauthorizedUser: AuthenticatedUser = {
    id: 'u0000000-0000-0000-0000-000000000009',
    username: 'unauthorized',
    displayName: 'Unauthorized User',
    email: 'unauthorized@example.com',
    role: 'UNKNOWN_ROLE' as any,
    permissions: [],
  };

  const adminUser: AuthenticatedUser = {
    id: 'u0000000-0000-0000-0000-000000000002',
    username: 'admin1',
    displayName: 'Platform Admin',
    email: 'admin1@example.com',
    role: 'ADMIN',
    permissions: ['*'],
  };

  const partnerUser: AuthenticatedUser = {
    id: 'u0000000-0000-0000-0000-000000000003',
    username: 'partner1',
    displayName: 'Hotel Partner',
    email: 'partner1@example.com',
    role: 'HOTEL_PARTNER',
    permissions: [],
  };

  beforeEach(async () => {
    prisma = {
      property: {
        findUnique: jest.fn(),
      },
      roomType: {
        findUnique: jest.fn(),
      },
      addonService: {
        findMany: jest.fn(),
      },
      booking: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      bookingAddon: {
        create: jest.fn(),
      },
      roomAllotment: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'allot-default',
          roomTypeId: mockRoomType.id,
          date: new Date('2026-11-05T00:00:00.000Z'),
          totalRooms: 10,
          bookedRooms: 0,
          price: mockRoomType.basePrice,
          isBlocked: false,
        }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    audit = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe('createBooking - Authoritative pricing & validation', () => {
    it('rejects reversed dates (check_out <= check_in)', async () => {
      const dto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-11-05',
        check_out: '2026-11-03',
      };

      await expect(service.createBooking(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects equal check_in and check_out dates', async () => {
      const dto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-11-05',
        check_out: '2026-11-05',
      };

      await expect(service.createBooking(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects rollover date 2026-02-29 (non-leap year)', async () => {
      const dto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-02-29',
        check_out: '2026-03-02',
      };

      await expect(service.createBooking(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects rollover date 2026-02-31', async () => {
      const dto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-02-25',
        check_out: '2026-02-31',
      };

      await expect(service.createBooking(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects room type not belonging to property', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.roomType.findUnique.mockResolvedValue({
        ...mockRoomType,
        propertyId: 'other-property-id',
      });

      const dto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-11-05',
        check_out: '2026-11-07',
      };

      await expect(service.createBooking(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('calculates server total price accurately: basePrice * nights + addons (ignores client-supplied price)', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.roomType.findUnique.mockResolvedValue(mockRoomType);
      prisma.addonService.findMany.mockResolvedValue([mockAddon]);

      // 2 nights: 5,000,000 * 2 = 10,000,000 + 800,000 addon = 10,800,000
      const expectedTotal = 10800000;

      prisma.booking.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: 'booking-uuid-1',
          ...data,
          property: mockProperty,
          roomType: mockRoomType,
          createdAt: new Date(),
        });
      });

      const dto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-11-05',
        check_out: '2026-11-07',
        total_price: 1, // Malicious client attempting to set price to 1 VND
        service_ids: [mockAddon.id],
      };

      const result = await service.createBooking(dto);
      expect(result.total_price).toBe(expectedTotal);
      expect(result.nights).toBe(2);
      expect(result.status).toBe('PENDING');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('sums authoritative daily allotment prices with documented base-price fallback plus addons', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.roomType.findUnique.mockResolvedValue(mockRoomType); // basePrice = 5,000,000
      prisma.addonService.findMany.mockResolvedValue([mockAddon]); // 800,000

      // Stay: 2026-11-01 to 2026-11-04 (3 nights: 11-01, 11-02, 11-03)
      // 2026-11-01: allotment price 6,500,000
      // 2026-11-02: allotment price 7,000,000
      // 2026-11-03: no allotment record (documented base-price fallback: 5,000,000)
      // Addon: 800,000
      // Total expected: 6,500,000 + 7,000,000 + 5,000,000 + 800,000 = 19,300,000
      prisma.roomAllotment.findMany.mockResolvedValue([
        {
          id: 'allot-1',
          roomTypeId: mockRoomType.id,
          date: new Date('2026-11-01T00:00:00.000Z'),
          totalRooms: 10,
          bookedRooms: 2,
          price: 6500000,
          isBlocked: false,
        },
        {
          id: 'allot-2',
          roomTypeId: mockRoomType.id,
          date: new Date('2026-11-02T00:00:00.000Z'),
          totalRooms: 10,
          bookedRooms: 5,
          price: 7000000,
          isBlocked: false,
        },
      ]);

      prisma.booking.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: 'booking-uuid-allot-pricing',
          ...data,
          property: mockProperty,
          roomType: mockRoomType,
          createdAt: new Date(),
        });
      });

      const dto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-11-01',
        check_out: '2026-11-04',
        total_price: 9999, // Should be ignored by server
        service_ids: [mockAddon.id],
      };

      const result = await service.createBooking(dto);
      expect(result.total_price).toBe(19300000);
      expect(result.nights).toBe(3);
    });
  });

  describe('listBookings - Authorization & Scope enforcement', () => {
    it('fails closed for HOTEL_PARTNER', async () => {
      await expect(service.listBookings({}, partnerUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects unauthorized role with ForbiddenException', async () => {
      await expect(service.listBookings({}, unauthorizedUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows ADMIN to query all bookings globally', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.booking.count.mockResolvedValue(0);

      await service.listBookings({}, adminUser);

      const callArgs = prisma.booking.findMany.mock.calls[0][0];
      expect(callArgs.where.accountId).toBeUndefined();
    });
  });

  describe('updateBookingStatus - Transition constraints', () => {
    it('rejects unsupported transitions other than CANCELLED', async () => {
      const dto = { status: 'CONFIRMED' };
      await expect(
        service.updateBookingStatus('b1', dto as any, adminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects unauthorized role with ForbiddenException', async () => {
      const dto = { status: 'CANCELLED', reason: 'Change of plans' };
      await expect(
        service.updateBookingStatus('b1', dto as any, unauthorizedUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects cancelling a booking that is not in PENDING status', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'b1',
        status: 'CONFIRMED',
        accountId: null,
      });

      const dto = { status: 'CANCELLED', reason: 'Change of plans' };
      await expect(
        service.updateBookingStatus('b1', dto as any, adminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows cancelling a PENDING booking when requested by staff', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'b1',
        bookingCode: 'OTA-202611-ABC',
        status: 'PENDING',
        accountId: null,
      });
      prisma.booking.updateMany.mockResolvedValue({ count: 1 });

      const dto = { status: 'CANCELLED', reason: 'Change of plans' };
      const result = await service.updateBookingStatus(
        'b1',
        dto as any,
        adminUser,
      );

      expect(result.status).toBe('CANCELLED');
      expect(audit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BOOKING_CANCEL' }),
      );
    });

    it('does not restore capacity when a concurrent request already cancelled the booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'b1',
        bookingCode: 'OTA-202611-ABC',
        status: 'PENDING',
        accountId: null,
        roomTypeId: mockRoomType.id,
        checkIn: new Date('2026-11-05T00:00:00.000Z'),
        checkOut: new Date('2026-11-06T00:00:00.000Z'),
      });
      prisma.booking.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateBookingStatus('b1', { status: 'CANCELLED' }, adminUser),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.roomAllotment.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('createBooking - Concurrency-safe capacity reservation', () => {
    it('rejects booking creation when room allotment is already fully booked', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.roomType.findUnique.mockResolvedValue(mockRoomType);

      prisma.roomAllotment.findMany.mockResolvedValue([
        {
          id: 'allot-full',
          roomTypeId: mockRoomType.id,
          date: new Date('2026-11-05T00:00:00.000Z'),
          totalRooms: 10,
          bookedRooms: 10, // Full capacity reached!
          price: 5000000,
          isBlocked: false,
        },
      ]);

      const dto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-11-05',
        check_out: '2026-11-06',
      };

      await expect(service.createBooking(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects booking creation when room allotment is blocked', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.roomType.findUnique.mockResolvedValue(mockRoomType);

      prisma.roomAllotment.findMany.mockResolvedValue([
        {
          id: 'allot-blocked',
          roomTypeId: mockRoomType.id,
          date: new Date('2026-11-05T00:00:00.000Z'),
          totalRooms: 10,
          bookedRooms: 0,
          price: 5000000,
          isBlocked: true, // Blocked!
        },
      ]);

      const dto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-11-05',
        check_out: '2026-11-06',
      };

      await expect(service.createBooking(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('prevents concurrent creates from exceeding capacity when conditional updateMany yields 0 updated rows', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.roomType.findUnique.mockResolvedValue(mockRoomType);

      // Initial check passes (bookedRooms = 9 < totalRooms = 10)
      prisma.roomAllotment.findMany.mockResolvedValue([
        {
          id: 'allot-race',
          roomTypeId: mockRoomType.id,
          date: new Date('2026-11-05T00:00:00.000Z'),
          totalRooms: 10,
          bookedRooms: 9,
          price: 5000000,
          isBlocked: false,
        },
      ]);

      // In transaction, findUnique retrieves the record
      prisma.roomAllotment.findUnique.mockResolvedValue({
        id: 'allot-race',
        roomTypeId: mockRoomType.id,
        date: new Date('2026-11-05T00:00:00.000Z'),
        totalRooms: 10,
        bookedRooms: 9,
        price: 5000000,
        isBlocked: false,
      });

      // Concurrent transaction just committed taking the last room, so conditional
      // updateMany (bookedRooms: { lt: 10 }) updates 0 rows
      prisma.roomAllotment.updateMany.mockResolvedValue({ count: 0 });

      const dto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-11-05',
        check_out: '2026-11-06',
      };

      await expect(service.createBooking(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('initializes a missing allotment without a unique-violation retry', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.roomType.findUnique.mockResolvedValue(mockRoomType);
      prisma.roomAllotment.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'allot-created-concurrently',
          roomTypeId: mockRoomType.id,
          date: new Date('2026-11-05T00:00:00.000Z'),
          totalRooms: 10,
          bookedRooms: 0,
          price: mockRoomType.basePrice,
          isBlocked: false,
        });
      prisma.booking.create.mockImplementation(({ data }: any) => ({
        id: 'booking-missing-allotment',
        ...data,
        property: mockProperty,
        roomType: mockRoomType,
        paymentStatus: 'UNPAID',
        createdAt: new Date(),
      }));

      await service.createBooking({
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-11-05',
        check_out: '2026-11-06',
      });

      expect(prisma.roomAllotment.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ skipDuplicates: true }),
      );
      expect(prisma.roomAllotment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'allot-created-concurrently',
            bookedRooms: { lt: 10 },
          }),
        }),
      );
    });
  });

  describe('createBooking - Deposit calculation & Idempotency', () => {
    it('returns raw lookup token once, calculates 30% deposit and 70% balance due deterministically', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.roomType.findUnique.mockResolvedValue(mockRoomType); // basePrice = 5,000,000
      prisma.addonService.findMany.mockResolvedValue([mockAddon]); // 800,000

      // 2 nights: 10,000,000 + 800,000 = 10,800,000 VND
      // 30% deposit = 3,240,000 VND, balance due = 7,560,000 VND
      prisma.booking.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: 'booking-deposit-test',
          ...data,
          property: mockProperty,
          roomType: mockRoomType,
          createdAt: new Date(),
        });
      });

      const dto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-11-05',
        check_out: '2026-11-07',
        service_ids: [mockAddon.id],
      };

      const result = await service.createBooking(dto);

      expect(result.total_price).toBe(10800000);
      expect(result.deposit_rate_bps).toBe(3000);
      expect(result.deposit_amount).toBe(3240000);
      expect(result.balance_due).toBe(7560000);
      expect(result.currency).toBe('VND');
      expect(result.status).toBe('PENDING');
      expect(result.payment_status).toBe('UNPAID');

      // High-entropy random lookup token (32 bytes = 64 hex characters)
      expect(result.lookup_token).toBeDefined();
      expect(result.lookup_token).toHaveLength(64);

      // Verify DB creation saved hash, not raw token, and set accountId to null
      expect(prisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: null,
            depositRateBps: 3000,
            depositAmount: 3240000,
            balanceDue: 7560000,
            lookupTokenHash: expect.any(String),
          }),
        }),
      );
    });

    it('idempotency: same key + same payload returns existing booking without re-running transaction', async () => {
      const idempotencyKey = 'idem-key-12345';
      const existingBooking = {
        id: 'existing-b1',
        bookingCode: 'OTA-202611-EXIST',
        propertyId: mockProperty.id,
        roomTypeId: mockRoomType.id,
        guestName: 'Nguyen Van A',
        guestEmail: 'guest@example.com',
        guestPhone: '0912345678',
        checkIn: new Date('2026-11-05T00:00:00.000Z'),
        checkOut: new Date('2026-11-07T00:00:00.000Z'),
        nights: 2,
        totalPrice: 10000000,
        roomSubtotal: 10000000,
        addonSubtotal: 0,
        depositRateBps: 3000,
        depositAmount: 3000000,
        balanceDue: 7000000,
        currency: 'VND',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        idempotencyKey,
        requestFingerprint: null,
        property: mockProperty,
        roomType: mockRoomType,
        addons: [],
        payments: [],
        createdAt: new Date(),
      };

      const sortedServices: string[] = [];
      const fingerprintPayload = JSON.stringify({
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-11-05',
        check_out: '2026-11-07',
        service_ids: sortedServices,
      });
      const expectedFingerprint = crypto
        .createHash('sha256')
        .update(fingerprintPayload)
        .digest('hex');

      existingBooking.requestFingerprint = expectedFingerprint as any;

      prisma.booking.findFirst.mockResolvedValue(existingBooking);

      const dto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-11-05',
        check_out: '2026-11-07',
        idempotency_key: idempotencyKey,
      };

      const result = await service.createBooking(dto);
      expect(result.id).toBe('existing-b1');
      expect(result.booking_code).toBe('OTA-202611-EXIST');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('idempotency conflict: same key + different payload throws ConflictException (409)', async () => {
      const idempotencyKey = 'idem-key-conflict';
      prisma.booking.findFirst.mockResolvedValue({
        id: 'existing-b2',
        idempotencyKey,
        requestFingerprint: 'different-fingerprint-hash',
        property: mockProperty,
        roomType: mockRoomType,
        addons: [],
        payments: [],
      });

      const dto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        guest_name: 'Nguyen Van A',
        guest_email: 'guest@example.com',
        guest_phone: '0912345678',
        check_in: '2026-11-05',
        check_out: '2026-11-07',
        idempotency_key: idempotencyKey,
      };

      await expect(service.createBooking(dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getQuote - Authoritative quote calculation', () => {
    it('calculates quote with daily allotment prices, base-price fallback, addons, 30% deposit and 15-minute expiry', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.roomType.findUnique.mockResolvedValue(mockRoomType); // basePrice = 5,000,000
      prisma.addonService.findMany.mockResolvedValue([mockAddon]); // 800,000

      // Stay: 2 nights
      // Day 1: 6,000,000 allotment
      // Day 2: base price fallback (5,000,000)
      prisma.roomAllotment.findMany.mockResolvedValue([
        {
          id: 'allot-quote-1',
          roomTypeId: mockRoomType.id,
          date: new Date('2026-11-05T00:00:00.000Z'),
          totalRooms: 10,
          bookedRooms: 2,
          price: 6000000,
          isBlocked: false,
        },
      ]);

      const quoteDto = {
        property_id: mockProperty.id,
        room_type_id: mockRoomType.id,
        check_in: '2026-11-05',
        check_out: '2026-11-07',
        guests: 2,
        service_ids: [mockAddon.id],
      };

      const quote = await service.getQuote(quoteDto);

      expect(quote.property_id).toBe(mockProperty.id);
      expect(quote.room_type_id).toBe(mockRoomType.id);
      expect(quote.nights).toBe(2);
      expect(quote.daily_prices).toEqual([
        { date: '2026-11-05', price: 6000000 },
        { date: '2026-11-06', price: 5000000 },
      ]);
      expect(quote.room_subtotal).toBe(11000000);
      expect(quote.addon_subtotal).toBe(800000);
      expect(quote.total_price).toBe(11800000);
      expect(quote.deposit_rate_bps).toBe(3000);
      expect(quote.deposit_amount).toBe(3540000); // 11,800,000 * 0.3
      expect(quote.balance_due).toBe(8260000); // 11,800,000 - 3,540,000
      expect(quote.currency).toBe('VND');
      expect(quote.is_available).toBe(true);
      expect(quote.expires_at).toBeDefined();

      const expiryDiff = new Date(quote.expires_at).getTime() - Date.now();
      expect(expiryDiff).toBeGreaterThan(14 * 60 * 1000);
      expect(expiryDiff).toBeLessThanOrEqual(15 * 60 * 1000 + 5000);
    });

    it('rejects quote when check_out <= check_in', async () => {
      await expect(
        service.getQuote({
          property_id: mockProperty.id,
          room_type_id: mockRoomType.id,
          check_in: '2026-11-07',
          check_out: '2026-11-05',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects quote when guest count exceeds room capacity', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.roomType.findUnique.mockResolvedValue({
        ...mockRoomType,
        maxGuests: 2,
      });

      await expect(
        service.getQuote({
          property_id: mockProperty.id,
          room_type_id: mockRoomType.id,
          check_in: '2026-11-05',
          check_out: '2026-11-07',
          guests: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects quote when allotment is blocked or fully booked', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.roomType.findUnique.mockResolvedValue(mockRoomType);
      prisma.roomAllotment.findMany.mockResolvedValue([
        {
          id: 'allot-q-full',
          roomTypeId: mockRoomType.id,
          date: new Date('2026-11-05T00:00:00.000Z'),
          totalRooms: 10,
          bookedRooms: 10,
          price: 5000000,
          isBlocked: false,
        },
      ]);

      await expect(
        service.getQuote({
          property_id: mockProperty.id,
          room_type_id: mockRoomType.id,
          check_in: '2026-11-05',
          check_out: '2026-11-06',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('lookupBooking - Secure constant-time token lookup', () => {
    const rawSecretToken = 'a'.repeat(64);
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawSecretToken)
      .digest('hex');

    const bookingInDb = {
      id: 'b-lookup-test-1',
      bookingCode: 'OTA-202611-TEST',
      propertyId: mockProperty.id,
      roomTypeId: mockRoomType.id,
      guestName: 'Nguyen Van A',
      guestEmail: 'guest.a@example.com',
      guestPhone: '0912345678',
      checkIn: new Date('2026-11-05T00:00:00.000Z'),
      checkOut: new Date('2026-11-07T00:00:00.000Z'),
      nights: 2,
      roomSubtotal: 10000000,
      addonSubtotal: 0,
      totalPrice: 10000000,
      depositRateBps: 3000,
      depositAmount: 3000000,
      balanceDue: 7000000,
      currency: 'VND',
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      specialRequests: null,
      lookupTokenHash: tokenHash,
      property: mockProperty,
      roomType: mockRoomType,
      addons: [],
      payments: [],
      createdAt: new Date(),
    };

    it('rejects lookup when token is missing with NotFoundException', async () => {
      await expect(
        service.lookupBooking({
          booking_code: 'OTA-202611-TEST',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects lookup when token does not match hash with generic NotFoundException', async () => {
      prisma.booking.findFirst.mockResolvedValue(bookingInDb);

      const wrongToken = 'b'.repeat(64);
      await expect(
        service.lookupBooking({
          booking_code: 'OTA-202611-TEST',
          lookup_token: wrongToken,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('succeeds and returns redacted booking when token matches SHA-256 hash in constant time', async () => {
      prisma.booking.findFirst.mockResolvedValue(bookingInDb);

      const result = await service.lookupBooking({
        booking_code: 'OTA-202611-TEST',
        lookup_token: rawSecretToken,
      });

      expect(result.booking_code).toBe('OTA-202611-TEST');
      expect(result.total_price).toBe(10000000);
      expect(result.deposit_amount).toBe(3000000);
      expect(result.balance_due).toBe(7000000);
      // Redaction check: internal hashes must not be leaked
      expect((result as any).lookupTokenHash).toBeUndefined();
      expect((result as any).requestFingerprint).toBeUndefined();
    });

    it('supports (bookingCode, lookupToken) method signature directly', async () => {
      prisma.booking.findFirst.mockResolvedValue(bookingInDb);

      const result = await service.lookupBooking(
        'OTA-202611-TEST',
        rawSecretToken,
      );
      expect(result.booking_code).toBe('OTA-202611-TEST');
    });
  });

  describe('cancelBooking - Pre-payment cancellation and allotment release', () => {
    const rawSecretToken = 'c'.repeat(64);
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawSecretToken)
      .digest('hex');

    const pendingBooking = {
      id: 'b-cancel-test-1',
      bookingCode: 'OTA-202611-CANCEL',
      propertyId: mockProperty.id,
      roomTypeId: mockRoomType.id,
      checkIn: new Date('2026-11-05T00:00:00.000Z'),
      checkOut: new Date('2026-11-06T00:00:00.000Z'),
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      lookupTokenHash: tokenHash,
    };

    it('rejects cancellation when token is invalid or missing with NotFoundException', async () => {
      prisma.booking.findFirst.mockResolvedValue(pendingBooking);

      await expect(
        service.cancelBooking('OTA-202611-CANCEL', 'wrong-token'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects cancellation when booking status is not PENDING with BadRequestException', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        ...pendingBooking,
        status: 'CONFIRMED',
      });

      await expect(
        service.cancelBooking('OTA-202611-CANCEL', rawSecretToken),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects cancellation when booking paymentStatus is not UNPAID with BadRequestException', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        ...pendingBooking,
        paymentStatus: 'DEPOSIT_PAID',
      });

      await expect(
        service.cancelBooking('OTA-202611-CANCEL', rawSecretToken),
      ).rejects.toThrow(BadRequestException);
    });

    it('succeeds for PENDING unpaid booking: transitions to CANCELLED and releases allotment', async () => {
      prisma.booking.findFirst.mockResolvedValue(pendingBooking);
      prisma.booking.updateMany.mockResolvedValue({ count: 1 });
      prisma.roomAllotment.findUnique.mockResolvedValue({
        id: 'allot-cancel-release',
        bookedRooms: 2,
      });

      const result = await service.cancelBooking(
        'OTA-202611-CANCEL',
        rawSecretToken,
        'Guest changed itinerary',
      );

      expect(result.status).toBe('CANCELLED');
      expect(result.booking_code).toBe('OTA-202611-CANCEL');
      expect(prisma.roomAllotment.updateMany).toHaveBeenCalledWith({
        where: { id: 'allot-cancel-release', bookedRooms: { gt: 0 } },
        data: { bookedRooms: { decrement: 1 } },
      });
      expect(audit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'BOOKING_CANCEL',
          actorId: 'ANONYMOUS_GUEST',
        }),
      );
    });
  });
});
