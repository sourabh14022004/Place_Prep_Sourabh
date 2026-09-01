/**
 * dashboard/faculty-portal/app/api/faculty/curriculum/route.ts
 * GET /api/faculty/curriculum — curriculum gap analysis.
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
  await featureFlagService.assertEnabled('faculty.curriculum');
    await requireFaculty(request);
    const data = await facultyService.getCurriculumGap();
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
