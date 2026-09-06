/**
 * dashboard/student-portal/app/api/leaderboard/route.ts
 * GET /api/leaderboard — XP leaderboard, optional batch filter.
 */

import connectDB from '../../config/db';
import { featureFlagService } from '../../services/featureFlag.service';
import { requireStudent } from '../../utils/authMiddleware';
import { studentService } from '../../services/student.service';
import { successResponse } from '../../utils/apiResponse';
import { handleApiError } from '../../utils/apiError';
import StudentProfile from '../../models/StudentProfile';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    await featureFlagService.assertEnabled('student.leaderboard');
    const auth = await requireStudent(request);
    const { searchParams } = new URL(request.url);
    const batch = searchParams.get('batch') || undefined;
    const search = searchParams.get('search') || undefined;
    // The client sends 'alltime' | 'monthly' | 'weekly', but studentService
    // matches on 'this-week' | 'this-month'. The period was also never passed
    // through, so every request fell into the unfiltered branch and "Monthly"
    // returned byte-identical all-time data. Normalize, then forward it.
    const rawPeriod = searchParams.get('period') || 'alltime';
    const servicePeriod =
      rawPeriod === 'monthly' || rawPeriod === 'this-month' ? 'this-month'
      : rawPeriod === 'weekly' || rawPeriod === 'this-week' ? 'this-week'
      : undefined;

    const leaderboard = await studentService.getLeaderboard(batch, servicePeriod, search);
    type Entry = ReturnType<typeof studentService.getLeaderboard> extends Promise<(infer T)[]> ? T : never;
    const withCurrentUser: (Entry & { isCurrentUser?: boolean })[] = leaderboard.map((entry) => ({
      ...(entry as unknown as Entry),
      isCurrentUser: entry.studentId === auth.userId,
    } as Entry & { isCurrentUser?: boolean }));

    // If current user is not in the top 100, append their entry.
    // All-time: real rank via countDocuments. Window: honest "100+" placeholder
    // (computing a true window rank would need another full aggregation — not
    // worth the cost for a badge; the UI shows "100+" instead of a fake number).
    if (!withCurrentUser.some(entry => entry.isCurrentUser)) {
      const currentUserProfile = await StudentProfile.findOne({ userId: auth.userId });

      if (currentUserProfile) {
        let rank: number | string = '100+';
        if (!servicePeriod) {
          const filter: any = { xpTotal: { $gt: currentUserProfile.xpTotal || 0 } };
          if (batch) filter.batch = batch;
          rank = await StudentProfile.countDocuments(filter) + 1;
        }

        const nameParts = (currentUserProfile.fullName || '').trim().split(' ');
        const initials = nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : (currentUserProfile.fullName?.slice(0, 2) ?? 'ST').toUpperCase();

        withCurrentUser.push({
          rank,
          studentId: currentUserProfile.userId.toString(),
          name: currentUserProfile.fullName,
          initials,
          batch: currentUserProfile.batch,
          branch: currentUserProfile.branch,
          xp: currentUserProfile.xpTotal ?? 0,
          windowScore: null,
          lastActivity: currentUserProfile.lastActiveAt?.toISOString?.() ?? null,
          // BUG-11 FIX: tasksCompleted and doubtsRaised from real data on StudentProfile
          tasksCompleted: currentUserProfile.questionsCompletedCount ?? 0,
          doubtsRaised: currentUserProfile.doubtsRaisedCount ?? 0,
          placementStatus: currentUserProfile.placementStatus,
          isCurrentUser: true
        });
      }
    }


    return successResponse(withCurrentUser);
  } catch (error) {
    return handleApiError(error);
  }
}
