import { ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from './authenticated-user';

export function resolvePropertyScope(
  user: AuthenticatedUser,
  requestedPropertyId?: string,
): { propertyId?: string } {
  if (user.managedPropertyId) {
    if (requestedPropertyId && requestedPropertyId !== user.managedPropertyId) {
      throw new ForbiddenException('Không có quyền truy cập cơ sở này');
    }
    return { propertyId: user.managedPropertyId };
  }
  return requestedPropertyId ? { propertyId: requestedPropertyId } : {};
}
