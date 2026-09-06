/**
 * dashboard/web/proxy.ts
 * Single role-aware auth middleware for the merged portal.
 *
 * Replaces the three per-portal proxy.ts files. Because student, faculty and
 * admin now share one origin, the cross-origin machinery those files needed —
 * a JWT handed between domains in a URL query param, a hardcoded CORS
 * allowlist, and two different fallback JWT secrets — is all gone. One cookie,
 * one secret, one redirect target.
 *
 * URL contract:
 *   /                       public landing
 *   /login /register        public
 *   /faculty/**             faculty role only
 *   /admin/**               admin role only
 *   everything else authed  student role
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

type Role = 'student' | 'faculty' | 'admin';

const PUBLIC_PATHS = new Set(['/', '/login', '/register']);
const PUBLIC_PREFIXES = ['/api/auth/login', '/api/auth/logout', '/invite'];

const STATIC_PREFIXES = [
  '/_next', '/favicon', '/robots.txt', '/sitemap.xml',
  '/manifest.webmanifest', '/icon.svg', '/apple-icon', '/opengraph-image',
];
const STATIC_FILE = /\.(png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$/;

// Fail loud rather than silently rejecting every token in production.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('[FATAL] JWT_SECRET is not set. Set it before starting the server.');
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'local-dev-only-secret-do-not-use-in-production'
);

/**
 * Which role owns this path, by URL prefix.
 *
 * /api is stripped first so an API route is governed by the same rule as the
 * page it backs: /api/admin/* is admin-owned exactly as /admin/* is. Without
 * the strip every /api/** path fell through to 'student', which let a student
 * token reach admin and faculty endpoints.
 */
function requiredRole(pathname: string): Role {
  const p = pathname.startsWith('/api/') ? pathname.slice(4) : pathname;
  if (p === '/faculty' || p.startsWith('/faculty/')) return 'faculty';
  if (p === '/admin' || p.startsWith('/admin/')) return 'admin';
  return 'student';
}

/** Landing page for a role that hit a path it doesn't own. */
function homeFor(role: string): string {
  if (role === 'faculty') return '/faculty';
  if (role === 'admin') return '/admin/overview';
  return '/dashboard';
}

function clearSession(response: NextResponse): NextResponse {
  for (const name of [
    'placeprep_token_student', 'placeprep_token_faculty',
    'placeprep_token_admin', 'placeprep_token',
  ]) {
    response.cookies.set(name, '', { maxAge: 0, path: '/' });
  }
  return response;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p)) || STATIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const isPublic =
    PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  const isApi = pathname.startsWith('/api');

  const cookies = request.cookies;
  const token =
    cookies.get('placeprep_token_student')?.value ||
    cookies.get('placeprep_token_faculty')?.value ||
    cookies.get('placeprep_token_admin')?.value ||
    cookies.get('placeprep_token')?.value;

  if (isPublic) {
    // Signed-in users shouldn't land back on /login — send them to their home.
    if (pathname === '/login' && token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL(homeFor(payload.role as string), request.url));
      } catch {
        // Invalid token — let them log in again.
      }
    }
    return NextResponse.next();
  }

  // API callers get JSON, never an HTML redirect they'd misparse.
  const deny = (code: string, message: string, status: number) =>
    isApi
      ? NextResponse.json({ success: false, error: { code, message } }, { status })
      : NextResponse.redirect(new URL('/login', request.url));

  if (!token) {
    return deny('UNAUTHORIZED', 'Authentication required.', 401);
  }

  let role: string;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    role = payload.role as string;
  } catch {
    return clearSession(deny('UNAUTHORIZED', 'Session expired. Please log in again.', 401));
  }

  const needed = requiredRole(pathname);
  if (role !== needed) {
    // A valid session in the wrong section is not a broken session: send the
    // user to their own home instead of logging them out.
    return isApi
      ? NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: `This resource requires ${needed} access.` } },
          { status: 403 }
        )
      : NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
