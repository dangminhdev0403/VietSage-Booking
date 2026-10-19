import { ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from './authenticated-user';

export function resolvePropertyScope(
  user: AuthenticatedUser,
  requestedPropertyId?: string,
): { propertyId?: string } {
  const role = user.role?.toUpperCase();

  if (role === 'HOTEL_PARTNER' && !user.managedPropertyId) {
    throw new ForbiddenException('Tài khoản đối tác chưa được gán cơ sở quản lý');
  }

  if (user.managedPropertyId) {
    if (requestedPropertyId && requestedPropertyId !== user.managedPropertyId) {
      throw new ForbiddenException('Không có quyền truy cập cơ sở này');
    }
    return { propertyId: user.managedPropertyId };
  }

  if (role === 'ADMIN') {
    return requestedPropertyId ? { propertyId: requestedPropertyId } : {};
  }

  if (!requestedPropertyId) {
    throw new ForbiddenException(
      'Chỉ có quản trị viên mới có quyền truy cập phạm vi toàn hệ thống',
    );
  }

  return { propertyId: requestedPropertyId };
}
