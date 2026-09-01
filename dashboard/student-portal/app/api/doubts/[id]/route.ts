/**
 * dashboard/student-portal/app/api/doubts/[id]/route.ts
 * GET   /api/doubts/[id] — single thread with replies
 * PATCH /api/doubts/[id] — mark as resolved
 *
 * Architecture: Route → Service → Repository → DB (never skip layers)
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { doubtService } from 'placeprep-backend/src/services/doubt.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const { id } = await params;
    const thread = await doubtService.getDoubtById(id, user.userId);
    return successResponse(thread);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const { id } = await params;
    const updated = await doubtService.resolveDoubt(id, user.userId);
    return successResponse(updated, { message: 'Doubt marked as resolved.' });
  } catch (error) {
    return handleApiError(error);
  }
}
