/**
 * dashboard/student-portal/app/api/sessions/route.ts
 * GET  /api/sessions — student's session bookings
 * POST /api/sessions — book a new session
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { featureFlagService } from 'placeprep-backend/src/services/featureFlag.service';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { sessionService } from 'placeprep-backend/src/services/session.service';
import { studentRepository } from 'placeprep-backend/src/repositories/student.repository';
import { bookSessionSchema } from 'placeprep-backend/src/validators/session.validator';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from 'placeprep-backend/src/utils/rateLimiter';

export async function GET(request: NextRequest): Promise<NextResponse> {
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit session booking to prevent spam
  const ip = getClientIp(request);
  const rl = checkRateLimit(`sessions:write:${ip}`, RATE_LIMITS.WRITE);
  if (!rl.allowed) {
    return NextResponse.json(
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
