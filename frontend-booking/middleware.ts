import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import {
  canAccessPathByRole,
  resolveSafeRedirect,
  sanitizeInternalCallbackUrl,
} from '@/lib/auth/rbac';

export default auth((req) => {
  const session = req.auth;
  const hasAuthError = (session as unknown as { error?: string })?.error === 'RefreshAccessTokenError';
  const hasToken = !!(
    (session as unknown as { accessToken?: string })?.accessToken ||
    (session?.user as unknown as { accessToken?: string })?.accessToken
  );
  const isLoggedIn = !!session?.user && !hasAuthError && hasToken;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const { pathname, search } = req.nextUrl;

  // 1. Private Admin Routes Guard
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      const cleanCallback = sanitizeInternalCallbackUrl(pathname + search, '/admin');
      const loginUrl = new URL('/login', req.nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', cleanCallback);
      return NextResponse.redirect(loginUrl);
    }

    if (!canAccessPathByRole(role, pathname)) {
      const safePath = resolveSafeRedirect(role);
      return NextResponse.redirect(new URL(safePath, req.nextUrl.origin));
    }
  }

  // 2. Traveler Self-Service Private Routes Guard
  if (pathname.startsWith('/my-bookings') || pathname.startsWith('/profile')) {
    if (!isLoggedIn) {
      const cleanCallback = sanitizeInternalCallbackUrl(pathname + search, pathname);
      const loginUrl = new URL('/login', req.nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', cleanCallback);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Login Page Guard (Redirect already authenticated users to their role destination)
  if (pathname.startsWith('/login') && isLoggedIn) {
    const rawCallback = req.nextUrl.searchParams.get('callbackUrl');
    const safeDestination = resolveSafeRedirect(role, rawCallback);
    return NextResponse.redirect(new URL(safeDestination, req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/login', '/my-bookings/:path*', '/profile/:path*'],
};
