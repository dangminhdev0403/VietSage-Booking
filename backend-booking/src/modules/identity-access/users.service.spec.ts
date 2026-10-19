import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let auditService: any;

  const mockAdminUser: AuthenticatedUser = {
    id: 'admin-uuid-1',
    username: 'admin',
    role: 'ADMIN',
    permissions: ['admin:access'],
    displayName: 'Super Admin',
    email: 'admin@vietsage.vn',
  };

  const mockPartnerRole = {
    id: 'role-partner-uuid',
    code: 'HOTEL_PARTNER',
    name: 'Hotel & Property Partner',
  };

  const mockAdminRole = {
    id: 'role-admin-uuid',
    code: 'ADMIN',
    name: 'Platform Administrator',
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((cb) => cb(prisma)),
      account: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
      },
      rolePermission: {
        findMany: jest.fn(),
      },
      accountRoleAssignment: {
        upsert: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      property: {
        update: jest.fn(),
      },
      auditEvent: {
        create: jest.fn(),
      },
    };

    auditService = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('listUsers', () => {
    it('should list users with pagination and summary stats', async () => {
      prisma.account.findMany.mockResolvedValue([
        {
          id: 'user-1',
          username: 'owner1',
          displayName: 'Owner 1',
          email: 'owner1@example.com',
          role: 'TRAVELER',
          isActive: true,
          managedPropertyId: 'prop-1',
          managedProperty: {
            id: 'prop-1',
            name: 'Hotel One',
            city: 'Đà Nẵng',
            address: '123 Beach St',
            isActive: false,
          },
          roleAssignments: [],
          auditEvents: [
            {
              metadata: {
                propertyName: 'Hotel One',
                status: 'PENDING',
              },
            },
          ],
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ]);
      prisma.account.count
        .mockResolvedValueOnce(1) // filtered count
        .mockResolvedValueOnce(10) // totalUsers
        .mockResolvedValueOnce(4) // totalPartners
        .mockResolvedValueOnce(2) // totalAdmins
        .mockResolvedValueOnce(1); // totalPending

      const result = await service.listUsers({
        status: 'pending',
        page: 1,
        page_size: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].pending_approval).toBe(true);
      expect(result.summary.total_pending).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('approvePartner', () => {
    it('should promote user to HOTEL_PARTNER and activate property', async () => {
      const mockApplicant = {
        id: 'user-app-1',
        username: 'applicant1',
        displayName: 'Applicant One',
        email: 'app@hotel.vn',
        role: 'TRAVELER',
        managedPropertyId: 'prop-app-1',
        isActive: true,
      };

      prisma.account.findUnique.mockResolvedValue(mockApplicant);
      prisma.role.findUnique.mockImplementation(({ where }: any) => {
        if (where.code === 'HOTEL_PARTNER') return Promise.resolve(mockPartnerRole);
        if (where.code === 'ADMIN') return Promise.resolve(mockAdminRole);
        return Promise.resolve(null);
      });
      prisma.accountRoleAssignment.upsert.mockResolvedValue({});
      prisma.account.update.mockResolvedValue({
        ...mockApplicant,
        role: 'HOTEL_PARTNER',
        managedProperty: {
          id: 'prop-app-1',
          name: 'New Hotel',
          city: 'Phú Quốc',
          address: 'Gành Dầu',
          isActive: true,
        },
        updatedAt: new Date(),
      });
      prisma.property.update.mockResolvedValue({});
      prisma.auditEvent.create.mockResolvedValue({});

      const result = await service.approvePartner(
        'user-app-1',
        { is_active: true },
        mockAdminUser,
      );

      expect(result.role).toBe('HOTEL_PARTNER');
      expect(prisma.accountRoleAssignment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            accountId_roleId: {
              accountId: 'user-app-1',
              roleId: 'role-partner-uuid',
            },
          },
        }),
      );
      expect(prisma.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prop-app-1' },
          data: { isActive: true },
        }),
      );
    });

    it('should throw NotFoundException if account not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(
        service.approvePartner('non-existent', {}, mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserRole', () => {
    it('should prevent admin from demoting themselves', async () => {
      await expect(
        service.updateUserRole(
          mockAdminUser.id,
          { role: 'TRAVELER' },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update user role to ADMIN and assign role', async () => {
      const mockTarget = {
        id: 'target-user',
        username: 'staff1',
        role: 'TRAVELER',
      };
      prisma.account.findUnique.mockResolvedValue(mockTarget);
      prisma.role.findUnique.mockImplementation(({ where }: any) => {
        if (where.code === 'ADMIN') return Promise.resolve(mockAdminRole);
        if (where.code === 'HOTEL_PARTNER') return Promise.resolve(mockPartnerRole);
        return Promise.resolve(null);
      });
      prisma.accountRoleAssignment.upsert.mockResolvedValue({});
      prisma.account.update.mockResolvedValue({
        ...mockTarget,
        role: 'ADMIN',
        updatedAt: new Date(),
      });
      prisma.auditEvent.create.mockResolvedValue({});

      const result = await service.updateUserRole(
        'target-user',
        { role: 'ADMIN' },
        mockAdminUser,
      );

      expect(result.role).toBe('ADMIN');
      expect(prisma.accountRoleAssignment.upsert).toHaveBeenCalled();
    });
  });
});
