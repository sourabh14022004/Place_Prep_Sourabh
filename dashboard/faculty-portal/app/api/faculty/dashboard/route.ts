/**
 * dashboard/faculty-portal/app/api/faculty/dashboard/route.ts
 * GET /api/faculty/dashboard — faculty dashboard stats.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireFaculty } from 'placeprep-backend/src/utils/authMiddleware';
import { facultyService } from 'placeprep-backend/src/services/faculty.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireFaculty(request);
    const data = await facultyService.getDashboard(user.userId);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
