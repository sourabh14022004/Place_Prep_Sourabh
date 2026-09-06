/**
 * dashboard/faculty-portal/app/api/faculty/notifications/read-all/route.ts
 * POST /api/faculty/notifications/read-all — mark all notifications as read.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../../config/db';
import { requireFaculty } from '../../../../utils/authMiddleware';
import { notificationService } from '../../../../services/notification.service';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError } from '../../../../utils/apiError';

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireFaculty(request);
    await notificationService.markAllRead(user.userId);
    return successResponse({ marked: true }, { message: 'All notifications marked as read.' });
  } catch (error) {
    return handleApiError(error);
  }
}
