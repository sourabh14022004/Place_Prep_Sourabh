/**
 * dashboard/faculty-portal/app/api/faculty/notifications/route.ts
 * GET /api/faculty/notifications — faculty notification feed.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../config/db';
import { requireFaculty } from '../../../utils/authMiddleware';
import { notificationService } from '../../../services/notification.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireFaculty(request);
    const notifications = await notificationService.getUserNotifications(user.userId);
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return successResponse({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
