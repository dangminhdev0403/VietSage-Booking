import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getDefaultPathForRole,
  canAccessPathByRole,
  canAccessPathByPermissions,
  canAccessPath,
  hasPermission,
  getPermissionsForRole,
  resolveSafeRedirect,
  normalizeInternalPath,
  isAdminRole,
  getSafePublicOrigin,
  PERMISSIONS,
} from './rbac.ts';

test('isAdminRole identifies valid admin roles and explicitly rejects retired SUPER_ADMIN', () => {
  assert.equal(isAdminRole('ADMIN'), true);
  assert.equal(isAdminRole('admin'), true);
  assert.equal(isAdminRole('HOTEL_PARTNER'), true);
  assert.equal(isAdminRole('hotel_partner'), true);

  // SUPER_ADMIN is retired - no longer recognized as valid admin role
  assert.equal(isAdminRole('SUPER_ADMIN'), false);
  assert.equal(isAdminRole('TRAVELER'), false);
  assert.equal(isAdminRole('GUEST'), false);
  assert.equal(isAdminRole(null), false);
  assert.equal(isAdminRole(undefined), false);
});

test('getDefaultPathForRole returns appropriate workspace home', () => {
  assert.equal(getDefaultPathForRole('ADMIN'), '/admin');
  assert.equal(getDefaultPathForRole('HOTEL_PARTNER'), '/admin');
  assert.equal(getDefaultPathForRole('TRAVELER'), '/');
  assert.equal(getDefaultPathForRole('SUPER_ADMIN'), '/');
  assert.equal(getDefaultPathForRole(null), '/');
  assert.equal(getDefaultPathForRole(undefined), '/');
});

test('getPermissionsForRole provides expected granular capabilities', () => {
  const adminPerms = getPermissionsForRole('ADMIN');
  assert.ok(adminPerms.includes(PERMISSIONS.ADMIN_ACCESS));
  assert.ok(adminPerms.includes(PERMISSIONS.CATALOG_MANAGE));
  assert.ok(adminPerms.includes(PERMISSIONS.ALLOTMENTS_MANAGE));
  assert.ok(adminPerms.includes(PERMISSIONS.SYNC_MANAGE));

  const partnerPerms = getPermissionsForRole('HOTEL_PARTNER');
  assert.ok(partnerPerms.includes(PERMISSIONS.ADMIN_ACCESS));
  assert.ok(partnerPerms.includes(PERMISSIONS.ALLOTMENTS_MANAGE));
  assert.equal(partnerPerms.includes(PERMISSIONS.SYNC_MANAGE), false);

  const travelerPerms = getPermissionsForRole('TRAVELER');
  assert.deepEqual(travelerPerms, []);
  assert.deepEqual(getPermissionsForRole(null), []);
});

test('hasPermission validates direct permissions and wildcard patterns', () => {
  // Direct match
  assert.equal(hasPermission(['catalog:read', 'bookings:read'], 'catalog:read'), true);
  assert.equal(hasPermission(['catalog:read'], 'catalog:manage'), false);

  // Global wildcard
  assert.equal(hasPermission(['*'], 'any:permission'), true);

  // Domain wildcard
  assert.equal(hasPermission(['catalog:*'], 'catalog:read'), true);
  assert.equal(hasPermission(['catalog:*'], 'catalog:manage'), true);
  assert.equal(hasPermission(['catalog:*'], 'bookings:read'), false);

  // Empty or invalid permissions
  assert.equal(hasPermission([], 'admin:access'), false);
  assert.equal(hasPermission(null, 'admin:access'), false);
  assert.equal(hasPermission(undefined, 'admin:access'), false);
});

test('canAccessPathByPermissions enforces granular capabilities on routes', () => {
  // /admin requires admin:access
  assert.equal(canAccessPathByPermissions(['admin:access'], '/admin'), true);
  assert.equal(canAccessPathByPermissions(['catalog:read'], '/admin'), false);
  assert.equal(canAccessPathByPermissions([], '/admin'), false);

  // /admin/allotments requires allotments:read
  assert.equal(canAccessPathByPermissions(['admin:access', 'allotments:read'], '/admin/allotments'), true);
  assert.equal(canAccessPathByPermissions(['admin:access'], '/admin/allotments'), false);

  // /admin/bookings requires bookings:read
  assert.equal(canAccessPathByPermissions(['bookings:read'], '/admin/bookings'), true);
  assert.equal(canAccessPathByPermissions(['catalog:read'], '/admin/bookings'), false);

  // Public paths are accessible without permissions
  assert.equal(canAccessPathByPermissions([], '/'), true);
  assert.equal(canAccessPathByPermissions([], '/booking/lookup'), true);
  assert.equal(canAccessPathByPermissions([], '/properties'), true);
});

