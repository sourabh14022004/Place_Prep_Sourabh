/**
 * dashboard/student-portal/app/api/user/me/onboarding/route.ts
 * POST /api/user/me/onboarding — complete onboarding, build roadmaps, award 100 XP.
 */

import connectDB from '../../../../config/db';
import { requireStudent } from '../../../../utils/authMiddleware';
import { studentService } from '../../../../services/student.service';
import { onboardingSchema } from '../../../../validators/student.validator';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../../utils/apiError';

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    const body = await request.json();
    const validation = onboardingSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest('Invalid onboarding data.', validation.error.flatten().fieldErrors);
    }

    const result = await studentService.completeOnboarding(user.userId, validation.data);
    return successResponse(result, { message: 'Onboarding complete! Your roadmap is ready.' });
  } catch (error) {
    return handleApiError(error);
  }
}
