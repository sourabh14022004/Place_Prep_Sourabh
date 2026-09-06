/**
 * dashboard/student-portal/app/api/experiences/[id]/upvote/route.ts
 * POST /api/experiences/[id]/upvote — toggle upvote on an experience.
 */

import connectDB from '../../../../config/db';
import { checkRateLimit, RATE_LIMITS } from '../../../../utils/rateLimiter';
import { requireStudent } from '../../../../utils/authMiddleware';
import { experienceRepository } from '../../../../repositories/experience.repository';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError } from '../../../../utils/apiError';

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
    const result = await experienceRepository.toggleUpvote(id, user.userId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
