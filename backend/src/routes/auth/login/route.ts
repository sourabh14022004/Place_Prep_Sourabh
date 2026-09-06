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

import connectDB from '../../../config/db';
import { authService } from '../../../services/auth.service';
import { loginSchema } from '../../../validators/auth.validator';
import { successResponse, withCookie } from '../../../utils/apiResponse';
import { ApiError, handleApiError } from '../../../utils/apiError';
import { TOKEN_COOKIE_NAME } from '../../../utils/authMiddleware';
import {
  checkRateLimit,
  peekRateLimit,
  resetRateLimit,
  getClientIp,
  RATE_LIMITS,
} from '../../../utils/rateLimiter';

export async function POST(request: Request): Promise<Response> {
  // ── 1. Payload size guard — reject bodies over 1 KB ──
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1024) {
    return Response.json(
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
      return Response.json(
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
      return Response.json(
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

    // Single origin now: each role lands on its own path, not another host.
    // This replaced a cross-portal handoff that passed the JWT in a query param.
    const ROLE_HOME: Record<string, string> = {
      student: '/dashboard',
      faculty: '/faculty',
      admin:   '/admin/overview',
    };
    const redirectUrl = ROLE_HOME[result.role] || ROLE_HOME.student;

    const response = successResponse(
      {
        role: result.role,
        userId: result.userId,
        name: result.name,
        redirectUrl,
      },
      { message: 'Login successful' }
    );

    // Set HTTP-only cookie — 7 days
    return withCookie(response, `${TOKEN_COOKIE_NAME}_${result.role}`, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: '/',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
