/**
 * dashboard/student-portal/app/api/user/me/onboarding/route.ts
 * POST /api/user/me/onboarding — complete onboarding, build roadmaps, award 100 XP.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { studentService } from 'placeprep-backend/src/services/student.service';
import { onboardingSchema } from 'placeprep-backend/src/validators/student.validator';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';

export async function POST(request: NextRequest): Promise<NextResponse> {
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
