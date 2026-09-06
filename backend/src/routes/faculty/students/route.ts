/**
 * dashboard/faculty-portal/app/api/faculty/students/route.ts
 * GET /api/faculty/students — student matrix for faculty view.
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
  await featureFlagService.assertEnabled('faculty.students');
    await requireFaculty(request);
    const matrix = await facultyService.getStudentsMatrix();
    return successResponse(matrix);
  } catch (error) {
    return handleApiError(error);
  }
}
