import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';

type JwtPayload = {
  sub: string;
  username: string;
  role: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'booking-manager-secret-key-2026',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const account = await this.prisma.account.findUnique({
      where: { id: payload.sub },
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

    if (
      !account ||
      !account.isActive ||
      (account.role !== 'SUPER_ADMIN' &&
        account.role !== 'ADMIN' &&
        account.role !== 'HOTEL_PARTNER')
    ) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại, đã bị khóa, hoặc không có quyền truy cập hệ thống quản trị',
      );
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
      displayName: account.displayName,
      email: account.email,
      role: account.role as 'SUPER_ADMIN' | 'ADMIN' | 'HOTEL_PARTNER',
      permissions: Array.from(permissions),
    };
  }
}
