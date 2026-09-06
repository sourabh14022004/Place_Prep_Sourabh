/**
 * dashboard/admin-portal/app/api/admin/notifications/[id]/route.ts
 * PATCH /api/admin/notifications/[id] — mark a single notification as read.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../../config/db';
import { requireAdmin } from '../../../../utils/authMiddleware';
import { notificationService } from '../../../../services/notification.service';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError } from '../../../../utils/apiError';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const user = await requireAdmin(request);
    const { id } = await params;
    await notificationService.markRead(id, user.userId);
    return successResponse(null, { message: 'Notification marked as read.' });
  } catch (error) {
    return handleApiError(error);
  }
}
