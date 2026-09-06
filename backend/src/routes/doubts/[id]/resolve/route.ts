/**
 * PATCH /api/doubts/[id]/resolve
 * Student marks their own doubt thread as resolved.
 */
import connectDB from '../../../../config/db';
import { checkRateLimit, RATE_LIMITS } from '../../../../utils/rateLimiter';
import { requireAuth } from '../../../../utils/authMiddleware';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../../utils/apiError';
import DoubtThread from '../../../../models/DoubtThread';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);

    // Write throttle — protects against spam/XP-farming
    const rl = checkRateLimit(`write:${auth.userId}`, RATE_LIMITS.WRITE);
    if (!rl.allowed) {
      return Response.json(
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

    return Response.json(successResponse({ thread }));
  } catch (error) {
    return handleApiError(error);
  }
}
