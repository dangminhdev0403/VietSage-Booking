import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import {
  getSafePublicOrigin,
  canAccessPath,
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
  const permissions = (session?.user as { permissions?: string[] } | undefined)?.permissions;
  const { pathname, search } = req.nextUrl;
  const origin = getSafePublicOrigin(req);

  // 1. Private Admin Routes Guard (Enforce Role-Permission capabilities)
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      const cleanCallback = sanitizeInternalCallbackUrl(pathname + search, '/admin');
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('callbackUrl', cleanCallback);
      return NextResponse.redirect(loginUrl);
    }

    if (!canAccessPath(role, permissions, pathname)) {
      return NextResponse.redirect(new URL('/', origin));
    }
  }

  // 2. Dead routes redirect to guest self-service lookup
  if (pathname.startsWith('/my-bookings') || pathname.startsWith('/profile')) {
    return NextResponse.redirect(new URL('/booking/lookup', origin));
  }

  // 3. Login Page Guard (Redirect already authenticated users to their role destination)
  if (pathname.startsWith('/login') && isLoggedIn) {
    const rawCallback = req.nextUrl.searchParams.get('callbackUrl');
    const safeDestination = resolveSafeRedirect(role, rawCallback, permissions);
    return NextResponse.redirect(new URL(safeDestination, origin));
  }

  return NextResponse.next();
});


export const config = {
  matcher: ['/admin/:path*', '/login', '/my-bookings/:path*', '/profile/:path*'],
};
