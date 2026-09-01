/**
 * dashboard/student-portal/app/api/notifications/route.ts
 * GET /api/notifications — notification feed (20 most recent)
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { featureFlagService } from 'placeprep-backend/src/services/featureFlag.service';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { notificationService } from 'placeprep-backend/src/services/notification.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
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
