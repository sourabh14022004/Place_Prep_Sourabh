/**
 * dashboard/admin-portal/app/api/admin/users/create/route.ts
 * POST /api/admin/users/create — admin creates a student or faculty account.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../../config/db';
import { requireAdmin } from '../../../../utils/authMiddleware';
import { adminService } from '../../../../services/admin.service';
import { createUserSchema } from '../../../../validators/auth.validator';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../../utils/apiError';

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest('Invalid data.', validation.error.flatten().fieldErrors);
    }

    const { tempPassword, userId } = await adminService.createUser(validation.data);

    return successResponse(
      { userId, tempPassword },
      {
        status: 201,
        message: `Account created for ${validation.data.email}. Share the temporary password.`,
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
