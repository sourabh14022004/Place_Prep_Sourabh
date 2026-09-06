/**
 * dashboard/student-portal/app/api/auth/me/route.ts
 * GET /api/auth/me — returns current user from JWT cookie.
 */

import connectDB from '../../../config/db';
import { requireAuth } from '../../../utils/authMiddleware';
import { studentRepository } from '../../../repositories/student.repository';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireAuth(request, 'student');
    const profile = await studentRepository.findByUserId(user.userId);

    return successResponse({
      userId: user.userId,
      role: user.role,
      email: user.email,
      fullName: profile?.fullName,
      studentId: profile?._id?.toString(),   // IStudentProfile uses _id, not studentId
      branch: profile?.branch,
      batch: profile?.batch,
      phone: profile?.phone,
      linkedinUrl: profile?.linkedinUrl,
      githubUrl: profile?.githubUrl,
      xpTotal: profile?.xpTotal,
      rank: null,                             // rank is leaderboard-derived, not stored on profile
      currentStreakDays: profile?.currentStreakDays,
      solved: null,                           // solved count is in progress, not profile
      targetCategories: profile?.targetCategories,
      onboardingComplete: profile?.onboardingComplete ?? false,
      placementStatus: profile?.placementStatus,
      avatarUrl: profile?.avatarUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
