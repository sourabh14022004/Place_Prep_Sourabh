/**
 * dashboard/student-portal/app/api/notifications/read-all/route.ts
 * POST /api/notifications/read-all — mark all notifications as read.
 */

import connectDB from '../../../config/db';
import { requireStudent } from '../../../utils/authMiddleware';
import { notificationService } from '../../../services/notification.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    await notificationService.markAllRead(user.userId);
    return successResponse({ marked: true }, { message: 'All notifications marked as read.' });
  } catch (error) {
    return handleApiError(error);
  }
}
