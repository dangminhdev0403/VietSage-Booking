import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AdminShell } from '@/components/layouts/admin-shell';
import { canAccessPath } from '@/lib/auth/rbac';

async function PartnerLayoutContent({
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

  // If not logged in or session expired, redirect to login with callbackUrl
  if (!session?.user || hasAuthError || !hasToken) {
    redirect('/login?callbackUrl=/partner');
  }

  const role = (session?.user as { role?: string } | undefined)?.role;
  const permissions = (session?.user as { permissions?: string[] } | undefined)?.permissions;
  const managedPropertyId = (session?.user as { managedPropertyId?: string | null } | undefined)?.managedPropertyId;

  // Platform admin is routed to the platform governance portal
  if (role === 'ADMIN') {
    redirect('/admin');
  }

  // Hotel partner must have an assigned property and valid partner capability
  if (!managedPropertyId || !canAccessPath(role, permissions, '/partner')) {
    redirect('/login?error=forbidden&callbackUrl=/partner');
  }

  return (
    <AdminShell isPartner={true} sessionUser={session.user}>
      {children}
    </AdminShell>
  );
}

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Đang xác thực quyền đối tác khách sạn...
            </span>
          </div>
        </div>
      }
    >
      <PartnerLayoutContent>{children}</PartnerLayoutContent>
    </Suspense>
  );
}
