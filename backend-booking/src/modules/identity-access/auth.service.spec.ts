import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  GoneException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let auditService: any;

  const mockHotelPartnerAccount = {
    id: 'u0000000-0000-0000-0000-000000000003',
    username: 'partner_test',
    passwordHash: '$2b$10$hashedtestpasswordhash',
    displayName: 'Partner Tester',
    email: 'partner@example.com',
    role: 'HOTEL_PARTNER',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    roleAssignments: [],
  };

  const mockAdminAccount = {
    id: 'u0000000-0000-0000-0000-000000000002',
    username: 'admin_test',
    passwordHash: '$2b$10$hashedtestpasswordhash',
    displayName: 'Admin Tester',
    email: 'admin@example.com',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    roleAssignments: [],
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((cb) => cb(prisma)),
      account: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      property: {
        create: jest.fn(),
      },
      auditEvent: {
        create: jest.fn(),
      },
      refreshSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    auditService = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register (retired)', () => {
    it('should reject registration with GoneException (HTTP 410) as traveler role is retired', async () => {
      await expect(
        service.register({
          username: 'new_user',
          password: 'securePassword123',
          display_name: 'New User',
          email: 'new_user@example.com',
        }),
      ).rejects.toThrow(GoneException);
    });
  });

  describe('registerPartner', () => {
    it('should register a hotel partner and create an inactive property with audit log', async () => {
      prisma.account.findFirst.mockResolvedValue(null);
      prisma.property.create.mockResolvedValue({
        id: 'prop-123',
        name: 'Seaside Resort',
        slug: 'seaside-resort-123',
        city: 'Đà Nẵng',
        address: '123 Beach Road',
        isActive: false,
      });
      prisma.account.create.mockResolvedValue({
        id: 'acc-123',
        username: 'partner_owner',
        displayName: 'Hotel Owner',
        email: 'owner@resort.vn',
        role: 'TRAVELER',
        managedPropertyId: 'prop-123',
        isActive: true,
      });
      prisma.auditEvent.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.registerPartner({
        username: 'partner_owner',
        password: 'Password123!',
        display_name: 'Hotel Owner',
        email: 'owner@resort.vn',
        phone: '0901234567',
        property_name: 'Seaside Resort',
        city: 'Đà Nẵng',
        address: '123 Beach Road',
        description: 'Boutique resort near beach',
      });

      expect(result.account_id).toBe('acc-123');
      expect(result.property_id).toBe('prop-123');
      expect(result.status).toBe('PENDING_APPROVAL');
      expect(prisma.property.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Seaside Resort',
            isActive: false,
          }),
        }),
      );
    });
  });

  describe('validateUser & login', () => {
    it('should return token pair on loginWithValidatedUser for active staff account', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAdminAccount);
      prisma.refreshSession.create.mockResolvedValue({ id: 'ref-1' });

      const tokens = await service.loginWithValidatedUser(
        mockAdminAccount as any,
      );
      expect(tokens.access_token).toBe('mock-jwt-token');
      expect(tokens.account.role).toBe('ADMIN');
    });

    it('should refresh session successfully for active staff account', async () => {
      prisma.refreshSession.findUnique.mockResolvedValue({
        id: 'session-1',
        tokenHash: 'some-hash',
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        account: mockAdminAccount,
      });
      prisma.refreshSession.update.mockResolvedValue({ id: 'session-1' });
      prisma.account.findUnique.mockResolvedValue(mockAdminAccount);
      prisma.refreshSession.create.mockResolvedValue({ id: 'session-2' });

      const result = await service.refresh({
        refresh_token: 'valid-refresh-token',
      });
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.account.role).toBe('ADMIN');
    });

    it('should reject refresh when session is expired', async () => {
      prisma.refreshSession.findUnique.mockResolvedValue({
        id: 'session-1',
        tokenHash: 'some-hash',
        expiresAt: new Date(Date.now() - 100000),
        revokedAt: null,
        account: mockAdminAccount,
      });

      await expect(
        service.refresh({ refresh_token: 'valid-refresh-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return account when credentials match in validateUser for staff (ADMIN)', async () => {
      const passwordHash = await bcrypt.hash('validPassword123', 10);
      prisma.account.findFirst.mockResolvedValue({
        ...mockAdminAccount,
        passwordHash,
      });

      const user = await service.validateUser('admin_test', 'validPassword123');
      expect(user).toBeDefined();
      expect(user?.username).toBe('admin_test');
    });

    it('should return token pair on successful staff login', async () => {
      const passwordHash = await bcrypt.hash('validPassword123', 10);
      prisma.account.findFirst.mockResolvedValue({
        ...mockAdminAccount,
        passwordHash,
      });
      prisma.account.findUnique.mockResolvedValue(mockAdminAccount);
      prisma.refreshSession.create.mockResolvedValue({ id: 'ref-1' });

      const tokens = await service.login({
        username: 'admin_test',
        password: 'validPassword123',
      });
      expect(tokens.access_token).toBe('mock-jwt-token');
      expect(tokens.account.role).toBe('ADMIN');
    });

    it('should return null when password is wrong in validateUser', async () => {
      const passwordHash = await bcrypt.hash('validPassword123', 10);
      prisma.account.findFirst.mockResolvedValue({
        ...mockAdminAccount,
        passwordHash,
      });

      const user = await service.validateUser('admin_test', 'wrongPassword');
      expect(user).toBeNull();
    });

    it('should return null when account is inactive', async () => {
      const passwordHash = await bcrypt.hash('validPassword123', 10);
      prisma.account.findFirst.mockResolvedValue({
        ...mockAdminAccount,
        isActive: false,
        passwordHash,
      });

      const user = await service.validateUser('admin_test', 'validPassword123');
      expect(user).toBeNull();
    });

    it('should throw UnauthorizedException on login when password does not match', async () => {
      const passwordHash = await bcrypt.hash('validPassword123', 10);
      prisma.account.findFirst.mockResolvedValue({
        ...mockAdminAccount,
        passwordHash,
      });

      await expect(
        service.login({
          username: 'admin_test',
          password: 'wrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('profile and password modification', () => {
    it('should update display_name and email for staff account', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAdminAccount);
      prisma.account.update.mockResolvedValue({
        ...mockAdminAccount,
        displayName: 'Updated Admin Name',
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      const result = await service.updateProfile(mockAdminAccount.id, {
        display_name: 'Updated Admin Name',
      });

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: mockAdminAccount.id },
        data: { displayName: 'Updated Admin Name' },
      });
      expect(result.role).toBe('ADMIN');
    });

    it('should change password successfully when old password matches', async () => {
      const oldHash = await bcrypt.hash('oldPassword123', 10);
      prisma.account.findUnique.mockResolvedValue({
        ...mockAdminAccount,
        passwordHash: oldHash,
      });
      prisma.account.update.mockResolvedValue({
        ...mockAdminAccount,
      });

      const result = await service.changePassword(mockAdminAccount.id, {
        old_password: 'oldPassword123',
        new_password: 'newPassword123',
      });

      expect(result.message).toBe('Đổi mật khẩu thành công');
      expect(prisma.account.update).toHaveBeenCalled();
    });

    it('should reject change password when old password is incorrect', async () => {
      const oldHash = await bcrypt.hash('oldPassword123', 10);
      prisma.account.findUnique.mockResolvedValue({
        ...mockAdminAccount,
        passwordHash: oldHash,
      });

      await expect(
        service.changePassword(mockAdminAccount.id, {
          old_password: 'wrongOldPassword',
          new_password: 'newPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return profile with managedPropertyId and accessible_properties for hotel partner', async () => {
      const partnerAccountWithProperty = {
        ...mockHotelPartnerAccount,
        managedPropertyId: 'prop-123',
        roleAssignments: [
          {
            role: {
              rolePermissions: [
                { permissionKey: 'allotments:manage' },
                { permissionKey: 'catalog:read' },
              ],
            },
          },
        ],
      };
      prisma.account.findUnique.mockResolvedValue(partnerAccountWithProperty);

      const profile = await service.getProfile(partnerAccountWithProperty.id);

      expect(profile.role).toBe('HOTEL_PARTNER');
      expect(profile.permissions).toContain('allotments:manage');
      expect(profile.permissions).toContain('catalog:read');
      expect(profile.managedPropertyId).toBe('prop-123');
      expect(profile.accessible_properties).toEqual([
        { id: 'prop-123', name: 'Khách sạn liên kết' },
      ]);
    });

    it('should return empty permissions array when roleAssignments is empty (fail-closed)', async () => {
      const partnerAccountWithEmptyRoles = {
        ...mockHotelPartnerAccount,
        managedPropertyId: 'prop-123',
        roleAssignments: [],
      };
      prisma.account.findUnique.mockResolvedValue(partnerAccountWithEmptyRoles);

      const profile = await service.getProfile(partnerAccountWithEmptyRoles.id);

      expect(profile.role).toBe('HOTEL_PARTNER');
      expect(profile.permissions).toEqual([]);
      expect(profile.managedPropertyId).toBe('prop-123');
    });

    it('should normalize retired SUPER_ADMIN to ADMIN and resolve role permissions', async () => {
      const legacySuperAdmin = {
        id: 'u-legacy-super',
        username: 'superadmin',
        displayName: 'Legacy SuperAdmin',
        email: 'superadmin@example.com',
        role: 'SUPER_ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        roleAssignments: [
          {
            role: {
              rolePermissions: [
                { permissionKey: 'sync:manage' },
                { permissionKey: 'payments:manage' },
              ],
            },
          },
        ],
      };
      prisma.account.findUnique.mockResolvedValue(legacySuperAdmin);

      const profile = await service.getProfile(legacySuperAdmin.id);

      expect(profile.role).toBe('ADMIN');
      expect(profile.permissions).toContain('sync:manage');
      expect(profile.permissions).toContain('payments:manage');
    });
  });
});
