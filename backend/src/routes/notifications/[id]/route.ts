/**
 * dashboard/student-portal/app/api/notifications/[id]/route.ts
 * PATCH /api/notifications/[id] — mark single notification as read.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../config/db';
import { requireStudent } from '../../../utils/authMiddleware';
import { notificationService } from '../../../services/notification.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const { id } = await params;
    await notificationService.markRead(id, user.userId);
    return successResponse(null, { message: 'Marked as read.' });
  } catch (error) {
    return handleApiError(error);
  }
}
