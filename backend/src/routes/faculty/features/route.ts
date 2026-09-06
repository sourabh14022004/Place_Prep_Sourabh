/**
 * dashboard/faculty-portal/app/api/faculty/features/route.ts
 * GET /api/faculty/features — feature-flag map relevant to the faculty portal.
 * Mirrors admin-controlled Feature Controls.
 */

import connectDB from '../../../config/db';
import { requireAuth } from '../../../utils/authMiddleware';
import { featureFlagService } from '../../../services/featureFlag.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request) {
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
