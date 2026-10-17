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

  // If not logged in, redirect directly to /login with callbackUrl
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  const role = (session.user as { role?: string } | undefined)?.role;
  if (!canAccessPathByRole(role, '/admin')) {
    redirect(resolveSafeRedirect(role));
  }

  return <AdminShell sessionUser={session.user}>{children}</AdminShell>;
}
