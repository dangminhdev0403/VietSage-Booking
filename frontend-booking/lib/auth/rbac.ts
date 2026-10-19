export type UserRole = 'ADMIN' | 'HOTEL_PARTNER' | 'TRAVELER';

export type RoleDefaultPathMap = Record<string, string>;

export const roleDefaultPaths: RoleDefaultPathMap = {
  ADMIN: '/admin',
  HOTEL_PARTNER: '/partner',
  TRAVELER: '/',
};

/**
 * Standard Platform Permissions (Granular Capabilities)
 */
export const PERMISSIONS = {
  ADMIN_ACCESS: 'admin:access',
  CATALOG_READ: 'catalog:read',
  CATALOG_MANAGE: 'catalog:manage',
  ALLOTMENTS_READ: 'allotments:read',
  ALLOTMENTS_MANAGE: 'allotments:manage',
  BOOKINGS_READ: 'bookings:read',
  BOOKINGS_MANAGE: 'bookings:manage',
  PAYMENTS_READ: 'payments:read',
  PAYMENTS_MANAGE: 'payments:manage',
  SYNC_MANAGE: 'sync:manage',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | string;

/**
 * Role to Default Capabilities mapping
 * - SUPER_ADMIN is retired: Platform Admin (ADMIN) owns platform governance.
 * - HOTEL_PARTNER owns property operations scoped to their managedPropertyId.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<string, readonly string[]> = {
  ADMIN: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.CATALOG_READ,
    PERMISSIONS.CATALOG_MANAGE,
    PERMISSIONS.ALLOTMENTS_READ,
    PERMISSIONS.ALLOTMENTS_MANAGE,
    PERMISSIONS.BOOKINGS_READ,
    PERMISSIONS.BOOKINGS_MANAGE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_MANAGE,
    PERMISSIONS.SYNC_MANAGE,
  ],
  HOTEL_PARTNER: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.CATALOG_READ,
    PERMISSIONS.CATALOG_MANAGE,
    PERMISSIONS.ALLOTMENTS_READ,
    PERMISSIONS.ALLOTMENTS_MANAGE,
    PERMISSIONS.BOOKINGS_READ,
    PERMISSIONS.BOOKINGS_MANAGE,
    PERMISSIONS.PAYMENTS_READ,
  ],
  TRAVELER: [],
};

/**
 * Roles allowed to access administration surfaces
 */
export const adminRoles: readonly string[] = ['ADMIN', 'HOTEL_PARTNER'];

/**
 * Route prefix to required capability mapping
 */
export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/admin/properties': PERMISSIONS.CATALOG_READ,
  '/admin/allotments': PERMISSIONS.ALLOTMENTS_READ,
  '/admin/bookings': PERMISSIONS.BOOKINGS_READ,
  '/admin/payments': PERMISSIONS.PAYMENTS_READ,
  '/admin/settlements': PERMISSIONS.PAYMENTS_READ,
  '/admin/users': PERMISSIONS.ADMIN_ACCESS,
  '/admin': PERMISSIONS.ADMIN_ACCESS,
  '/partner/rooms': PERMISSIONS.CATALOG_READ,
  '/partner/properties': PERMISSIONS.CATALOG_READ,
  '/partner/property': PERMISSIONS.CATALOG_READ,
  '/partner/allotments': PERMISSIONS.ALLOTMENTS_READ,
  '/partner/bookings': PERMISSIONS.BOOKINGS_READ,
  '/partner/payments': PERMISSIONS.PAYMENTS_READ,
  '/partner': PERMISSIONS.ADMIN_ACCESS,
};

export function isUserRole(role: unknown): boolean {
  return typeof role === 'string' && role.length > 0;
}

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return adminRoles.includes(role.toUpperCase());
}

export function getDefaultPathForRole(role?: string | null): string {
  if (!role) return '/';
  const normalized = role.toUpperCase();
  return roleDefaultPaths[normalized] || (isAdminRole(normalized) ? (normalized === 'HOTEL_PARTNER' ? '/partner' : '/admin') : '/');
}

export function getPermissionsForRole(role?: string | null): string[] {
  if (!role) return [];
  const defaults = ROLE_DEFAULT_PERMISSIONS[role.toUpperCase()];
  return defaults ? [...defaults] : [];
}

/**
 * Capability check supporting direct permission keys and wildcards ('*' or 'domain:*')
 */
export function hasPermission(
  userPermissions: readonly string[] | undefined | null,
  requiredPermission: string,
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;
  if (userPermissions.includes(requiredPermission)) return true;

  return userPermissions.some((perm) => {
    if (perm.endsWith(':*')) {
      const domain = perm.slice(0, -2);
      return requiredPermission.startsWith(`${domain}:`);
    }
    return false;
  });
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
    '/partner',
    '/booking',
    '/properties',
    '/alerts',
  ];

  return allowedPrefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

