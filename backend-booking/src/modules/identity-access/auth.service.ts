import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';
import { LoginDto, loginSchema, RefreshDto, refreshSchema, RegisterDto, registerSchema } from './dto/auth.dto';

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async register(rawDto: RegisterDto) {
    const parsed = registerSchema.safeParse(rawDto);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu đăng ký không hợp lệ',
        details: parsed.error.issues,
      });
    }

    const { username, password, display_name, email, role } = parsed.data;

    const existing = await this.prisma.account.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existing) {
      throw new ConflictException('Tên đăng nhập hoặc email đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const account = await this.prisma.account.create({
      data: {
        username,
        passwordHash,
        displayName: display_name,
        email,
        role: role as any,
      },
    });

    await this.auditService.logEvent({
      actorId: account.id,
      action: 'ACCOUNT_REGISTER',
      boundedContext: 'identity-access',
      resourceType: 'Account',
      resourceId: account.id,
    });

    return {
      id: account.id,
      username: account.username,
      display_name: account.displayName,
      email: account.email,
      role: account.role,
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

    const account = await this.prisma.account.findUnique({
      where: { username },
    });

    if (!account || !account.isActive) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(password, account.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    return this.generateTokenPair(account.id, account.username, account.role);
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const account = await this.prisma.account.findUnique({
      where: { username },
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

  async loginWithValidatedUser(account: any) {
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

    const permissions = new Set<string>();
    for (const assignment of account.roleAssignments) {
      for (const rp of assignment.role.rolePermissions) {
        permissions.add(rp.permissionKey);
      }
    }

    return {
      id: account.id,
      username: account.username,
      display_name: account.displayName,
      email: account.email,
      role: account.role,
      permissions: Array.from(permissions),
      created_at: account.createdAt.toISOString(),
      updated_at: account.updatedAt.toISOString(),
    };
  }

  private async generateTokenPair(
    accountId: string,
    username: string,
    role: string,
  ) {
    const payload = { sub: accountId, username, role };
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
