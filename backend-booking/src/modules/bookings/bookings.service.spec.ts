import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../identity-access/audit.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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

  const travelerUser: AuthenticatedUser = {
    id: 'u0000000-0000-0000-0000-000000000001',
    username: 'traveler1',
    displayName: 'Traveler One',
    email: 'traveler1@example.com',
    role: 'TRAVELER',
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

    it('enforces accountId scope strictly for TRAVELER', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.booking.count.mockResolvedValue(0);

      await service.listBookings({}, travelerUser);

      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ accountId: travelerUser.id }),
        }),
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

    it('rejects cancelling a booking that is not in PENDING status', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'b1',
        status: 'CONFIRMED',
        accountId: travelerUser.id,
      });

      const dto = { status: 'CANCELLED', reason: 'Change of plans' };
      await expect(
        service.updateBookingStatus('b1', dto as any, travelerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows cancelling a PENDING booking when requested by owner', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'b1',
        bookingCode: 'OTA-202611-ABC',
        status: 'PENDING',
        accountId: travelerUser.id,
      });
      prisma.booking.update.mockResolvedValue({
        id: 'b1',
        bookingCode: 'OTA-202611-ABC',
        status: 'CANCELLED',
        updatedAt: new Date(),
      });

      const dto = { status: 'CANCELLED', reason: 'Change of plans' };
      const result = await service.updateBookingStatus(
        'b1',
        dto as any,
        travelerUser,
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
        accountId: travelerUser.id,
        roomTypeId: mockRoomType.id,
        checkIn: new Date('2026-11-05T00:00:00.000Z'),
        checkOut: new Date('2026-11-06T00:00:00.000Z'),
      });
      prisma.booking.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateBookingStatus(
          'b1',
          { status: 'CANCELLED' },
          travelerUser,
        ),
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

  describe('lookupBooking - Exact normalized contact lookup', () => {
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
      totalPrice: 10000000,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      specialRequests: null,
      property: mockProperty,
      roomType: mockRoomType,
      addons: [],
      payments: [],
      createdAt: new Date(),
    };

    it('rejects guest phone lookup using substring matching', async () => {
      // Prisma query must not use substring contains
      prisma.booking.findFirst.mockImplementation(({ where }: any) => {
        if (where?.OR) {
          for (const cond of where.OR) {
            if (cond.guestPhone && cond.guestPhone.contains) {
              throw new Error(
                'Forbidden: contains substring search used for phone',
              );
            }
          }
        }
        return Promise.resolve(null);
      });

      await expect(
        service.lookupBooking({
          booking_code: 'OTA-202611-TEST',
          contact: '1234', // Substring of 0912345678
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects in-memory verification if contact is only a substring of phone', async () => {
      prisma.booking.findFirst.mockResolvedValue(bookingInDb);

      await expect(
        service.lookupBooking({
          booking_code: 'OTA-202611-TEST',
          contact: '09123', // Substring prefix, not exact normalized match
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('succeeds when contact matches exact normalized phone across common formatting (+84, spaces, dashes)', async () => {
      prisma.booking.findFirst.mockResolvedValue(bookingInDb);

      // Matches +84 912 345 678
      const res1 = await service.lookupBooking({
        booking_code: 'OTA-202611-TEST',
        contact: '+84 912 345 678',
      });
      expect(res1.booking_code).toBe('OTA-202611-TEST');

      // Matches 0912-345-678
      const res2 = await service.lookupBooking({
        booking_code: 'OTA-202611-TEST',
        contact: '0912-345-678',
      });
      expect(res2.booking_code).toBe('OTA-202611-TEST');

      // Matches standard 0912345678
      const res3 = await service.lookupBooking({
        booking_code: 'OTA-202611-TEST',
        contact: '0912345678',
      });
      expect(res3.booking_code).toBe('OTA-202611-TEST');
    });

    it('succeeds with case-insensitive exact email match', async () => {
      prisma.booking.findFirst.mockResolvedValue(bookingInDb);

      const res = await service.lookupBooking({
        booking_code: 'OTA-202611-TEST',
        contact: 'GUEST.A@EXAMPLE.COM',
      });
      expect(res.booking_code).toBe('OTA-202611-TEST');
      expect(res.guest_email).toBe('guest.a@example.com');
    });
  });
});
