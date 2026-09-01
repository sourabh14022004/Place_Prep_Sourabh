/**
 * dashboard/admin-portal/app/api/admin/users/[id]/reset-password/route.ts
 * POST /api/admin/users/[id]/reset-password — force-reset any user's password.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { adminService } from 'placeprep-backend/src/services/admin.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;

    const { tempPassword } = await adminService.resetUserPassword(id);

    return successResponse(
      { tempPassword },
      { message: 'Password reset. Share the new temporary password with the user.' }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
