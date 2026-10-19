import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import {
  resolveEffectivePermissions,
  resolveEffectiveRole,
} from '../../common/auth/permission-resolver.helper';

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

    const effectiveRole = resolveEffectiveRole(account.role);
    const permissions = resolveEffectivePermissions(account.roleAssignments);

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
}
