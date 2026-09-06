/**
 * dashboard/student-portal/app/api/doubts/route.ts
 * GET  /api/doubts — student's own threads (paginated)
 * POST /api/doubts — create new doubt thread
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../config/db';
import { featureFlagService } from '../../services/featureFlag.service';
import { requireStudent } from '../../utils/authMiddleware';
import { doubtService } from '../../services/doubt.service';
import { studentRepository } from '../../repositories/student.repository';
import { createDoubtSchema } from '../../validators/doubt.validator';
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

export async function POST(request: Request): Promise<Response> {
  // Rate limit write operations
  const ip = getClientIp(request);
  const rl = checkRateLimit(`doubts:write:${ip}`, RATE_LIMITS.WRITE);
  if (!rl.allowed) {
    return Response.json(
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
