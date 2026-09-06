/**
 * dashboard/faculty-portal/app/api/faculty/profile/route.ts
 * GET   /api/faculty/profile — faculty own profile
 * PATCH /api/faculty/profile — update profile fields
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../config/db';
import { requireFaculty } from '../../../utils/authMiddleware';
import { facultyService } from '../../../services/faculty.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireFaculty(request);
    const profile = await facultyService.getProfile(user.userId);
    return successResponse(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireFaculty(request);
    const body = await request.json();

    const updated = await facultyService.updateProfile(user.userId, {
      subject: body.subject,
      stream: body.stream,
      avatarUrl: body.avatarUrl,
      fullName: body.fullName,
      title: body.title,
      department: body.department,
      email: body.email,
    });

    return successResponse(updated, { message: 'Profile updated.' });
  } catch (error) {
    return handleApiError(error);
  }
}
