import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from './authenticated-user';
import { IS_PUBLIC_KEY, REQUIRED_PERMISSIONS_KEY } from './auth.constants';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const userPermissions = user.permissions ?? [];
    if (userPermissions.includes('*')) {
      return true;
    }

    const hasAll = requiredPermissions.every((req) =>
      userPermissions.includes(req) ||
      userPermissions.some((p) => p.endsWith(':*') && req.startsWith(p.slice(0, -1))),
    );

    if (!hasAll) {
      throw new ForbiddenException('Không có quyền thực hiện thao tác này');
    }

    return true;
  }
}
