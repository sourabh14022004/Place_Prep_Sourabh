/**
 * dashboard/faculty-portal/app/api/faculty/rankings/route.ts
 * GET /api/faculty/rankings — company rankings by student interest count.
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
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'all';
    const search = searchParams.get('search') || undefined;

    await connectDB();
  await featureFlagService.assertEnabled('faculty.rankings');
    await requireFaculty(request);
    const data = await facultyService.getCompanyRankings({ timeframe, search });
    return successResponse({ companies: data });
  } catch (error) {
    return handleApiError(error);
  }
}
