/**
 * dashboard/student-portal/app/api/notifications/[id]/route.ts
 * PATCH /api/notifications/[id] — mark single notification as read.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { notificationService } from 'placeprep-backend/src/services/notification.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const { id } = await params;
    await notificationService.markRead(id, user.userId);
    return successResponse(null, { message: 'Marked as read.' });
  } catch (error) {
    return handleApiError(error);
  }
}
