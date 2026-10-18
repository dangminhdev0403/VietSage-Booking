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

    if (!account || !account.isActive) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại hoặc đã bị khóa',
      );
    }

    const assignedPermissions = account.roleAssignments?.flatMap((assignment) =>
      assignment.role?.rolePermissions?.map((rp) => rp.permissionKey) ?? [],
    ) ?? [];

    const effectiveRole = account.role === 'SUPER_ADMIN' ? 'ADMIN' : account.role;
    const permissions = assignedPermissions.length > 0
      ? Array.from(new Set(assignedPermissions))
      : this.resolvePermissionsForRole(effectiveRole);

    return {
      id: account.id,
      username: account.username,
      displayName: account.displayName,
      email: account.email,
      role: effectiveRole,
      permissions,
      managedPropertyId: account.managedPropertyId ?? null,
    };
  }

  private resolvePermissionsForRole(role: string): string[] {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return [
          'admin:access',
          'catalog:read',
          'catalog:manage',
          'allotments:read',
          'allotments:manage',
          'bookings:read',
          'bookings:manage',
          'payments:read',
          'payments:manage',
          'sync:manage',
        ];
      case 'HOTEL_PARTNER':
        return [
          'admin:access',
          'catalog:read',
          'catalog:manage',
          'allotments:read',
          'allotments:manage',
          'bookings:read',
          'bookings:manage',
          'payments:read',
        ];
      default:
        return [];
    }
  }
}