test('canAccessPath evaluates explicit permissions or falls back to role capabilities', () => {
  // Evaluates explicit permissions when provided
  assert.equal(canAccessPath('HOTEL_PARTNER', ['admin:access', 'allotments:read'], '/admin/allotments'), true);
  assert.equal(canAccessPath('HOTEL_PARTNER', ['admin:access'], '/admin/allotments'), false);

  // Falls back to role default permissions
  assert.equal(canAccessPath('ADMIN', null, '/admin/allotments'), true);
  assert.equal(canAccessPath('HOTEL_PARTNER', null, '/admin/allotments'), true);
  assert.equal(canAccessPath('TRAVELER', null, '/admin'), false);
  assert.equal(canAccessPath(null, null, '/admin'), false);

  // Backward compatibility alias: canAccessPathByRole
  assert.equal(canAccessPathByRole('ADMIN', '/admin'), true);
  assert.equal(canAccessPathByRole('HOTEL_PARTNER', '/admin'), true);
  assert.equal(canAccessPathByRole('TRAVELER', '/admin'), false);
  assert.equal(canAccessPathByRole('SUPER_ADMIN', '/admin'), false);
  assert.equal(canAccessPathByRole(null, '/admin'), false);
});

test('normalizeInternalPath prevents open redirect attacks and recursive callback params', () => {
  assert.equal(normalizeInternalPath('//attacker.com'), null);
  assert.equal(normalizeInternalPath('https://malicious.com'), null);
  assert.equal(normalizeInternalPath('/booking/lookup?callbackUrl=/login'), '/booking/lookup');
  assert.equal(normalizeInternalPath('/admin/allotments?filter=active'), '/admin/allotments?filter=active');
});

test('resolveSafeRedirect prevents forbidden bounces by falling back to role home', () => {
  // Unauthenticated user attempting to access /admin gets safely redirected to '/'
  assert.equal(resolveSafeRedirect(null, '/admin'), '/');
  assert.equal(resolveSafeRedirect(undefined, '/admin/allotments'), '/');

  // Admin accessing /admin/allotments gets permitted through
  assert.equal(resolveSafeRedirect('ADMIN', '/admin/allotments'), '/admin/allotments');

  // External / malicious callbackUrls are stripped and sent to role default
  assert.equal(resolveSafeRedirect('ADMIN', '//malicious.com'), '/admin');
  assert.equal(resolveSafeRedirect(null, 'https://evil.com'), '/');

  // No callbackUrl defaults to role home
  assert.equal(resolveSafeRedirect('ADMIN', null), '/admin');
  assert.equal(resolveSafeRedirect(null, null), '/');
});

test('getSafePublicOrigin correctly resolves proxy origins and prevents invalid SSL on dev ports', () => {
  // 1. Behind Portless proxy with x-forwarded-host
  const portlessHeaders = new Headers({
    'x-forwarded-host': 'vietsage-booking.localhost',
    'x-forwarded-proto': 'https',
    host: 'localhost:4983',
  });
  assert.equal(
    getSafePublicOrigin({ headers: portlessHeaders }),
    'https://vietsage-booking.localhost',
  );

  // 2. Direct development request on custom localhost port without proxy headers
  const savedAuthUrl = process.env.AUTH_URL;
  delete process.env.AUTH_URL;
  delete process.env.NEXTAUTH_URL;

  const directDevHeaders = new Headers({
    host: 'localhost:3000',
  });
  assert.equal(
    getSafePublicOrigin({ headers: directDevHeaders }),
    'http://localhost:3000',
  );

  // 3. Fallback when raw request.url accidentally has https on dev port
  assert.equal(
    getSafePublicOrigin({ url: 'https://localhost:3000/admin' }),
    'http://localhost:3000',
  );

  // Restore env
  if (savedAuthUrl) {
    process.env.AUTH_URL = savedAuthUrl;
  }
});
