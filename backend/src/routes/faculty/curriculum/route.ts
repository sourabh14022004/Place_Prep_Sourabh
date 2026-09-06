/**
 * dashboard/faculty-portal/app/api/faculty/curriculum/route.ts
 * GET /api/faculty/curriculum — curriculum gap analysis.
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
  await featureFlagService.assertEnabled('faculty.curriculum');
    await requireFaculty(request);
    const data = await facultyService.getCurriculumGap();
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
