/**
 * dashboard/student-portal/app/api/features/route.ts
 * GET /api/features — feature-flag map for the logged-in student.
 * The client uses this to hide navigation/pages disabled by the admin.
 */

import connectDB from '../../config/db';
import { requireAuth } from '../../utils/authMiddleware';
import { featureFlagService } from '../../services/featureFlag.service';
import { successResponse } from '../../utils/apiResponse';
import { handleApiError } from '../../utils/apiError';

export async function GET(request: Request) {
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
