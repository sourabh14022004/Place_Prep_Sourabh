/**
 * dashboard/admin-portal/app/api/admin/faculty/[id]/route.ts
 * GET    /api/admin/faculty/[id] — faculty detail
 * PATCH  /api/admin/faculty/[id] — update stream/subject/status
 * DELETE /api/admin/faculty/[id] — deactivate account (soft delete)
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
    const data = await adminService.getFacultyDetail(id);
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
    const updated = await adminService.updateFaculty(id, body);
    return successResponse(updated, { message: 'Faculty profile updated.' });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;
    await adminService.deactivateFaculty(id);
    return successResponse(null, { message: 'Faculty account deactivated.' });
  } catch (error) {
    return handleApiError(error);
  }
}
