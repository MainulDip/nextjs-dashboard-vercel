import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
 
export default NextAuth(authConfig).auth; // checking if authConfig coitions are satisfied or not, and do necessary steeps
 
export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};