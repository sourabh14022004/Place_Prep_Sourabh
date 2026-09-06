/**
 * dashboard/student-portal/app/api/doubts/[id]/replies/route.ts
 * POST /api/doubts/[id]/replies — student adds a reply to their own thread.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../../config/db';
import { checkRateLimit, RATE_LIMITS } from '../../../../utils/rateLimiter';
import { requireStudent } from '../../../../utils/authMiddleware';
import { doubtService } from '../../../../services/doubt.service';
import { studentRepository } from '../../../../repositories/student.repository';
import { addReplySchema } from '../../../../validators/doubt.validator';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../../utils/apiError';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();

    const user = await requireStudent(request);

    // Write throttle — protects against spam/XP-farming
    const rl = checkRateLimit(`write:${user.userId}`, RATE_LIMITS.WRITE);
    if (!rl.allowed) {
      return Response.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' } },
        { status: 429 }
      );
    }
    const { id } = await params;

    const body = await request.json();
    const validation = addReplySchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest('Reply cannot be empty.');
    }

    const profile = await studentRepository.findByUserId(user.userId);
    const studentName = profile?.fullName || user.email;

    const updated = await doubtService.addStudentReply(
      id,
      user.userId,
      studentName,
      validation.data.body
    );

    return successResponse(updated, { message: 'Reply added.' });
  } catch (error) {
    return handleApiError(error);
  }
}
