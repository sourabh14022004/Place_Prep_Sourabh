/**
 * PATCH /api/doubts/[id]/resolve
 * Student marks their own doubt thread as resolved.
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { checkRateLimit, RATE_LIMITS } from 'placeprep-backend/src/utils/rateLimiter';
import { requireAuth } from 'placeprep-backend/src/utils/authMiddleware';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';
import DoubtThread from 'placeprep-backend/src/models/DoubtThread';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);

    // Write throttle — protects against spam/XP-farming
    const rl = checkRateLimit(`write:${auth.userId}`, RATE_LIMITS.WRITE);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' } },
        { status: 429 }
      );
    }
    await connectDB();

    const resolvedParams = await params;

    const thread = await DoubtThread.findOneAndUpdate(
      { _id: resolvedParams.id, studentId: auth.userId },
      { status: 'resolved', resolvedAt: new Date() },
      { new: true }
    );

    if (!thread) {
      return handleApiError(new ApiError('Doubt thread not found or not owned by you', 404, 'NOT_FOUND'));
    }

    return NextResponse.json(successResponse({ thread }));
  } catch (error) {
    return handleApiError(error);
  }
}
