/**
 * dashboard/faculty-portal/app/api/faculty/notifications/[id]/route.ts
 * PATCH /api/faculty/notifications/[id] — mark as read.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../../config/db';
import { requireFaculty } from '../../../../utils/authMiddleware';
import { notificationService } from '../../../../services/notification.service';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError } from '../../../../utils/apiError';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const user = await requireFaculty(request);
    const { id } = await params;
    await notificationService.markRead(id, user.userId);
    return successResponse(null, { message: 'Marked as read.' });
  } catch (error) {
    return handleApiError(error);
  }
}
