import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getDefaultPathForRole,
  canAccessPathByRole,
  resolveSafeRedirect,
  normalizeInternalPath,
  isAdminRole,
} from './rbac.ts';

test('isAdminRole correctly identifies elevated roles', () => {
  assert.equal(isAdminRole('SUPER_ADMIN'), true);
  assert.equal(isAdminRole('ADMIN'), true);
  assert.equal(isAdminRole('HOTEL_PARTNER'), true);
  assert.equal(isAdminRole('TRAVELER'), false);
  assert.equal(isAdminRole(null), false);
  assert.equal(isAdminRole(undefined), false);
});

test('getDefaultPathForRole returns appropriate workspace home', () => {
  assert.equal(getDefaultPathForRole('SUPER_ADMIN'), '/admin');
  assert.equal(getDefaultPathForRole('ADMIN'), '/admin');
  assert.equal(getDefaultPathForRole('HOTEL_PARTNER'), '/admin');
  assert.equal(getDefaultPathForRole('TRAVELER'), '/');
  assert.equal(getDefaultPathForRole(null), '/');
  assert.equal(getDefaultPathForRole(undefined), '/');
});

test('canAccessPathByRole restricts admin areas from unauthorized roles and unauthenticated users', () => {
  assert.equal(canAccessPathByRole('TRAVELER', '/admin'), false);
  assert.equal(canAccessPathByRole('TRAVELER', '/admin/allotments'), false);
  assert.equal(canAccessPathByRole(null, '/admin'), false);
  assert.equal(canAccessPathByRole(undefined, '/admin'), false);
  assert.equal(canAccessPathByRole('ADMIN', '/admin'), true);
  assert.equal(canAccessPathByRole('ADMIN', '/admin/allotments'), true);
  assert.equal(canAccessPathByRole('HOTEL_PARTNER', '/admin'), true);
  assert.equal(canAccessPathByRole('HOTEL_PARTNER', '/admin/allotments'), true);
  assert.equal(canAccessPathByRole('SUPER_ADMIN', '/admin'), true);
});

test('canAccessPathByRole permits public routes for all users', () => {
  assert.equal(canAccessPathByRole(null, '/'), true);
  assert.equal(canAccessPathByRole(null, '/booking/lookup'), true);
  assert.equal(canAccessPathByRole(null, '/properties'), true);
  assert.equal(canAccessPathByRole('ADMIN', '/booking/lookup'), true);
  assert.equal(canAccessPathByRole('HOTEL_PARTNER', '/properties'), true);
});

test('normalizeInternalPath prevents open redirect attacks and recursive callback params', () => {
  assert.equal(normalizeInternalPath('//attacker.com'), null);
  assert.equal(normalizeInternalPath('https://malicious.com'), null);
  assert.equal(normalizeInternalPath('/booking/lookup?callbackUrl=/login'), '/booking/lookup');
  assert.equal(normalizeInternalPath('/admin/allotments?filter=active'), '/admin/allotments?filter=active');
});

test('resolveSafeRedirect prevents forbidden bounces by falling back to role home', () => {
  // Unauthorized user attempting to access /admin gets safely redirected to '/'
  assert.equal(resolveSafeRedirect('TRAVELER', '/admin'), '/');
  assert.equal(resolveSafeRedirect(null, '/admin'), '/');
  assert.equal(resolveSafeRedirect(undefined, '/admin/allotments'), '/');

  // Admin accessing /admin/allotments gets permitted through
  assert.equal(resolveSafeRedirect('ADMIN', '/admin/allotments'), '/admin/allotments');
  assert.equal(resolveSafeRedirect('HOTEL_PARTNER', '/admin/allotments'), '/admin/allotments');

  // External / malicious callbackUrls are stripped and sent to role default
  assert.equal(resolveSafeRedirect('ADMIN', '//malicious.com'), '/admin');
  assert.equal(resolveSafeRedirect(null, 'https://evil.com'), '/');

  // No callbackUrl defaults to role home
  assert.equal(resolveSafeRedirect('ADMIN', null), '/admin');
  assert.equal(resolveSafeRedirect('HOTEL_PARTNER', null), '/admin');
  assert.equal(resolveSafeRedirect(null, null), '/');
});
