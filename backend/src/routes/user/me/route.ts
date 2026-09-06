/**
 * dashboard/student-portal/app/api/user/me/route.ts
 * GET  /api/user/me — full student profile
 * PATCH /api/user/me — update profile fields
 */

import connectDB from '../../../config/db';
import { requireStudent } from '../../../utils/authMiddleware';
import { studentService } from '../../../services/student.service';
import { updateProfileSchema } from '../../../validators/student.validator';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const profile = await studentService.getProfile(user.userId);
    // Combine profile with email and roll derived from user
    const profileWithAuth = {
      ...profile,
      email: user.email,
      studentId: user.email.split('@')[0], // Extract roll number from email
    };
    return successResponse(profileWithAuth);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest('Invalid input.', validation.error.flatten().fieldErrors);
    }

    const updated = await studentService.updateProfile(user.userId, validation.data);
    return successResponse(updated, { message: 'Profile updated successfully.' });
  } catch (error) {
    return handleApiError(error);
  }
}
