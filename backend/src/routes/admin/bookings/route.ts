/**
 * dashboard/admin-portal/app/api/admin/bookings/route.ts
 * GET /api/admin/bookings — all session bookings with pagination.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../config/db';
import { requireAdmin } from '../../../utils/authMiddleware';
import { adminService } from '../../../services/admin.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

    const { sessions, total } = await adminService.getBookings(page, limit);

    return successResponse(sessions, {
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
