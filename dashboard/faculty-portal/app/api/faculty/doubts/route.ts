/**
 * dashboard/faculty-portal/app/api/faculty/doubts/route.ts
 * GET /api/faculty/doubts — all doubt threads assigned to this faculty.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { featureFlagService } from 'placeprep-backend/src/services/featureFlag.service';
import { requireFaculty } from 'placeprep-backend/src/utils/authMiddleware';
import { facultyService } from 'placeprep-backend/src/services/faculty.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
  await featureFlagService.assertEnabled('faculty.doubts');
    const user = await requireFaculty(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const threads = await facultyService.getDoubts(user.userId, status);
    return successResponse(threads);
  } catch (error) {
    return handleApiError(error);
  }
}
