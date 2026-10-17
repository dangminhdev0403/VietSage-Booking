import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
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

  const mockTravelerAccount = {
    id: 'u0000000-0000-0000-0000-000000000001',
    username: 'traveler_test',
    passwordHash: '$2b$10$hashedtestpasswordhash',
    displayName: 'Traveler Tester',
    email: 'traveler@example.com',
    role: 'TRAVELER',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    roleAssignments: [],
  };

  beforeEach(async () => {
    prisma = {
      account: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
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

  describe('register', () => {
    it('should create account with role TRAVELER when no role is specified', async () => {
      prisma.account.findFirst.mockResolvedValue(null);
      prisma.account.create.mockImplementation(({ data }: any) => ({
        id: 'new-traveler-id',
        ...data,
      }));

      const result = await service.register({
        username: 'new_traveler',
        password: 'securePassword123',
        display_name: 'New Traveler',
        email: 'new_traveler@example.com',
      });

      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: 'new_traveler' },
            { email: 'new_traveler@example.com' },
          ],
        },
      });
      expect(prisma.account.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: 'new_traveler',
            displayName: 'New Traveler',
            email: 'new_traveler@example.com',
            role: 'TRAVELER',
          }),
        }),
      );
      expect(result.role).toBe('TRAVELER');
      expect(auditService.logEvent).toHaveBeenCalled();
    });

    it('should force role to TRAVELER when a privileged role (ADMIN) is submitted', async () => {
      prisma.account.findFirst.mockResolvedValue(null);
      prisma.account.create.mockImplementation(({ data }: any) => ({
        id: 'new-traveler-id',
        ...data,
      }));

      const result = await service.register({
        username: 'sneaky_admin',
        password: 'securePassword123',
        display_name: 'Wants Admin',
        email: 'sneaky@example.com',
        role: 'ADMIN',
      } as any);

      expect(prisma.account.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'TRAVELER',
          }),
        }),
      );
      expect(result.role).toBe('TRAVELER');
    });

    it('should force role to TRAVELER when SUPER_ADMIN or HOTEL_PARTNER is submitted', async () => {
      prisma.account.findFirst.mockResolvedValue(null);
      prisma.account.create.mockImplementation(({ data }: any) => ({
        id: 'new-traveler-id',
        ...data,
      }));

      const resSuper = await service.register({
        username: 'sneaky_super',
        password: 'securePassword123',
        display_name: 'Wants Super Admin',
        email: 'super@example.com',
        role: 'SUPER_ADMIN',
      } as any);
      expect(resSuper.role).toBe('TRAVELER');

      const resPartner = await service.register({
        username: 'sneaky_partner',
        password: 'securePassword123',
        display_name: 'Wants Partner',
        email: 'partner@example.com',
        role: 'HOTEL_PARTNER',
      } as any);
      expect(resPartner.role).toBe('TRAVELER');
    });

    it('should hash password with bcrypt and not store plain password', async () => {
      prisma.account.findFirst.mockResolvedValue(null);
      let savedData: any = null;
      prisma.account.create.mockImplementation(({ data }: any) => {
        savedData = data;
        return { id: 'test-id', ...data };
      });

      await service.register({
        username: 'hash_test_user',
        password: 'plainTextPassword123',
        display_name: 'Hash Tester',
        email: 'hash@example.com',
      });

      expect(savedData.passwordHash).not.toBe('plainTextPassword123');
      const isMatch = await bcrypt.compare(
        'plainTextPassword123',
        savedData.passwordHash,
      );
      expect(isMatch).toBe(true);
    });

    it('should throw ConflictException if username or email already exists', async () => {
      prisma.account.findFirst.mockResolvedValue(mockTravelerAccount);

      await expect(
        service.register({
          username: 'traveler_test',
          password: 'securePassword123',
          display_name: 'Duplicate Traveler',
          email: 'other@example.com',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if registration payload is invalid', async () => {
      await expect(
        service.register({
          username: 'ab', // min length 3
          password: '123', // min length 6
          display_name: 'A',
          email: 'not-an-email',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateUser & login', () => {
    it('should return account when credentials match in validateUser', async () => {
      const passwordHash = await bcrypt.hash('validPassword123', 10);
      prisma.account.findFirst.mockResolvedValue({
        ...mockTravelerAccount,
        passwordHash,
      });

      const user = await service.validateUser(
        'traveler_test',
        'validPassword123',
      );
      expect(user).toBeDefined();
      expect(user?.username).toBe('traveler_test');
    });

    it('should return account when email matches in validateUser', async () => {
      const passwordHash = await bcrypt.hash('validPassword123', 10);
      prisma.account.findFirst.mockResolvedValue({
        ...mockTravelerAccount,
        passwordHash,
      });

      const user = await service.validateUser(
        'traveler@example.com',
        'validPassword123',
      );
      expect(user).toBeDefined();
      expect(user?.username).toBe('traveler_test');
    });

    it('should return null when password is wrong in validateUser', async () => {
      const passwordHash = await bcrypt.hash('validPassword123', 10);
      prisma.account.findFirst.mockResolvedValue({
        ...mockTravelerAccount,
        passwordHash,
      });

      const user = await service.validateUser('traveler_test', 'wrongPassword');
      expect(user).toBeNull();
    });

    it('should return null when account is inactive', async () => {
      const passwordHash = await bcrypt.hash('validPassword123', 10);
      prisma.account.findFirst.mockResolvedValue({
        ...mockTravelerAccount,
        isActive: false,
        passwordHash,
      });

      const user = await service.validateUser(
        'traveler_test',
        'validPassword123',
      );
      expect(user).toBeNull();
    });

    it('should throw UnauthorizedException on login when password does not match', async () => {
      const passwordHash = await bcrypt.hash('validPassword123', 10);
      prisma.account.findFirst.mockResolvedValue({
        ...mockTravelerAccount,
        passwordHash,
      });

      await expect(
        service.login({
          username: 'traveler_test',
          password: 'wrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('profile and password modification', () => {
    it('should update display_name and email without changing role', async () => {
      prisma.account.findUnique.mockResolvedValue(mockTravelerAccount);
      prisma.account.update.mockResolvedValue({
        ...mockTravelerAccount,
        displayName: 'Updated Name',
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      const result = await service.updateProfile(mockTravelerAccount.id, {
        display_name: 'Updated Name',
      });

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: mockTravelerAccount.id },
        data: { displayName: 'Updated Name' },
      });
      expect(result.role).toBe('TRAVELER');
    });

    it('should change password successfully when old password matches', async () => {
      const oldHash = await bcrypt.hash('oldPassword123', 10);
      prisma.account.findUnique.mockResolvedValue({
        ...mockTravelerAccount,
        passwordHash: oldHash,
      });
      prisma.account.update.mockResolvedValue({
        ...mockTravelerAccount,
      });

      const result = await service.changePassword(mockTravelerAccount.id, {
        old_password: 'oldPassword123',
        new_password: 'newPassword123',
      });

      expect(result.message).toBe('Đổi mật khẩu thành công');
      expect(prisma.account.update).toHaveBeenCalled();
    });

    it('should reject change password when old password is incorrect', async () => {
      const oldHash = await bcrypt.hash('oldPassword123', 10);
      prisma.account.findUnique.mockResolvedValue({
        ...mockTravelerAccount,
        passwordHash: oldHash,
      });

      await expect(
        service.changePassword(mockTravelerAccount.id, {
          old_password: 'wrongOldPassword',
          new_password: 'newPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
