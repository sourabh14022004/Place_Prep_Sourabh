/**
 * dashboard/student-portal/app/api/auth/logout/route.ts
 * POST /api/auth/logout — clears the JWT cookie.
 */

import { NextResponse } from 'next/server';
import { TOKEN_COOKIE_NAME } from 'placeprep-backend/src/utils/authMiddleware';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';

export async function POST(): Promise<NextResponse> {
  const response = successResponse(null, { message: 'Logged out successfully' });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0, // immediate expiry
    path: '/',
  };
  response.cookies.set(`${TOKEN_COOKIE_NAME}_student`, '', cookieOptions);
  response.cookies.set(TOKEN_COOKIE_NAME, '', cookieOptions);
  return response;
}
