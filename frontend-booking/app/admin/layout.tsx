import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AdminShell } from '@/components/layouts/admin-shell';
import { canAccessPath } from '@/lib/auth/rbac';

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

  const role = (session?.user as { role?: string } | undefined)?.role;
  const permissions = (session?.user as { permissions?: string[] } | undefined)?.permissions;
  if (!canAccessPath(role, permissions, '/admin')) {
    redirect('/login?error=forbidden&callbackUrl=/admin');
  }

  return <AdminShell sessionUser={session.user}>{children}</AdminShell>;
}

