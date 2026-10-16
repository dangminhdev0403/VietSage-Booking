import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname, search } = req.nextUrl;

  // Protect /admin routes (Strict Private Boundary)
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', req.nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      return NextResponse.redirect(loginUrl);
    }

    const role = (req.auth?.user as { role?: string })?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', req.nextUrl.origin));
    }
  }

  // Redirect authenticated users away from /login
  if (pathname.startsWith('/login') && isLoggedIn) {
    const callbackUrl = req.nextUrl.searchParams.get('callbackUrl') || '/';
    return NextResponse.redirect(new URL(callbackUrl, req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
