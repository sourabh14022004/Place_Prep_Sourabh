/**
 * app/api/auth/logout/route.ts
 * POST /api/auth/logout — clears the session for whichever role is signed in.
 *
 * The three portals used to ship a logout route each, differing only in which
 * role cookie they cleared. Merged into one app there is a single session, so
 * this clears every role cookie plus the legacy un-suffixed one.
 */

import { TOKEN_COOKIE_NAME } from '../../../utils/authMiddleware';
import { successResponse, withCookie } from '../../../utils/apiResponse';

export async function POST(): Promise<Response> {
  const response = successResponse(null, { message: 'Logged out successfully' });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0, // immediate expiry
    path: '/',
  };

  return [
    `${TOKEN_COOKIE_NAME}_student`,
    `${TOKEN_COOKIE_NAME}_faculty`,
    `${TOKEN_COOKIE_NAME}_admin`,
    TOKEN_COOKIE_NAME,
  ].reduce((res, name) => withCookie(res, name, '', cookieOptions), response);
}
