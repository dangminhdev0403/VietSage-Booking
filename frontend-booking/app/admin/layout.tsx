import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { canAccessPathByRole, resolveSafeRedirect } from '@/lib/auth/rbac';

import { AdminShell } from '@/components/layouts/admin-shell';

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const hasAuthError = (session as unknown as { error?: string })?.error === 'RefreshAccessTokenError';
  const hasToken = !!(
    (session as unknown as { accessToken?: string })?.accessToken ||
    (session?.user as unknown as { accessToken?: string })?.accessToken
  );

  // If not logged in or session expired, redirect directly to /login with callbackUrl
  if (!session?.user || hasAuthError || !hasToken) {
    redirect('/login?callbackUrl=/admin');
  }

  const role = (session.user as { role?: string } | undefined)?.role;
  if (!canAccessPathByRole(role, '/admin')) {
    redirect(resolveSafeRedirect(role));
  }

  return <AdminShell sessionUser={session.user}>{children}</AdminShell>;
}
