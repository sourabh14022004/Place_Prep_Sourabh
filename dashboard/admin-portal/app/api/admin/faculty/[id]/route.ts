/**
 * dashboard/admin-portal/app/api/admin/faculty/[id]/route.ts
 * GET    /api/admin/faculty/[id] — faculty detail
 * PATCH  /api/admin/faculty/[id] — update stream/subject/status
 * DELETE /api/admin/faculty/[id] — deactivate account (soft delete)
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { adminService } from 'placeprep-backend/src/services/admin.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
