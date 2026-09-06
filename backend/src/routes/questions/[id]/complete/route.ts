/**
 * dashboard/student-portal/app/api/questions/[id]/complete/route.ts
 * POST /api/questions/[id]/complete — mark question solved, earn XP.
 */

import connectDB from '../../../../config/db';
import { checkRateLimit, RATE_LIMITS } from '../../../../utils/rateLimiter';
import { requireStudent } from '../../../../utils/authMiddleware';
import { studentService } from '../../../../services/student.service';
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

    const body = await request.json().catch(() => ({}));
    const roadmapId = body?.roadmapId as string | undefined;

    const result = await studentService.completeQuestion(user.userId, id, roadmapId);
    return successResponse(result, { message: `+${result.xpEarned} XP earned!` });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const { id } = await params;

    await studentService.uncompleteQuestion(user.userId, id);
    return successResponse({ removed: true }, { message: 'Question unmarked' } as any);
  } catch (error) {
    return handleApiError(error);
  }
}
