import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from './authenticated-user';
import {
  ALLOW_AUTHENTICATED_KEY,
  IS_PUBLIC_KEY,
  REQUIRED_PERMISSIONS_KEY,
} from './auth.constants';

function matchSinglePermission(userPermissions: string[], required: string): boolean {
  if (userPermissions.includes('*')) {
    return true;
  }
  if (userPermissions.includes(required)) {
    return true;
  }

  const domain = required.split(':')[0];
  if (userPermissions.includes(`${domain}:*`)) {
    return true;
  }

  // Rollout compatibility mappings for broad legacy keys
  if (required.startsWith('catalog:') && userPermissions.includes('catalog:manage')) {
    return true;
  }
  if (
    required.startsWith('allotments:') &&
    (userPermissions.includes('allotments:manage') || userPermissions.includes('catalog:manage'))
  ) {
    return true;
  }
  if (required.startsWith('bookings:') && userPermissions.includes('bookings:manage')) {
    return true;
  }
  if (required.startsWith('payments:') && userPermissions.includes('payments:manage')) {
    return true;
  }
  if (required.startsWith('sync:') && userPermissions.includes('sync:manage')) {
    return true;
  }

  return false;
}

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

    const allowAuthenticated = this.reflector.getAllAndOverride<boolean>(
      ALLOW_AUTHENTICATED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowAuthenticated) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      throw new ForbiddenException('Endpoint chưa được cấu hình quyền truy cập');
    }

    const userPermissions = user.permissions ?? [];
    if (userPermissions.includes('*')) {
      return true;
    }

    const hasAll = requiredPermissions.every((req) =>
      matchSinglePermission(userPermissions, req),
    );

    if (!hasAll) {
      throw new ForbiddenException('Không có quyền thực hiện thao tác này');
    }

    return true;
  }
}
