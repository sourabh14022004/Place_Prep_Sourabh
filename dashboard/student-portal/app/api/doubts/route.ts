/**
 * dashboard/student-portal/app/api/doubts/route.ts
 * GET  /api/doubts — student's own threads (paginated)
 * POST /api/doubts — create new doubt thread
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { featureFlagService } from 'placeprep-backend/src/services/featureFlag.service';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { doubtService } from 'placeprep-backend/src/services/doubt.service';
import { studentRepository } from 'placeprep-backend/src/repositories/student.repository';
import { createDoubtSchema } from 'placeprep-backend/src/validators/doubt.validator';
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
    await featureFlagService.assertEnabled('student.doubts');
    const user = await requireStudent(request);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const { threads, total } = await doubtService.getStudentDoubts(user.userId, page, 10);
    return successResponse(threads, { meta: { page, limit: 10, total } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit write operations
  const ip = getClientIp(request);
  const rl = checkRateLimit(`doubts:write:${ip}`, RATE_LIMITS.WRITE);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' } },
      { status: 429 }
    );
  }

  try {
    await connectDB();
    const user = await requireStudent(request);

    const body = await request.json();
    const validation = createDoubtSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest('Invalid input.', validation.error.flatten().fieldErrors);
    }

    const profile = await studentRepository.findByUserId(user.userId);
    const studentName = profile?.fullName || user.email;

    const thread = await doubtService.createDoubt(user.userId, studentName, {
      subject: validation.data.subject,
      body: validation.data.body,
      tag: validation.data.tag,
      assignedFacultyId: validation.data.assignedFacultyId,
    });

    return successResponse(thread, { status: 201, message: 'Doubt submitted successfully.' });
  } catch (error) {
    return handleApiError(error);
  }
}
