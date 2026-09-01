/**
 * dashboard/admin-portal/proxy.ts
 * JWT cookie middleware for admin portal — only 'admin' role tokens allowed.
 * Unauthenticated / unauthorized requests are sent to the Unified Login Page
 * hosted on the student portal.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/api/auth', '/auth/callback'];

// Central login page — hosted on student portal
const UNIFIED_LOGIN_URL =
  process.env.NEXT_PUBLIC_LOGIN_URL ||
  (process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL
    ? `${process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL}/login`
    : "http://localhost:3000/login");

// FAIL LOUD: If JWT_SECRET is missing in production, the fallback secret will
// silently reject ALL tokens from the student portal. Throw immediately.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('[FATAL] JWT_SECRET is not set in admin portal env vars. Set it in Vercel dashboard.');
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'placeprep_fallback_secret_change_in_prod'
);

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    // METADATA FIX: public endpoints must never be auth-redirected
    (pathname.startsWith('/robots.txt') ||
     pathname.startsWith('/manifest.webmanifest') ||
     pathname.startsWith('/icon.svg') ||
     pathname.startsWith('/apple-icon') ||
     pathname.startsWith('/opengraph-image')) ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const token = request.cookies.get('placeprep_token_admin')?.value || request.cookies.get('placeprep_token')?.value;

  if (!isPublic) {
    if (!token) {
      return NextResponse.redirect(new URL(UNIFIED_LOGIN_URL));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      if (payload.role !== 'admin') {
        const response = NextResponse.redirect(new URL(UNIFIED_LOGIN_URL));
        response.cookies.set('placeprep_token_admin', '', { maxAge: 0, path: '/' });
        response.cookies.set('placeprep_token', '', { maxAge: 0, path: '/' });
        return response;
      }
    } catch {
      const response = NextResponse.redirect(new URL(UNIFIED_LOGIN_URL));
      response.cookies.set('placeprep_token_admin', '', { maxAge: 0, path: '/' });
      response.cookies.set('placeprep_token', '', { maxAge: 0, path: '/' });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
