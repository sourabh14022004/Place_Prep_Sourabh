/**
 * dashboard/admin-portal/app/api/admin/notifications/read-all/route.ts
 * POST /api/admin/notifications/read-all — mark all notifications as read for admin.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { notificationService } from 'placeprep-backend/src/services/notification.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireAdmin(request);
    await notificationService.markAllRead(user.userId);
    return successResponse(null, { message: 'All notifications marked as read.' });
  } catch (error) {
    return handleApiError(error);
  }
}
