/**
 * GET /api/user/stats
 * Returns aggregated stats for the logged-in student:
 * - totalXP, questionsCompleted, sessionsCompleted, doubtsRaised, currentStreak, longestStreak
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAuth } from 'placeprep-backend/src/utils/authMiddleware';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';
import StudentProfile from 'placeprep-backend/src/models/StudentProfile';
import QuestionCompletion from 'placeprep-backend/src/models/QuestionCompletion';
import SessionBooking from 'placeprep-backend/src/models/SessionBooking';
import DoubtThread from 'placeprep-backend/src/models/DoubtThread';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireAuth(req);

    const [profile, questionsCompleted, sessionsDone, doubtsRaised] = await Promise.all([
      StudentProfile.findOne({ userId: auth.userId }).select(
        'xpTotal currentStreakDays longestStreakDays placementStatus targetCompanySlugs'
      ),
      QuestionCompletion.countDocuments({ studentId: auth.userId }),
      SessionBooking.countDocuments({ studentId: auth.userId, status: 'confirmed' }),
      DoubtThread.countDocuments({ studentId: auth.userId }),
    ]);

    if (!profile) return handleApiError(new ApiError('Profile not found', 404, 'NOT_FOUND'));

    return NextResponse.json(successResponse({
      stats: {
        totalXP: profile.xpTotal ?? 0,
        questionsCompleted,
        sessionsCompleted: sessionsDone,
        doubtsRaised,
        currentStreak: profile.currentStreakDays ?? 0,
        longestStreak: profile.bestStreakDays ?? profile.currentStreakDays ?? 0,
        placementStatus: profile.placementStatus,
        targetCompanySlugs: profile.targetCompanySlugs ?? [],
      },
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
