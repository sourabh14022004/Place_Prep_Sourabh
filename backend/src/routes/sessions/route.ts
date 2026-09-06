/**
 * dashboard/student-portal/app/api/sessions/route.ts
 * GET  /api/sessions — student's session bookings
 * POST /api/sessions — book a new session
 */

import connectDB from '../../config/db';
import { featureFlagService } from '../../services/featureFlag.service';
import { requireStudent } from '../../utils/authMiddleware';
import { sessionService } from '../../services/session.service';
import { studentRepository } from '../../repositories/student.repository';
import { bookSessionSchema } from '../../validators/session.validator';
import { successResponse } from '../../utils/apiResponse';
import { handleApiError, ApiError } from '../../utils/apiError';
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from '../../utils/rateLimiter';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    await featureFlagService.assertEnabled('student.faculty_connect');
    await featureFlagService.assertEnabled('student.sessions');
    const user = await requireStudent(request);
    const sessions = await sessionService.getStudentSessions(user.userId);
    return successResponse(sessions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  // Rate limit session booking to prevent spam
  const ip = getClientIp(request);
  const rl = checkRateLimit(`sessions:write:${ip}`, RATE_LIMITS.WRITE);
  if (!rl.allowed) {
    return Response.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait before booking again.' } },
      { status: 429 }
    );
  }

  try {
    await connectDB();
    const user = await requireStudent(request);

    const body = await request.json();
    const validation = bookSessionSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest('Invalid session data.', validation.error.flatten().fieldErrors);
    }

    const profile = await studentRepository.findByUserId(user.userId);
    const studentName = profile?.fullName || user.email;

    const session = await sessionService.bookSession(user.userId, studentName, validation.data);
    return successResponse(session, { status: 201, message: 'Session request sent to faculty.' });
  } catch (error) {
    return handleApiError(error);
  }
}
