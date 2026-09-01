/**
 * dashboard/faculty-portal/app/api/faculty/notifications/read-all/route.ts
 * POST /api/faculty/notifications/read-all — mark all notifications as read.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireFaculty } from 'placeprep-backend/src/utils/authMiddleware';
import { notificationService } from 'placeprep-backend/src/services/notification.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireFaculty(request);
    await notificationService.markAllRead(user.userId);
    return successResponse({ marked: true }, { message: 'All notifications marked as read.' });
  } catch (error) {
    return handleApiError(error);
  }
}
