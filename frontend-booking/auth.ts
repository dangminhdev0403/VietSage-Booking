import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getPermissionsForRole } from '@/lib/auth/rbac';

const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV !== 'production'
    ? 'vietsage-booking-development-auth-secret-2026'
    : undefined);

if (
  process.env.NODE_ENV === 'production' &&
  (!authSecret ||
    authSecret.length < 32 ||
    ['replace_with', 'changeme', '<redacted>', '«redacted:'].some((marker) =>
      authSecret.toLowerCase().includes(marker),
    ))
) {
  throw new Error(
    'AUTH_SECRET or NEXTAUTH_SECRET must be a non-placeholder value of at least 32 characters in production',
  );
}

interface AuthUserPayload {
  id?: string;
  role?: string;
  permissions?: string[];
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  managedPropertyId?: string | null;
  accessibleProperties?: Array<{ id: string; name: string }>;
  error?: string;
}

// Deduplicate concurrent refreshes for the same refresh token across parallel server requests
const refreshPromises = new Map<string, Promise<Record<string, unknown>>>();

// Cache recently rotated tokens for a 4-second grace window to handle concurrent requests
const rotatedTokensCache = new Map<
  string,
  {
    token: Record<string, unknown>;
    expiresAt: number;
  }
>();

async function refreshAccessToken(token: Record<string, unknown>): Promise<Record<string, unknown>> {
  const backendUrl =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:8080';

  const rawRefreshToken = token.refreshToken;
  if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
      accessToken: undefined,
      refreshToken: undefined,
      accessTokenExpires: 0,
    };
  }

  // 1. Check if this token was already rotated recently (grace period for in-flight requests)
  const cachedRotation = rotatedTokensCache.get(rawRefreshToken);
  if (cachedRotation && Date.now() < cachedRotation.expiresAt) {
    return cachedRotation.token;
  }

  // 2. Deduplicate in-flight refresh requests for the same token
  const existingPromise = refreshPromises.get(rawRefreshToken);
  if (existingPromise) {
    return existingPromise;
  }

  const refreshPromise = (async (): Promise<Record<string, unknown>> => {
    try {
      const res = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: rawRefreshToken,
        }),
      });

      if (!res.ok) {
        console.warn(`[Auth.js] Refresh failed with status ${res.status}. Invalidating session.`);
        return {
          ...token,
          error: 'RefreshAccessTokenError',
          accessToken: undefined,
          refreshToken: undefined,
          accessTokenExpires: 0,
        };
      }

      const envelope = await res.json();
      if (!envelope.success || !envelope.data) {
        console.warn('[Auth.js] Refresh response unsuccessful:', envelope.error?.message);
        return {
          ...token,
          error: 'RefreshAccessTokenError',
          accessToken: undefined,
          refreshToken: undefined,
          accessTokenExpires: 0,
        };
      }

      const { access_token, refresh_token, expires_in, account } = envelope.data;

      const updatedToken: Record<string, unknown> = {
        ...token,
        accessToken: access_token,
        refreshToken: refresh_token ?? rawRefreshToken,
        accessTokenExpires: Date.now() + (expires_in ?? 3600) * 1000,
        role: account?.role ?? token.role,
        permissions:
          account?.permissions ??
          token.permissions ??
          getPermissionsForRole((account?.role ?? token.role) as string),
        managedPropertyId:
          account?.managed_property_id ??
          account?.managedPropertyId ??
          token.managedPropertyId ??
          null,
        accessibleProperties:
          account?.accessible_properties ??
          token.accessibleProperties ??
          [],
        error: undefined,
      };

      // Store in rotated cache for a 4-second grace period
      rotatedTokensCache.set(rawRefreshToken, {
        token: updatedToken,
        expiresAt: Date.now() + 4000,
      });

      return updatedToken;
    } catch (err) {
      console.warn('[Auth.js] Refresh network error:', err instanceof Error ? err.message : err);
      return {
        ...token,
        error: 'RefreshAccessTokenError',
        accessToken: undefined,
        refreshToken: undefined,
        accessTokenExpires: 0,
      };
    } finally {
      refreshPromises.delete(rawRefreshToken);
    }
  })();

  refreshPromises.set(rawRefreshToken, refreshPromise);
  return refreshPromise;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'VietSage Credentials',
      credentials: {
        username: { label: 'Tên đăng nhập', type: 'text' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const backendUrl =
          process.env.INTERNAL_BACKEND_URL ||
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          'http://localhost:8080';

        try {
          const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            return null;
          }

          const envelope = await res.json();
          if (!envelope.success || !envelope.data) {
            return null;
          }

          const { account, access_token, refresh_token, expires_in } = envelope.data;

          const permissions =
            account.permissions && account.permissions.length > 0
              ? account.permissions
              : getPermissionsForRole(account.role);

          return {
            id: account.id,
            name: account.display_name,
            email: account.email,
            role: account.role,
            permissions,
            accessToken: access_token,
            refreshToken: refresh_token,
            accessTokenExpires: Date.now() + (expires_in ?? 3600) * 1000,
            managedPropertyId: account.managed_property_id ?? account.managedPropertyId ?? null,
            accessibleProperties: account.accessible_properties ?? [],
          };
        } catch (err) {
          console.error('[Auth.js] authorize error:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in
      if (user) {
        const u = user as unknown as AuthUserPayload;
        return {
          ...token,
          id: u.id,
          role: u.role,
          permissions: u.permissions ?? getPermissionsForRole(u.role),
          accessToken: u.accessToken,
          refreshToken: u.refreshToken,
          accessTokenExpires: u.accessTokenExpires ?? Date.now() + 3600 * 1000,
          managedPropertyId: u.managedPropertyId ?? null,
          accessibleProperties: u.accessibleProperties ?? [],
          error: undefined,
        };
      }

      // If token is already in error state, stop attempting refresh immediately
      if (token.error === 'RefreshAccessTokenError') {
        return {
          ...token,
          accessToken: undefined,
          refreshToken: undefined,
          accessTokenExpires: 0,
        };
      }

      // Return previous token if the access token has not expired yet (buffer 60 seconds)
      if (
        typeof token.accessTokenExpires === 'number' &&
        Date.now() < token.accessTokenExpires - 60 * 1000
      ) {
        return token;
      }

      // Access token has expired or is missing expiry timestamp: rotate via backend refresh token
      if (token.refreshToken) {
        return await refreshAccessToken(token as Record<string, unknown>);
      }

      return {
        ...token,
        error: 'RefreshAccessTokenError',
        accessToken: undefined,
        refreshToken: undefined,
        accessTokenExpires: 0,
      };
    },
    session({ session, token }) {
      if (token) {
        if (token.error === 'RefreshAccessTokenError' || !token.accessToken) {
          return {
            ...session,
            user: undefined as unknown as typeof session.user,
            error: 'RefreshAccessTokenError',
            accessToken: undefined,
            refreshToken: undefined,
          };
        }

        if (!session.user) {
          (session as unknown as Record<string, unknown>).user = {};
        }
        session.user.id = (token.id as string) || (token.sub as string);
        const sUser = session.user as unknown as AuthUserPayload;
        sUser.role = token.role as string | undefined;
        sUser.permissions =
          (token.permissions as string[]) ??
          getPermissionsForRole(token.role as string | undefined);
        sUser.accessToken = token.accessToken as string | undefined;
        sUser.refreshToken = token.refreshToken as string | undefined;
        sUser.managedPropertyId = (token.managedPropertyId as string | null) ?? null;
        sUser.accessibleProperties = (token.accessibleProperties as Array<{ id: string; name: string }>) ?? [];

        const s = session as unknown as AuthUserPayload & { error?: string };
        s.accessToken = token.accessToken as string | undefined;
        s.refreshToken = token.refreshToken as string | undefined;
        s.managedPropertyId = (token.managedPropertyId as string | null) ?? null;
        s.accessibleProperties = (token.accessibleProperties as Array<{ id: string; name: string }>) ?? [];
        s.error = undefined;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  secret: authSecret,
});
