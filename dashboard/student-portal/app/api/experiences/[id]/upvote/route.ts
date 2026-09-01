/**
 * dashboard/student-portal/app/api/experiences/[id]/upvote/route.ts
 * POST /api/experiences/[id]/upvote — toggle upvote on an experience.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { checkRateLimit, RATE_LIMITS } from 'placeprep-backend/src/utils/rateLimiter';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { experienceRepository } from 'placeprep-backend/src/repositories/experience.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const user = await requireStudent(request);

    // Write throttle — protects against spam/XP-farming
    const rl = checkRateLimit(`write:${user.userId}`, RATE_LIMITS.WRITE);
    if (!rl.allowed) {
      return NextResponse.json(
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
