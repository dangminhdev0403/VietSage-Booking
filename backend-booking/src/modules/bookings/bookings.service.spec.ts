import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../identity-access/audit.service';
import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
    email: 'traveler1@example.com',
    role: 'TRAVELER',
    permissions: [],
  };

  const adminUser: AuthenticatedUser = {
    id: 'u0000000-0000-0000-0000-000000000002',
    username: 'admin1',
    email: 'admin1@example.com',
    role: 'ADMIN',
    permissions: ['*'],
  };

  const partnerUser: AuthenticatedUser = {
    id: 'u0000000-0000-0000-0000-000000000003',
    username: 'partner1',
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
      },
      bookingAddon: {
        create: jest.fn(),
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

      await expect(service.createBooking(dto as any)).rejects.toThrow(BadRequestException);
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

      await expect(service.createBooking(dto as any)).rejects.toThrow(BadRequestException);
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

      await expect(service.createBooking(dto as any)).rejects.toThrow(BadRequestException);
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

      const result = await service.createBooking(dto as any);
      expect(result.total_price).toBe(expectedTotal);
      expect(result.nights).toBe(2);
      expect(result.status).toBe('PENDING');
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('listBookings - Authorization & Scope enforcement', () => {
    it('fails closed for HOTEL_PARTNER', async () => {
      await expect(service.listBookings({}, partnerUser)).rejects.toThrow(ForbiddenException);
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
      await expect(service.updateBookingStatus('b1', dto as any, adminUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects cancelling a booking that is not in PENDING status', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'b1',
        status: 'CONFIRMED',
        accountId: travelerUser.id,
      });

      const dto = { status: 'CANCELLED', reason: 'Change of plans' };
      await expect(service.updateBookingStatus('b1', dto as any, travelerUser)).rejects.toThrow(
        BadRequestException,
      );
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
      const result = await service.updateBookingStatus('b1', dto as any, travelerUser);

      expect(result.status).toBe('CANCELLED');
      expect(audit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BOOKING_CANCEL' }),
      );
    });
  });
});
