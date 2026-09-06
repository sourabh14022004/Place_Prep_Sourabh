/**
 * dashboard/student-portal/app/api/notifications/route.ts
 * GET /api/notifications — notification feed (20 most recent)
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../config/db';
import { featureFlagService } from '../../services/featureFlag.service';
import { requireStudent } from '../../utils/authMiddleware';
import { notificationService } from '../../services/notification.service';
import { successResponse } from '../../utils/apiResponse';
import { handleApiError } from '../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    await featureFlagService.assertEnabled('student.notifications');
    const user = await requireStudent(request);
    // FIX: no type filter — the feed must include every notification the user
    // received (xp, roadmap, system broadcasts from admin, etc.), not just
    // session/doubt. Previously those types were silently invisible while
    // "Mark all read" still cleared them, confusing the unread state.
    const notifications = await notificationService.getUserNotifications(user.userId);
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return successResponse({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
