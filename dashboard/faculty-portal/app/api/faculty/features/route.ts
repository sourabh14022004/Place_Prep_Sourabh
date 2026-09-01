/**
 * dashboard/faculty-portal/app/api/faculty/features/route.ts
 * GET /api/faculty/features — feature-flag map relevant to the faculty portal.
 * Mirrors admin-controlled Feature Controls.
 */

import { NextRequest } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAuth } from 'placeprep-backend/src/utils/authMiddleware';
import { featureFlagService } from 'placeprep-backend/src/services/featureFlag.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAuth(request);
    const map = await featureFlagService.getMap();
    const facultyMap = Object.fromEntries(
      Object.entries(map).filter(([key]) => key.startsWith('faculty.'))
    );
    return successResponse(facultyMap);
  } catch (error) {
    return handleApiError(error);
  }
}
