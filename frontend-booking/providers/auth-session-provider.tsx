'use client';

import React, { useEffect } from 'react';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';

function SessionErrorWatcher() {
  const { data: session } = useSession();

  useEffect(() => {
    const sessionError = (session as unknown as { error?: string })?.error;
    if (sessionError === 'RefreshAccessTokenError') {
      signOut({ callbackUrl: '/login' });
    }
  }, [session]);

  return null;
}

export function AuthSessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <SessionErrorWatcher />
      {children}
    </SessionProvider>
  );
}
