/**
 * dashboard/student-portal/app/api/auth/change-password/route.ts
 * POST /api/auth/change-password — authenticated user changes their own password.
 */

import connectDB from '../../../config/db';
import { checkRateLimit, RATE_LIMITS } from '../../../utils/rateLimiter';
import { requireAuth } from '../../../utils/authMiddleware';
import { authService } from '../../../services/auth.service';
import { changePasswordSchema } from '../../../validators/auth.validator';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../utils/apiError';

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireAuth(request);

    // Password brute-force guard: max 3 attempts per hour per account
    const rlPw = checkRateLimit(`pw:${user.userId}`, RATE_LIMITS.PASSWORD);
    if (!rlPw.allowed) {
      return Response.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest('Invalid input.', validation.error.flatten().fieldErrors);
    }

    const { oldPassword, newPassword } = validation.data;
    await authService.changePassword(user.userId, oldPassword, newPassword);

    return successResponse(null, { message: 'Password changed successfully.' });
  } catch (error) {
    return handleApiError(error);
  }
}
