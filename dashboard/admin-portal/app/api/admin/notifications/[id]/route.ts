/**
 * dashboard/admin-portal/app/api/admin/notifications/[id]/route.ts
 * PATCH /api/admin/notifications/[id] — mark a single notification as read.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { notificationService } from 'placeprep-backend/src/services/notification.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireAdmin(request);
    const { id } = await params;
    await notificationService.markRead(id, user.userId);
    return successResponse(null, { message: 'Notification marked as read.' });
  } catch (error) {
    return handleApiError(error);
  }
}
