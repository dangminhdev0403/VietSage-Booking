import { ForbiddenException } from '@nestjs/common';
import { resolvePropertyScope } from './property-scope.helper';
import type { AuthenticatedUser } from './authenticated-user';

describe('resolvePropertyScope', () => {
  it('throws ForbiddenException when HOTEL_PARTNER has no managedPropertyId', () => {
    const user: AuthenticatedUser = {
      id: 'partner-1',
      username: 'partner',
      displayName: 'Partner',
      email: 'partner@test.com',
      role: 'HOTEL_PARTNER',
      managedPropertyId: null,
    };

    expect(() => resolvePropertyScope(user)).toThrow(
      new ForbiddenException('Tài khoản đối tác chưa được gán cơ sở quản lý'),
    );
  });

  it('throws ForbiddenException when HOTEL_PARTNER requests a mismatched propertyId', () => {
    const user: AuthenticatedUser = {
      id: 'partner-1',
      username: 'partner',
      displayName: 'Partner',
      email: 'partner@test.com',
      role: 'HOTEL_PARTNER',
      managedPropertyId: 'prop-own',
    };

    expect(() => resolvePropertyScope(user, 'prop-other')).toThrow(
      new ForbiddenException('Không có quyền truy cập cơ sở này'),
    );
  });

  it('returns managedPropertyId when HOTEL_PARTNER requests their assigned property', () => {
    const user: AuthenticatedUser = {
      id: 'partner-1',
      username: 'partner',
      displayName: 'Partner',
      email: 'partner@test.com',
      role: 'HOTEL_PARTNER',
      managedPropertyId: 'prop-own',
    };

    const result = resolvePropertyScope(user, 'prop-own');
    expect(result).toEqual({ propertyId: 'prop-own' });
  });

  it('returns managedPropertyId when HOTEL_PARTNER does not provide requestedPropertyId', () => {
    const user: AuthenticatedUser = {
      id: 'partner-1',
      username: 'partner',
      displayName: 'Partner',
      email: 'partner@test.com',
      role: 'HOTEL_PARTNER',
      managedPropertyId: 'prop-own',
    };

    const result = resolvePropertyScope(user);
    expect(result).toEqual({ propertyId: 'prop-own' });
  });

  it('allows ADMIN global scope when requestedPropertyId is undefined', () => {
    const user: AuthenticatedUser = {
      id: 'admin-1',
      username: 'admin',
      displayName: 'Admin',
      email: 'admin@test.com',
      role: 'ADMIN',
    };

    const result = resolvePropertyScope(user);
    expect(result).toEqual({});
  });

  it('allows ADMIN specific property scope when requestedPropertyId is provided', () => {
    const user: AuthenticatedUser = {
      id: 'admin-1',
      username: 'admin',
      displayName: 'Admin',
      email: 'admin@test.com',
      role: 'ADMIN',
    };

    const result = resolvePropertyScope(user, 'prop-target');
    expect(result).toEqual({ propertyId: 'prop-target' });
  });

  it('denies global scope to non-admin roles without managedPropertyId', () => {
    const user: AuthenticatedUser = {
      id: 'other-1',
      username: 'other',
      displayName: 'Other',
      email: 'other@test.com',
      role: 'USER',
    };

    expect(() => resolvePropertyScope(user)).toThrow(
      new ForbiddenException(
        'Chỉ có quản trị viên mới có quyền truy cập phạm vi toàn hệ thống',
      ),
    );
  });
});
