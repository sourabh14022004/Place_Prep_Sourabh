/**
 * dashboard/admin-portal/app/api/admin/faculty/route.ts
 * GET  /api/admin/faculty — list all faculty members
 * POST /api/admin/faculty — invite a new faculty member
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../config/db';
import { requireAdmin } from '../../../utils/authMiddleware';
import { adminService } from '../../../services/admin.service';
import { createUserSchema } from '../../../validators/auth.validator';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);
    const faculty = await adminService.getFaculty();
    return successResponse({ faculty, total: faculty.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json();
    const validation = createUserSchema.safeParse({ ...body, role: 'faculty' });
    if (!validation.success) {
      throw ApiError.badRequest('Invalid data.', validation.error.flatten().fieldErrors);
    }

    const { tempPassword, userId } = await adminService.createFaculty(validation.data);

    return successResponse(
      { userId, tempPassword },
      {
        status: 201,
        message: 'Faculty account created. Share the temporary password with the faculty member.',
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
