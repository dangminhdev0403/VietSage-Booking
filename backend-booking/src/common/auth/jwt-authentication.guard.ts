import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from './authenticated-user';
import { IS_PUBLIC_KEY } from './auth.constants';

@Injectable()
export class JwtAuthenticationGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      const request = context.switchToHttp().getRequest<{
        headers?: { authorization?: string | string[] };
      }>();
      const authorization = request.headers?.authorization;

      // Public endpoints stay anonymous without a token. If a bearer token is
      // present, authenticate it so ownership checks receive request.user.
      if (
        typeof authorization !== 'string' ||
        !authorization.startsWith('Bearer ')
      ) {
        return true;
      }
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = AuthenticatedUser>(
    error: Error | null,
    user: TUser | false,
  ): TUser {
    if (error || !user) {
      throw error ?? new UnauthorizedException('Authentication required');
    }

    return user;
  }
}
