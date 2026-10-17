export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HOTEL_PARTNER' | 'TRAVELER';

export type RoleDefaultPathMap = Record<UserRole, string>;

export const roleDefaultPaths: RoleDefaultPathMap = {
  SUPER_ADMIN: '/admin',
  ADMIN: '/admin',
  HOTEL_PARTNER: '/admin',
  TRAVELER: '/my-bookings',
};

export const adminRoles: readonly UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'HOTEL_PARTNER'];

export function isUserRole(role: unknown): role is UserRole {
  return (
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN' ||
    role === 'HOTEL_PARTNER' ||
    role === 'TRAVELER'
  );
}

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return adminRoles.includes(role as UserRole);
}

export function getDefaultPathForRole(role?: string | null): string {
  if (!role || !isUserRole(role)) {
    return '/';
  }
  return roleDefaultPaths[role] || '/';
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function normalizeInternalPath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed) return null;

  // Reject external protocols or protocol-relative paths
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return null;
  }

  try {
    const dummyOrigin = 'http://localhost';
    const parsed = new URL(trimmed, dummyOrigin);
    if (parsed.origin !== dummyOrigin) return null;
    if (!parsed.pathname.startsWith('/')) return null;

    // Prevent recursive callbackUrl parameter nesting/growth
    parsed.searchParams.delete('callbackUrl');

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

export function isKnownRedirectPath(pathname: string): boolean {
  if (pathname === '/') return true;

  const allowedPrefixes = [
    '/admin',
    '/my-bookings',
    '/profile',
    '/booking',
    '/properties',
    '/alerts',
  ];

  return allowedPrefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

export function canAccessPathByRole(
  role: string | null | undefined,
  path: string,
): boolean {
  const normalized = normalizeInternalPath(path);
  if (!normalized) return false;

  const pathname = normalized.split('?')[0] || normalized;

  // /admin routes require elevated admin / partner roles
  if (matchesPrefix(pathname, '/admin')) {
    return isAdminRole(role);
  }

  // Traveler self-service private routes require authentication
  if (matchesPrefix(pathname, '/my-bookings') || matchesPrefix(pathname, '/profile')) {
    return !!role;
  }

  // Public catalog, lookup, and alerts routes are open to all
  return true;
}

export function resolveSafeRedirect(
  role?: string | null,
  callbackUrl?: string | null,
): string {
  const fallbackPath = getDefaultPathForRole(role);

  if (!callbackUrl) {
    return fallbackPath;
  }

  const normalizedCallback = normalizeInternalPath(callbackUrl);
  if (!normalizedCallback) {
    return fallbackPath;
  }

  const callbackPathname = normalizedCallback.split('?')[0] || normalizedCallback;
  if (!isKnownRedirectPath(callbackPathname)) {
    return fallbackPath;
  }

  return canAccessPathByRole(role, normalizedCallback)
    ? normalizedCallback
    : fallbackPath;
}

export function sanitizeInternalCallbackUrl(
  callbackUrl: string | null | undefined,
  fallbackPath = '/',
): string {
  if (!callbackUrl) {
    return fallbackPath;
  }

  const normalized = normalizeInternalPath(callbackUrl);
  return normalized || fallbackPath;
}
