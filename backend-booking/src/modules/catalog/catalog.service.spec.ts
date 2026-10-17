import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';

describe('CatalogService', () => {
  let service: CatalogService;
  let prisma: any;

  const mockPropertyA = {
    id: 'prop-00000000-0000-0000-0000-000000000001',
    name: 'Sanctuary Grand Resort',
    city: 'Da Nang',
    isActive: true,
    roomTypes: [
      {
        id: 'rt-1',
        propertyId: 'prop-00000000-0000-0000-0000-000000000001',
        name: 'Deluxe Ocean',
        basePrice: 2000000,
      },
    ],
  };

  const mockPropertyB = {
    id: 'prop-00000000-0000-0000-0000-000000000002',
    name: 'Metropole Palace',
    city: 'Hanoi',
    isActive: true,
    roomTypes: [
      {
        id: 'rt-2',
        propertyId: 'prop-00000000-0000-0000-0000-000000000002',
        name: 'Executive Suite',
        basePrice: 3500000,
      },
    ],
  };

  const adminUser: AuthenticatedUser = {
    id: 'user-admin',
    username: 'admin',
    displayName: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    permissions: ['*'],
  };

  const superAdminUser: AuthenticatedUser = {
    id: 'user-super-admin',
    username: 'superadmin',
    displayName: 'Super Admin',
    email: 'superadmin@example.com',
    role: 'SUPER_ADMIN',
    permissions: ['*'],
  };

  const partnerUserA: AuthenticatedUser = {
    id: 'user-partner-a',
    username: 'partner_a',
    displayName: 'Partner Sanctuary',
    email: 'partner_a@example.com',
    role: 'HOTEL_PARTNER',
    permissions: [],
  };

  const partnerUserNoProperty: AuthenticatedUser = {
    id: 'user-partner-orphan',
    username: 'partner_orphan',
    displayName: 'Partner Without Property',
    email: 'partner_orphan@example.com',
    role: 'HOTEL_PARTNER',
    permissions: [],
  };

  const unauthorizedUser: AuthenticatedUser = {
    id: 'user-unauthorized',
    username: 'unauthorized',
    displayName: 'Unauthorized User',
    email: 'unauthorized@example.com',
    role: 'UNKNOWN_ROLE' as any,
    permissions: [],
  };

  beforeEach(async () => {
    prisma = {
      property: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      roomType: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      roomAllotment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      account: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CatalogService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  describe('updateAllotment - Partner ownership & Admin authorization', () => {
    it('rejects unauthenticated requests with UnauthorizedException', async () => {
      await expect(
        service.updateAllotment(
          { room_type_id: 'rt-1', date: '2026-10-20', total_rooms: 15 },
          undefined as any,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects unauthorized roles with ForbiddenException', async () => {
      prisma.roomType.findUnique.mockResolvedValue(mockPropertyA.roomTypes[0]);

      await expect(
        service.updateAllotment(
          { room_type_id: 'rt-1', date: '2026-10-20', total_rooms: 15 },
          unauthorizedUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects HOTEL_PARTNER if account has no managedPropertyId mapped', async () => {
      prisma.roomType.findUnique.mockResolvedValue(mockPropertyA.roomTypes[0]);
      prisma.account.findUnique.mockResolvedValue({
        id: partnerUserNoProperty.id,
        managedPropertyId: null,
      });

      await expect(
        service.updateAllotment(
          { room_type_id: 'rt-1', date: '2026-10-20', total_rooms: 15 },
          partnerUserNoProperty,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects HOTEL_PARTNER attempting to update room type of an unmanaged property', async () => {
      // rt-2 belongs to Property B
      prisma.roomType.findUnique.mockResolvedValue(mockPropertyB.roomTypes[0]);
      // partnerUserA manages Property A
      prisma.account.findUnique.mockResolvedValue({
        id: partnerUserA.id,
        managedPropertyId: mockPropertyA.id,
      });

      await expect(
        service.updateAllotment(
          { room_type_id: 'rt-2', date: '2026-10-20', total_rooms: 15 },
          partnerUserA,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows HOTEL_PARTNER to update room types of their managed property', async () => {
      // rt-1 belongs to Property A
      prisma.roomType.findUnique.mockResolvedValue(mockPropertyA.roomTypes[0]);
      prisma.account.findUnique.mockResolvedValue({
        id: partnerUserA.id,
        managedPropertyId: mockPropertyA.id,
      });
      const created = {
        id: 'allot-1',
        roomTypeId: 'rt-1',
        date: new Date('2026-10-20T00:00:00Z'),
        totalRooms: 15,
        bookedRooms: 0,
        price: 2000000,
        isBlocked: false,
      };
      prisma.roomAllotment.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(created)
        .mockResolvedValueOnce(created);

      const result = await service.updateAllotment(
        { room_type_id: 'rt-1', date: '2026-10-20', total_rooms: 15 },
        partnerUserA,
      );

      expect(result.room_type_id).toBe('rt-1');
      expect(result.total_rooms).toBe(15);
      expect(result.available_rooms).toBe(15);
      expect(prisma.roomAllotment.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ skipDuplicates: true }),
      );
    });

    it('allows ADMIN to update room types of any property globally', async () => {
      prisma.roomType.findUnique.mockResolvedValue(mockPropertyB.roomTypes[0]);
      const created = {
        id: 'allot-2',
        roomTypeId: 'rt-2',
        date: new Date('2026-10-25T00:00:00Z'),
        totalRooms: 20,
        bookedRooms: 0,
        price: 3500000,
        isBlocked: false,
      };
      prisma.roomAllotment.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(created)
        .mockResolvedValueOnce(created);

      const result = await service.updateAllotment(
        { room_type_id: 'rt-2', date: '2026-10-25', total_rooms: 20 },
        adminUser,
      );

      expect(result.room_type_id).toBe('rt-2');
      expect(result.total_rooms).toBe(20);
    });

    it('allows SUPER_ADMIN to update room types of any property globally', async () => {
      prisma.roomType.findUnique.mockResolvedValue(mockPropertyA.roomTypes[0]);
      const created = {
        id: 'allot-3',
        roomTypeId: 'rt-1',
        date: new Date('2026-10-25T00:00:00Z'),
        totalRooms: 25,
        bookedRooms: 0,
        price: 2000000,
        isBlocked: false,
      };
      prisma.roomAllotment.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(created)
        .mockResolvedValueOnce(created);

      const result = await service.updateAllotment(
        { room_type_id: 'rt-1', date: '2026-10-25', total_rooms: 25 },
        superAdminUser,
      );

      expect(result.room_type_id).toBe('rt-1');
      expect(result.total_rooms).toBe(25);
    });
  });

  describe('updateAllotment - Date and Quota validation', () => {
    it('rejects invalid date format', async () => {
      await expect(
        service.updateAllotment(
          { room_type_id: 'rt-1', date: 'not-a-date', total_rooms: 10 },
          adminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects non-existent calendar date (e.g. 2026-02-31)', async () => {
      await expect(
        service.updateAllotment(
          { room_type_id: 'rt-1', date: '2026-02-31', total_rooms: 10 },
          adminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an update without any mutable field', async () => {
      await expect(
        service.updateAllotment(
          { room_type_id: 'rt-1', date: '2026-10-20' } as any,
          adminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects setting quota below already booked count', async () => {
      prisma.roomType.findUnique.mockResolvedValue(mockPropertyA.roomTypes[0]);
      prisma.roomAllotment.findUnique.mockResolvedValue({
        id: 'allot-existing',
        roomTypeId: 'rt-1',
        date: new Date('2026-10-20T00:00:00Z'),
        totalRooms: 10,
        bookedRooms: 5,
        price: 2000000,
        isBlocked: false,
      });

      // Attempting to set total_rooms to 4 when bookedRooms is 5
      await expect(
        service.updateAllotment(
          { room_type_id: 'rt-1', date: '2026-10-20', total_rooms: 4 },
          adminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('successfully updates existing allotment when quota >= booked count', async () => {
      prisma.roomType.findUnique.mockResolvedValue(mockPropertyA.roomTypes[0]);
      const existing = {
        id: 'allot-existing',
        roomTypeId: 'rt-1',
        date: new Date('2026-10-20T00:00:00Z'),
        totalRooms: 10,
        bookedRooms: 5,
        price: 2000000,
        isBlocked: false,
      };
      const updated = {
        id: 'allot-existing',
        roomTypeId: 'rt-1',
        date: new Date('2026-10-20T00:00:00Z'),
        totalRooms: 8,
        bookedRooms: 5,
        price: 2200000,
        isBlocked: false,
      };
      prisma.roomAllotment.findUnique
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(updated);

      const res = await service.updateAllotment(
        {
          room_type_id: 'rt-1',
          date: '2026-10-20',
          total_rooms: 8,
          price: 2200000,
        },
        adminUser,
      );

      expect(res.total_rooms).toBe(8);
      expect(res.booked_rooms).toBe(5);
      expect(res.available_rooms).toBe(3);
      expect(res.price).toBe(2200000);
      expect(prisma.roomAllotment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: existing.id,
            bookedRooms: { lte: 8 },
          }),
        }),
      );
    });

    it('rejects a stale quota reduction after a concurrent booking increments capacity', async () => {
      prisma.roomType.findUnique.mockResolvedValue(mockPropertyA.roomTypes[0]);
      prisma.roomAllotment.findUnique.mockResolvedValue({
        id: 'allot-existing',
        roomTypeId: 'rt-1',
        date: new Date('2026-10-20T00:00:00Z'),
        totalRooms: 10,
        bookedRooms: 5,
        price: 2000000,
        isBlocked: false,
      });
      prisma.roomAllotment.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateAllotment(
          { room_type_id: 'rt-1', date: '2026-10-20', total_rooms: 5 },
          adminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('handles concurrent first creation without overwriting booked rooms', async () => {
      prisma.roomType.findUnique.mockResolvedValue(mockPropertyA.roomTypes[0]);
      const concurrent = {
        id: 'allot-concurrent',
        roomTypeId: 'rt-1',
        date: new Date('2026-10-20T00:00:00Z'),
        totalRooms: 10,
        bookedRooms: 1,
        price: 2000000,
        isBlocked: false,
      };
      prisma.roomAllotment.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(concurrent)
        .mockResolvedValueOnce({
          ...concurrent,
          totalRooms: 8,
          price: 2200000,
        });

      const result = await service.updateAllotment(
        {
          room_type_id: 'rt-1',
          date: '2026-10-20',
          total_rooms: 8,
          price: 2200000,
        },
        adminUser,
      );

      expect(prisma.roomAllotment.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ skipDuplicates: true }),
      );
      expect(prisma.roomAllotment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: concurrent.id,
            bookedRooms: { lte: 8 },
          }),
        }),
      );
      expect(result.booked_rooms).toBe(1);
    });
  });

  describe('getPropertyAllotments - Scope and month validation', () => {
    it('rejects unauthenticated reads', async () => {
      await expect(
        service.getPropertyAllotments(mockPropertyA.id),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects HOTEL_PARTNER reads for an unmanaged property', async () => {
      prisma.account.findUnique.mockResolvedValue({
        id: partnerUserA.id,
        managedPropertyId: mockPropertyA.id,
      });

      await expect(
        service.getPropertyAllotments(
          mockPropertyB.id,
          '2026-10',
          partnerUserA,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if property does not exist', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.getPropertyAllotments(
          'non-existent-prop',
          undefined,
          adminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects invalid month format (e.g. "2026-1")', async () => {
      prisma.property.findUnique.mockResolvedValue(mockPropertyA);

      await expect(
        service.getPropertyAllotments(mockPropertyA.id, '2026-1', adminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid month number (e.g. "2026-13" or "2026-00")', async () => {
      prisma.property.findUnique.mockResolvedValue(mockPropertyA);

      await expect(
        service.getPropertyAllotments(mockPropertyA.id, '2026-13', adminUser),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getPropertyAllotments(mockPropertyA.id, '2026-00', adminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns allotments for valid month', async () => {
      prisma.property.findUnique.mockResolvedValue(mockPropertyA);
      prisma.roomAllotment.findMany.mockResolvedValue([
        {
          id: 'allot-1',
          roomTypeId: 'rt-1',
          date: new Date('2026-10-15T00:00:00Z'),
          totalRooms: 10,
          bookedRooms: 2,
          price: 2000000,
          isBlocked: false,
        },
      ]);

      const res = await service.getPropertyAllotments(
        mockPropertyA.id,
        '2026-10',
        adminUser,
      );

      expect(res.property_id).toBe(mockPropertyA.id);
      expect(res.month).toBe('2026-10');
      expect(res.room_types.length).toBe(1);
      expect(res.room_types[0].allotments.length).toBe(1);
      expect(res.room_types[0].allotments[0].available_rooms).toBe(8);
    });
  });
});
