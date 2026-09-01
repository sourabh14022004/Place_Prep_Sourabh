/**
 * dashboard/faculty-portal/app/auth/callback/route.ts
 * GET /auth/callback?token=<jwt>&role=faculty
 *
 * Called by the unified login page after a successful faculty login.
 * Since cookies can't cross ports/domains, the token is passed via URL param.
 * This route sets the HttpOnly cookie on the faculty portal's own domain
 * and then redirects to the faculty dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE_NAME } from 'placeprep-backend/src/utils/authMiddleware';

const LOGIN_URL =
  process.env.NEXT_PUBLIC_LOGIN_URL ||
  (process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL
    ? `${process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL}/login`
    : 'http://localhost:3000/login');

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');
  const role = searchParams.get('role');

  // Validate — must be a faculty token
  if (!token || role !== 'faculty') {
    return NextResponse.redirect(new URL(LOGIN_URL));
  }

  // Set the cookie on this domain and redirect to the faculty dashboard
  const response = NextResponse.redirect(new URL('/', request.nextUrl.origin));
  response.cookies.set(`${TOKEN_COOKIE_NAME}_faculty`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}
