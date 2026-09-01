/**
 * dashboard/student-portal/app/api/auth/login/route.ts
 * POST /api/auth/login — unified login for all three portals.
 * Student portal hosts this endpoint; faculty and admin login pages point here.
 *
 * Security:
 * - Rate limited on FAILURES ONLY (the #1 UX bug: successful logins used to
 *   consume the budget and lock real users out for 15 minutes):
 *     • per-account bucket  — 8 failed attempts / 15 min (defeats brute-force)
 *     • per-IP bucket       — 30 attempts / 15 min   (college NATs share IPs)
 * - Successful logins RESET both buckets.
 * - Payload size guard, generic error messages (no user enumeration),
 *   timing-safe unknown-email path, HTTP-only cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { authService } from 'placeprep-backend/src/services/auth.service';
import { loginSchema } from 'placeprep-backend/src/validators/auth.validator';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { ApiError, handleApiError } from 'placeprep-backend/src/utils/apiError';
import { TOKEN_COOKIE_NAME } from 'placeprep-backend/src/utils/authMiddleware';
import {
  checkRateLimit,
  peekRateLimit,
  resetRateLimit,
  getClientIp,
  RATE_LIMITS,
} from 'placeprep-backend/src/utils/rateLimiter';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 1. Payload size guard — reject bodies over 1 KB ──
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1024) {
    return NextResponse.json(
      { success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large.' } },
      { status: 413 }
    );
  }

  try {
    await connectDB();

    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      throw ApiError.badRequest('Invalid input.', validation.error.flatten().fieldErrors);
    }

    const { email, password } = validation.data;
    const ip = getClientIp(request);
    const ipKey = `login:ip:${ip}`;
    const emailKey = `login:email:${email.toLowerCase()}`;

    // ── 2. GATE on existing failure streaks (without consuming anything).
    // Legitimate users only hit these after 8 REAL wrong-password attempts.
    const rlIp = peekRateLimit(ipKey, RATE_LIMITS.LOGIN_IP);
    if (!rlIp.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many failed attempts from this network. Please wait 15 minutes.',
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rlIp.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const rlEmail = peekRateLimit(emailKey, RATE_LIMITS.LOGIN_FAILURES);
    if (!rlEmail.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many failed attempts for this account. Please wait 15 minutes or reset your password.',
          },
        },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rlEmail.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    let result;
    try {
      result = await authService.login(email, password);
    } catch (authError) {
      // ── FAILED attempt → record strikes in both buckets ──
      checkRateLimit(ipKey, RATE_LIMITS.LOGIN_IP);
      checkRateLimit(emailKey, RATE_LIMITS.LOGIN_FAILURES);
      throw authError;
    }

    // ── 3. SUCCESS → clear both buckets so wins never cost budget ──
    resetRateLimit(ipKey);
    resetRateLimit(emailKey);

    // Override redirectUrl here using THIS portal's own env vars.
    // This is more reliable than the shared backend service resolving env vars.
    const PORTAL_URLS: Record<string, string> = {
      student: process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || 'http://localhost:3000',
      faculty: process.env.NEXT_PUBLIC_FACULTY_PORTAL_URL || 'http://localhost:3001',
      admin:   process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL   || 'http://localhost:3002',
    };
    const redirectUrl = PORTAL_URLS[result.role] || PORTAL_URLS.student;

    const response = successResponse(
      {
        role: result.role,
        userId: result.userId,
        name: result.name,
        redirectUrl,
        token: result.token, // Needed for cross-origin portal cookie handoff
      },
      { message: 'Login successful' }
    );

    // Set HTTP-only cookie — 7 days
    response.cookies.set(`${TOKEN_COOKIE_NAME}_${result.role}`, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
