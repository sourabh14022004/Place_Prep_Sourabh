/**
 * dashboard/admin-portal/app/api/admin/students/[id]/route.ts
 * GET   /api/admin/students/[id] — student detail
 * PATCH /api/admin/students/[id] — update placement status etc.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../../config/db';
import { requireAdmin } from '../../../../utils/authMiddleware';
import { adminService } from '../../../../services/admin.service';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError } from '../../../../utils/apiError';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;
    const data = await adminService.getStudentDetail(id);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const updated = await adminService.updateStudent(id, body);
    return successResponse(updated, { message: 'Student updated successfully.' });
  } catch (error) {
    return handleApiError(error);
  }
}
