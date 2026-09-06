/**
 * dashboard/student-portal/app/api/notifications/unread-count/route.ts
 * GET /api/notifications/unread-count
 *
 * BUG-FIX (badge desync): previously this counted only types ['session','doubt']
 * while the notifications list and "Mark all read" operate on ALL unread items.
 * That mismatch made the badge disagree with the list. The badge now reflects
 * the same set the list shows — every unread notification for the user.
 */

import connectDB from '../../../config/db';
import { requireAuth } from '../../../utils/authMiddleware';
import { notificationRepository } from '../../../repositories/notification.repository';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request) {
  try {
    await connectDB();
    const auth = await requireAuth(request);
    const unreadCount = await notificationRepository.countUnread(auth.userId);
    return successResponse({ unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
