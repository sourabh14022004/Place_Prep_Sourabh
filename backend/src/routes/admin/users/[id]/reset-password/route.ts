/**
 * dashboard/admin-portal/app/api/admin/users/[id]/reset-password/route.ts
 * POST /api/admin/users/[id]/reset-password — force-reset any user's password.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../../../config/db';
import { requireAdmin } from '../../../../../utils/authMiddleware';
import { adminService } from '../../../../../services/admin.service';
import { successResponse } from '../../../../../utils/apiResponse';
import { handleApiError } from '../../../../../utils/apiError';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
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
