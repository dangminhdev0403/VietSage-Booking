import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AdminShell } from '@/components/layouts/admin-shell';
import { canAccessPath } from '@/lib/auth/rbac';

async function AdminLayoutContent({
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

  // Hotel Partner is strictly routed to the partner operations portal
  if (role === 'HOTEL_PARTNER') {
    redirect('/partner');
  }

  if (!canAccessPath(role, permissions, '/admin')) {
    redirect('/login?error=forbidden&callbackUrl=/admin');
  }

  return <AdminShell sessionUser={session.user}>{children}</AdminShell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Đang xác thực quyền truy cập...
            </span>
          </div>
        </div>
      }
    >
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}

