/**
 * dashboard/student-portal/proxy.ts
 * JWT cookie middleware — replaced Clerk with custom placeprep_token validation.
 * Edge-safe: uses jose for JWT verification (no Node.js runtime needed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = new Set(['/', '/login', '/api/auth/login', '/api/auth/logout']);


// BUG-D FIX: Never fall back to a known public string in production.
// If JWT_SECRET is not set, fail immediately so the misconfiguration is obvious.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('[FATAL] JWT_SECRET environment variable is not set. Set it before starting the server.');
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'local-dev-only-secret-do-not-use-in-production'
);


export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Allow static assets, Next.js internals, and public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    // METADATA FIX: these public endpoints were being redirected to /login,
    // breaking crawlers, PWA installs and social-share previews.
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/manifest.webmanifest') ||
    pathname.startsWith('/icon.svg') ||
    pathname.startsWith('/apple-icon') ||
    pathname.startsWith('/opengraph-image') ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.has(pathname) || pathname.startsWith('/api/auth/login');
  const token = request.cookies.get('placeprep_token_student')?.value || request.cookies.get('placeprep_token')?.value;

  // Default response (might be modified by auth checks)
  let response = NextResponse.next();

  // Validate JWT for protected routes
  if (!isPublic) {
    // API callers get JSON 401s, never HTML redirects — machine clients and
    // cross-portal fetches would otherwise follow a 302 to /login and misparse.
    const isApi = pathname.startsWith('/api');
    if (!token) {
      response = isApi
        ? NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));
    } else {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);

        // This is the student portal — only students allowed
        if (payload.role !== 'student') {
          response = isApi
            ? NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Students only.' } }, { status: 403 })
            : NextResponse.redirect(new URL('/login', request.url));
          response.cookies.set('placeprep_token_student', '', { maxAge: 0, path: '/' });
          response.cookies.set('placeprep_token', '', { maxAge: 0, path: '/' });
        }
      } catch {
        response = isApi
          ? NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired. Please log in again.' } }, { status: 401 })
          : NextResponse.redirect(new URL('/login', request.url));
        response.cookies.set('placeprep_token_student', '', { maxAge: 0, path: '/' });
        response.cookies.set('placeprep_token', '', { maxAge: 0, path: '/' });
      }
    }
  }

  // Already logged in — don't let back to login
  if (isPublic && pathname === '/login' && token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role === 'student') {
        response = NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // Token invalid — allow login page
    }
  }

  // Secure dynamic CORS for cross-portal API calls (like Faculty login)
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || 'https://nst-prep-portal-by-pranay-student-p.vercel.app',
    process.env.NEXT_PUBLIC_FACULTY_PORTAL_URL || process.env.NEXT_PUBLIC_FACULTY_URL || 'https://nst-prep-portal-by-pranay-faculty-portal-aanchv5wk.vercel.app',
    process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL   || process.env.NEXT_PUBLIC_ADMIN_URL   || 'https://nst-prep-portal-by-pranay-admin-portal-fpdq0kwf2.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://192.168.0.127:3000',
    'http://192.168.0.127:3001',
    'http://192.168.0.127:3002'
  ];

  if (pathname.startsWith('/api') && origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
