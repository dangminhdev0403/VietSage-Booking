import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'VietSage Credentials',
      credentials: {
        username: { label: 'Tên đăng nhập', type: 'text' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const backendUrl =
          process.env.INTERNAL_BACKEND_URL ||
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          'http://localhost:3000';

        try {
          const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            return null;
          }

          const envelope = await res.json();
          if (!envelope.success || !envelope.data) {
            return null;
          }

          const { account, access_token, refresh_token } = envelope.data;

          return {
            id: account.id,
            name: account.display_name,
            email: account.email,
            role: account.role,
            accessToken: access_token,
            refreshToken: refresh_token,
          };
        } catch (err) {
          console.error('[Auth.js] authorize error:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET || 'vietsage-booking-auth-secret-key-2026',
});
