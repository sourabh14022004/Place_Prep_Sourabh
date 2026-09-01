/**
 * dashboard/student-portal/app/api/notifications/unread-count/route.ts
 * GET /api/notifications/unread-count
 *
 * BUG-FIX (badge desync): previously this counted only types ['session','doubt']
 * while the notifications list and "Mark all read" operate on ALL unread items.
 * That mismatch made the badge disagree with the list. The badge now reflects
 * the same set the list shows — every unread notification for the user.
 */

import { NextRequest } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAuth } from 'placeprep-backend/src/utils/authMiddleware';
import { notificationRepository } from 'placeprep-backend/src/repositories/notification.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const auth = await requireAuth(request);
    const unreadCount = await notificationRepository.countUnread(auth.userId);
    return successResponse({ unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
