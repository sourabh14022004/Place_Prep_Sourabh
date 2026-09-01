/**
 * dashboard/admin-portal/app/api/admin/students/[id]/route.ts
 * GET   /api/admin/students/[id] — student detail
 * PATCH /api/admin/students/[id] — update placement status etc.
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
    const data = await adminService.getStudentDetail(id);
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
    const updated = await adminService.updateStudent(id, body);
    return successResponse(updated, { message: 'Student updated successfully.' });
  } catch (error) {
    return handleApiError(error);
  }
}
