/**
 * dashboard/admin-portal/app/api/auth/login/route.ts
 * POST /api/auth/login — admin-portal-owned login endpoint.
 *
 * Previously the login page called the Student Portal's /api/auth/login,
 * meaning admin login failed entirely if the Student Portal dev server was not
 * running. This route hosts the same logic directly inside the Admin Portal so
 * it is fully self-contained.
 *
 * Rate limiting counts FAILURES ONLY (successful logins reset the buckets) —
 * mirrors the unified login route on the student portal.
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
  // Payload size guard
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
    const ipKey = `admin_login:${ip}`;
    const emailKey = `admin_login:email:${email.toLowerCase()}`;

    // Gate on existing failure streaks without consuming budget
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
          headers: { 'Retry-After': String(Math.ceil((rlIp.resetAt - Date.now()) / 1000)) },
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
            message: 'Too many failed attempts for this account. Please wait 15 minutes.',
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

      // Enforce admin-only access at the API level
      if (result.role !== 'admin') {
        throw ApiError.forbidden('Access denied. This portal is for administrators only.');
      }
    } catch (authError) {
      // Failed attempt → record strikes
      checkRateLimit(ipKey, RATE_LIMITS.LOGIN_IP);
      checkRateLimit(emailKey, RATE_LIMITS.LOGIN_FAILURES);
      throw authError;
    }

    // Success → clear buckets
    resetRateLimit(ipKey);
    resetRateLimit(emailKey);

    const response = successResponse(
      { role: result.role, userId: result.userId, name: result.name },
      { message: 'Login successful' }
    );

    response.cookies.set(`${TOKEN_COOKIE_NAME}_${result.role}`, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
