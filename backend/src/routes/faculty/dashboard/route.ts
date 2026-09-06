/**
 * dashboard/faculty-portal/app/api/faculty/dashboard/route.ts
 * GET /api/faculty/dashboard — faculty dashboard stats.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../config/db';
import { requireFaculty } from '../../../utils/authMiddleware';
import { facultyService } from '../../../services/faculty.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireFaculty(request);
    const data = await facultyService.getDashboard(user.userId);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
