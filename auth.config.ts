import type { NextAuthConfig } from 'next-auth';
 
// build an auth config to use by `middleware.ts` and `auth.ts`
export const authConfig = {
  pages: {
    signIn: '/login', // if the callback block return false, redirect to this page
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to the specified url listed in pages 
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for-now
} satisfies NextAuthConfig;

// satisfies is typescript's type inference feature. Here it check and ensure ts compiler that `it is NextAuthConfig Object`