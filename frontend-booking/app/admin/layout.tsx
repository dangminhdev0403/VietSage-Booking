import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

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

  // If logged in but role is not ADMIN/SUPER_ADMIN, redirect to home page
  const role = (session.user as { role?: string }).role;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    redirect('/?error=forbidden');
  }

  return <>{children}</>;
}
