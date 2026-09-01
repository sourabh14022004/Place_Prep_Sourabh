/**
 * dashboard/admin-portal/app/api/admin/students/route.ts
 * GET /api/admin/students — paginated student list with search + filters.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { adminService } from 'placeprep-backend/src/services/admin.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const search = searchParams.get('search') || undefined;
    const batch = searchParams.get('batch') || undefined;
    const placementStatus = searchParams.get('status') || undefined;

    const { students, total } = await adminService.getStudents({ page, limit, search, batch, placementStatus });

    return successResponse(
      { students, total },
      {
        meta: { page, limit, totalPages: Math.ceil(total / limit) },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
