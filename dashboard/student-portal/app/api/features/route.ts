/**
 * dashboard/student-portal/app/api/features/route.ts
 * GET /api/features — feature-flag map for the logged-in student.
 * The client uses this to hide navigation/pages disabled by the admin.
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
    // Only expose student-portal keys to this portal
    const studentMap = Object.fromEntries(
      Object.entries(map).filter(([key]) => key.startsWith('student.'))
    );
    return successResponse(studentMap);
  } catch (error) {
    return handleApiError(error);
  }
}
