import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { resolveSafeRedirect, sanitizeInternalCallbackUrl } from '@/lib/auth/rbac';


/**
 * GET /api/auth/post-login?callbackUrl=...
 *
 * Server-side continuation point after client-side signIn().
 * Reads the authoritative session cookie from the incoming request,
 * re-evaluates destination access against the authenticated user's role,
 * and issues an HTTP 303 See Other redirect.
 *
 * This completely eliminates client-side session polling race conditions.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  const rawCallbackUrl = request.nextUrl.searchParams.get('callbackUrl');
  const callbackUrl = rawCallbackUrl ? sanitizeInternalCallbackUrl(rawCallbackUrl) : null;

  const role = (session?.user as { role?: string } | undefined)?.role;
  const safePath = resolveSafeRedirect(role, callbackUrl);

  return NextResponse.redirect(new URL(safePath, request.url), 303);
}
