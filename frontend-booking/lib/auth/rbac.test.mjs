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
  assert.equal(getDefaultPathForRole('TRAVELER'), '/my-bookings');
  assert.equal(getDefaultPathForRole(null), '/');
  assert.equal(getDefaultPathForRole(undefined), '/');
});

test('canAccessPathByRole restricts admin areas from traveler and unauthenticated users', () => {
  assert.equal(canAccessPathByRole('TRAVELER', '/admin'), false);
  assert.equal(canAccessPathByRole('TRAVELER', '/admin/allotments'), false);
  assert.equal(canAccessPathByRole(null, '/admin'), false);
  assert.equal(canAccessPathByRole('ADMIN', '/admin'), true);
  assert.equal(canAccessPathByRole('ADMIN', '/admin/allotments'), true);
  assert.equal(canAccessPathByRole('HOTEL_PARTNER', '/admin'), true);
  assert.equal(canAccessPathByRole('HOTEL_PARTNER', '/admin/allotments'), true);
});

test('canAccessPathByRole requires authentication for traveler self-service pages', () => {
  assert.equal(canAccessPathByRole(null, '/my-bookings'), false);
  assert.equal(canAccessPathByRole(null, '/profile'), false);
  assert.equal(canAccessPathByRole('TRAVELER', '/my-bookings'), true);
  assert.equal(canAccessPathByRole('TRAVELER', '/profile'), true);
  assert.equal(canAccessPathByRole('ADMIN', '/my-bookings'), true);
});

test('normalizeInternalPath prevents open redirect attacks and recursive callback params', () => {
  assert.equal(normalizeInternalPath('//attacker.com'), null);
  assert.equal(normalizeInternalPath('https://malicious.com'), null);
  assert.equal(normalizeInternalPath('/my-bookings?callbackUrl=/login'), '/my-bookings');
  assert.equal(normalizeInternalPath('/admin/allotments?filter=active'), '/admin/allotments?filter=active');
});

test('resolveSafeRedirect prevents forbidden bounces by falling back to role home', () => {
  // Traveler attempting to access /admin gets safely redirected to /my-bookings
  assert.equal(resolveSafeRedirect('TRAVELER', '/admin'), '/my-bookings');
  assert.equal(resolveSafeRedirect('TRAVELER', '/admin/allotments'), '/my-bookings');

  // Admin accessing /admin/allotments gets permitted through
  assert.equal(resolveSafeRedirect('ADMIN', '/admin/allotments'), '/admin/allotments');

  // External / malicious callbackUrls are stripped and sent to role default
  assert.equal(resolveSafeRedirect('ADMIN', '//malicious.com'), '/admin');
  assert.equal(resolveSafeRedirect('TRAVELER', 'https://evil.com'), '/my-bookings');

  // No callbackUrl defaults to role home
  assert.equal(resolveSafeRedirect('ADMIN', null), '/admin');
  assert.equal(resolveSafeRedirect('TRAVELER', null), '/my-bookings');
  assert.equal(resolveSafeRedirect(null, null), '/');
});
