/**
 * dashboard/admin-portal/app/api/admin/notifications/read-all/route.ts
 * POST /api/admin/notifications/read-all — mark all notifications as read for admin.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../../config/db';
import { requireAdmin } from '../../../../utils/authMiddleware';
import { notificationService } from '../../../../services/notification.service';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError } from '../../../../utils/apiError';

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireAdmin(request);
    await notificationService.markAllRead(user.userId);
    return successResponse(null, { message: 'All notifications marked as read.' });
  } catch (error) {
    return handleApiError(error);
  }
}
