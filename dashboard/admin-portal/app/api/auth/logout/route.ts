/**
 * dashboard/admin-portal/app/api/auth/logout/route.ts
 * POST /api/auth/logout — clears JWT cookie from admin portal.
 */

import { NextResponse } from 'next/server';
import { TOKEN_COOKIE_NAME } from 'placeprep-backend/src/utils/authMiddleware';

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true, data: null, message: 'Logged out.' });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
  response.cookies.set(`${TOKEN_COOKIE_NAME}_admin`, '', cookieOptions);
  response.cookies.set(TOKEN_COOKIE_NAME, '', cookieOptions);
  return response;
}
