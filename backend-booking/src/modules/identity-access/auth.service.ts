import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { Account } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';
import {
  ChangePasswordDto,
  changePasswordSchema,
  LoginDto,
  loginSchema,
  RefreshDto,
  refreshSchema,
  RegisterDto,
  RegisterPartnerDto,
  registerPartnerSchema,
  UpdateProfileDto,
  updateProfileSchema,
} from './dto/auth.dto';
import {
  resolveEffectivePermissions,
  resolveEffectiveRole,
} from '../../common/auth/permission-resolver.helper';

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  register(_rawDto?: RegisterDto): Promise<never> {
    void _rawDto;
    return Promise.reject(
      new GoneException(
        'Đăng ký tài khoản khách công khai đã ngừng hoạt động (TRAVELER role retired)',
      ),
    );
  }

  async registerPartner(rawDto: RegisterPartnerDto) {
    const parsed = registerPartnerSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu đăng ký đối tác không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const {
      username,
      password,
      display_name,
      email,
      phone,
      property_name,
      city,
      address,
      description,
    } = parsed.data;

    const existing = await this.prisma.account.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existing) {
      if (existing.username === username) {
        throw new ConflictException('Tên đăng nhập đã được sử dụng');
      }
      throw new ConflictException('Email đã được đăng ký trên hệ thống');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const cleanName = property_name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    const slug = `${cleanName || 'hotel'}-${Date.now()}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: {
          name: property_name,
          slug,
          city,
          address,
          description: description || null,
          isActive: false,
        },
      });

      const account = await tx.account.create({
        data: {
          username,
          passwordHash,
          displayName: display_name,
          email,
          role: 'TRAVELER',
          managedPropertyId: property.id,
          isActive: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorId: account.id,
          action: 'PARTNER_REGISTRATION_SUBMITTED',
          boundedContext: 'identity-access',
          resourceType: 'Account',
          resourceId: account.id,
          metadata: {
            propertyName: property_name,
            propertyId: property.id,
            city,
            address,
            phone: phone || null,
            description: description || null,
            status: 'PENDING',
          },
        },
      });

      return { account, property };
    });

    return {
      message:
        'Đăng ký đối tác thành công! Đơn đăng ký của bạn đang chờ Ban quản trị duyệt.',
      account_id: result.account.id,
      property_id: result.property.id,
      username: result.account.username,
      status: 'PENDING_APPROVAL',
    };
  }


  async login(rawDto: LoginDto) {
    const parsed = loginSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu đăng nhập không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const { username, password } = parsed.data;

    const account = await this.prisma.account.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!account || !account.isActive) {
      throw new UnauthorizedException(
        'Tên đăng nhập hoặc mật khẩu không chính xác',
      );
    }

    const isMatch = await bcrypt.compare(password, account.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException(
        'Tên đăng nhập hoặc mật khẩu không chính xác',
      );
    }

    return this.generateTokenPair(account.id, account.username, account.role);
  }

  async validateUser(
    usernameOrEmail: string,
    pass: string,
  ): Promise<Account | null> {
    const account = await this.prisma.account.findFirst({
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
    });

    if (!account || !account.isActive) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, account.passwordHash);
    if (!isMatch) {
      return null;
    }

    return account;
  }

  async loginWithValidatedUser(account: Account) {
    return this.generateTokenPair(account.id, account.username, account.role);
  }

  async refresh(rawDto: RefreshDto) {
    const parsed = refreshSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Refresh token không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const tokenHash = this.hashToken(parsed.data.refresh_token);

    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { account: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
    }

    // Revoke used refresh session
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokenPair(
      session.account.id,
      session.account.username,
      session.account.role,
    );
  }

  async getProfile(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        roleAssignments: {
          include: {
            role: {
              include: {
                rolePermissions: true,
              },
            },
          },
        },
      },
    });

    if (!account) {
      throw new UnauthorizedException('Không tìm thấy tài khoản');
    }

    const effectiveRole = resolveEffectiveRole(account.role);
    const permissions = resolveEffectivePermissions(account.roleAssignments);

    return {
      id: account.id,
      username: account.username,
      display_name: account.displayName,
      email: account.email,
      role: effectiveRole,
      permissions,
      managedPropertyId: account.managedPropertyId ?? null,
      managed_property_id: account.managedPropertyId ?? null,
      accessible_properties: account.managedPropertyId
        ? [{ id: account.managedPropertyId, name: 'Khách sạn liên kết' }]
        : [],
      created_at: account.createdAt.toISOString(),
      updated_at: account.updatedAt.toISOString(),
    };
  }

  async updateProfile(accountId: string, rawDto: UpdateProfileDto) {
    const parsed = updateProfileSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu cập nhật hồ sơ không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const { display_name, email } = parsed.data;

    const existing = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!existing) {
      throw new UnauthorizedException('Không tìm thấy tài khoản');
    }

    if (email && email !== existing.email) {
      const emailUsed = await this.prisma.account.findUnique({
        where: { email },
      });
      if (emailUsed) {
        throw new ConflictException(
          'Email này đã được sử dụng bởi tài khoản khác',
        );
      }
    }

    const updated = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        ...(display_name ? { displayName: display_name } : {}),
        ...(email ? { email } : {}),
      },
    });

    await this.auditService.logEvent({
      actorId: accountId,
      action: 'PROFILE_UPDATE',
      boundedContext: 'identity-access',
      resourceType: 'Account',
      resourceId: accountId,
    });

    return {
      id: updated.id,
      username: updated.username,
      display_name: updated.displayName,
      email: updated.email,
      role: (updated.role as string) === 'SUPER_ADMIN' ? 'ADMIN' : updated.role,
      updated_at: updated.updatedAt.toISOString(),
    };
  }

  async changePassword(accountId: string, rawDto: ChangePasswordDto) {
    const parsed = changePasswordSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu đổi mật khẩu không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const { old_password, new_password } = parsed.data;

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new UnauthorizedException('Không tìm thấy tài khoản');
    }

    const isMatch = await bcrypt.compare(old_password, account.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const newHash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await this.prisma.account.update({
      where: { id: accountId },
      data: { passwordHash: newHash },
    });

    await this.auditService.logEvent({
      actorId: accountId,
      action: 'PASSWORD_CHANGE',
      boundedContext: 'identity-access',
      resourceType: 'Account',
      resourceId: accountId,
    });

    return {
      message: 'Đổi mật khẩu thành công',
    };
  }

  private async generateTokenPair(
    accountId: string,
    username: string,
    role: string,
  ) {
    const effectiveRole = resolveEffectiveRole(role);
    const payload = { sub: accountId, username, role: effectiveRole };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    await this.prisma.refreshSession.create({
      data: {
        accountId,
        tokenHash,
        expiresAt,
      },
    });

    const account = await this.getProfile(accountId);

    return {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
      expires_in: 3600,
      account,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
