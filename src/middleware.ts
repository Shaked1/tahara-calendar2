/**
 * Next.js Middleware - בדיקת אימות
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // דפים שדורשים אימות
  const protectedPaths = ['/calendar', '/settings'];
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );

  // אם הדף מוגן והמשתמש לא מחובר - הפניה להתחברות
  if (isProtectedPath && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // אם המשתמש מחובר ומנסה לגשת לדף login/signup - הפניה ללוח
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/calendar';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    '/calendar/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
  ],
};
