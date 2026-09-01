/**
 * dashboard/admin-portal/app/api/admin/users/create/route.ts
 * POST /api/admin/users/create — admin creates a student or faculty account.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { adminService } from 'placeprep-backend/src/services/admin.service';
import { createUserSchema } from 'placeprep-backend/src/validators/auth.validator';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';

export async function POST(request: NextRequest): Promise<NextResponse> {
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
