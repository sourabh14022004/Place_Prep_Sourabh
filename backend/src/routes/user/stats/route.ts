/**
 * GET /api/user/stats
 * Returns aggregated stats for the logged-in student:
 * - totalXP, questionsCompleted, sessionsCompleted, doubtsRaised, currentStreak, longestStreak
 */
import connectDB from '../../../config/db';
import { requireAuth } from '../../../utils/authMiddleware';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../utils/apiError';
import StudentProfile from '../../../models/StudentProfile';
import QuestionCompletion from '../../../models/QuestionCompletion';
import SessionBooking from '../../../models/SessionBooking';
import DoubtThread from '../../../models/DoubtThread';

export async function GET(req: Request) {
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

    return Response.json(successResponse({
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