/**
 * Enforce path access by checking granular capabilities
 */
export function canAccessPathByPermissions(
  permissions: readonly string[] | undefined | null,
  path: string,
): boolean {
  const normalized = normalizeInternalPath(path);
  if (!normalized) return false;

  const pathname = normalized.split('?')[0] || normalized;

  // Match the most specific route prefix in ROUTE_PERMISSION_MAP
  for (const [routePrefix, requiredPerm] of Object.entries(ROUTE_PERMISSION_MAP)) {
    if (matchesPrefix(pathname, routePrefix)) {
      return hasPermission(permissions, requiredPerm);
    }
  }

  // Public catalog, lookup, and alerts routes are open to all
  return true;
}

/**
 * Unified authorization evaluator accepting role and/or explicit permissions
 */
export function canAccessPath(
  role: string | null | undefined,
  permissions: readonly string[] | undefined | null,
  path: string,
): boolean {
  const normalized = normalizeInternalPath(path);
  if (!normalized) return false;
  const pathname = normalized.split('?')[0] || normalized;

  const normalizedRole = role ? role.toUpperCase() : null;

  // Strict physical portal separation
  if (matchesPrefix(pathname, '/admin')) {
    if (normalizedRole === 'HOTEL_PARTNER') return false;
    if (!normalizedRole || normalizedRole === 'TRAVELER') return false;
  }

  if (matchesPrefix(pathname, '/partner')) {
    if (normalizedRole === 'ADMIN') return false;
    if (!normalizedRole || normalizedRole === 'TRAVELER') return false;
  }

  if (permissions && permissions.length > 0) {
    return canAccessPathByPermissions(permissions, path);
  }
  const resolvedPermissions = getPermissionsForRole(role);
  return canAccessPathByPermissions(resolvedPermissions, path);
}

/**
 * Legacy compatibility alias delegating to Role-Permission evaluation
 */
export function canAccessPathByRole(
  role: string | null | undefined,
  path: string,
): boolean {
  return canAccessPath(role, undefined, path);
}

export function resolveSafeRedirect(
  role?: string | null,
  callbackUrl?: string | null,
  permissions?: readonly string[] | null,
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

  return canAccessPath(role, permissions, normalizedCallback)
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

export type HeaderCarrier =
  | Headers
  | { get(name: string): string | null }
  | Record<string, string | string[] | undefined>;

/**
 * Resolves the public, authoritative base origin for redirects.
 * Strictly prevents constructing invalid "https://localhost:<dev-port>" URLs
 * caused by reverse proxies (Portless/Nginx) forwarding to internal dev servers.
 */
export function getSafePublicOrigin(
  reqOrHeaders?: { headers?: HeaderCarrier; url?: string } | HeaderCarrier | null,
): string {
  let headers: { get(name: string): string | null } | undefined;

  if (reqOrHeaders) {
    if (typeof (reqOrHeaders as { get?: unknown }).get === 'function') {
      headers = reqOrHeaders as { get(name: string): string | null };
    } else if (
      'headers' in reqOrHeaders &&
      reqOrHeaders.headers &&
      typeof (reqOrHeaders.headers as { get?: unknown }).get === 'function'
    ) {
      headers = reqOrHeaders.headers as { get(name: string): string | null };
    }
  }

  const forwardedHost = headers?.get('x-forwarded-host');
  const forwardedProto = headers?.get('x-forwarded-proto');

  // 1. If routed via reverse proxy with x-forwarded-host (e.g. Portless, Nginx, Cloudflare)
  if (forwardedHost) {
    const proto = forwardedProto || 'https';
    return `${proto}://${forwardedHost}`;
  }

  // 2. Canonical AUTH_URL or NEXTAUTH_URL if defined in environment
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (authUrl) {
    return authUrl.replace(/\/$/, '');
  }

  // 3. Direct host header (e.g. standalone localhost:3000 development)
  const host = headers?.get('host');
  if (host) {
    if (host.includes('localhost:') || host.includes('127.0.0.1:')) {
      return `http://${host}`;
    }
    const proto = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    return `${proto}://${host}`;
  }

  // 4. Fallback from req.url, ensuring no https on dev ports
  if (reqOrHeaders && 'url' in reqOrHeaders && typeof reqOrHeaders.url === 'string') {
    try {
      const parsed = new URL(reqOrHeaders.url);
      if (parsed.origin.startsWith('https://localhost:') || parsed.origin.startsWith('https://127.0.0.1:')) {
        return parsed.origin.replace('https://', 'http://');
      }
      return parsed.origin;
    } catch {
      // ignore
    }
  }

  return 'http://localhost:3000';
}
