/**
 * dashboard/faculty-portal/app/api/faculty/doubts/[id]/resolve/route.ts
 * PATCH /api/faculty/doubts/[id]/resolve — mark doubt thread as resolved.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireFaculty } from 'placeprep-backend/src/utils/authMiddleware';
import { facultyService } from 'placeprep-backend/src/services/faculty.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireFaculty(request);
    const { id } = await params;
    const updated = await facultyService.resolveDoubt(id, user.userId);
    return successResponse(updated, { message: 'Doubt marked as resolved.' });
  } catch (error) {
    return handleApiError(error);
  }
}
