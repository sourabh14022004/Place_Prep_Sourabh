/**
 * dashboard/student-portal/app/api/doubts/[id]/route.ts
 * GET   /api/doubts/[id] — single thread with replies
 * PATCH /api/doubts/[id] — mark as resolved
 *
 * Architecture: Route → Service → Repository → DB (never skip layers)
 */

import connectDB from '../../../config/db';
import { requireStudent } from '../../../utils/authMiddleware';
import { doubtService } from '../../../services/doubt.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const { id } = await params;
    const thread = await doubtService.getDoubtById(id, user.userId);
    return successResponse(thread);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const { id } = await params;
    const updated = await doubtService.resolveDoubt(id, user.userId);
    return successResponse(updated, { message: 'Doubt marked as resolved.' });
  } catch (error) {
    return handleApiError(error);
  }
}
