/**
 * dashboard/faculty-portal/app/api/faculty/doubts/[id]/resolve/route.ts
 * PATCH /api/faculty/doubts/[id]/resolve — mark doubt thread as resolved.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../../../config/db';
import { requireFaculty } from '../../../../../utils/authMiddleware';
import { facultyService } from '../../../../../services/faculty.service';
import { successResponse } from '../../../../../utils/apiResponse';
import { handleApiError } from '../../../../../utils/apiError';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const user = await requireFaculty(request);
    const { id } = await params;
    const updated = await facultyService.resolveDoubt(id, user.userId);
    return successResponse(updated, { message: 'Doubt marked as resolved.' });
  } catch (error) {
    return handleApiError(error);
  }
}
