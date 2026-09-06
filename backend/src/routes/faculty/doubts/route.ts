/**
 * dashboard/faculty-portal/app/api/faculty/doubts/route.ts
 * GET /api/faculty/doubts — all doubt threads assigned to this faculty.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../config/db';
import { featureFlagService } from '../../../services/featureFlag.service';
import { requireFaculty } from '../../../utils/authMiddleware';
import { facultyService } from '../../../services/faculty.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
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
