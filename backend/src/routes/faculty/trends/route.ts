/**
 * dashboard/faculty-portal/app/api/faculty/trends/route.ts
 * GET /api/faculty/trends — aggregated trends data for the faculty dashboard.
 * Returns company alignment data, session stats, and hiring trends.
 */

import connectDB from '../../../config/db';
import { featureFlagService } from '../../../services/featureFlag.service';
import { requireFaculty } from '../../../utils/authMiddleware';
import { sessionService } from '../../../services/session.service';
import { facultyRepository } from '../../../repositories/faculty.repository';
import { facultyService } from '../../../services/faculty.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
  await featureFlagService.assertEnabled('faculty.trends');
    const user = await requireFaculty(request);

    // Fetch faculty profile (includes session accept/decline counts)
    const profile = await facultyRepository.findByUserId(user.userId);

    // Fetch faculty sessions for aggregation
    const sessions = await sessionService.getFacultySessions(user.userId);

    const totalSessions = sessions.length;
    const confirmedSessions = sessions.filter((s: any) => s.status === 'confirmed').length;
    const pendingSessions = sessions.filter((s: any) => s.status === 'pending').length;
    const completedSessions = sessions.filter((s: any) => s.status === 'completed').length;

    // Aggregate unique students
    const uniqueStudents = new Set(sessions.map((s: any) => s.studentId?.toString())).size;

    // Session activity over last 7 days
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentSessions = sessions.filter((s: any) => {
      const d = s.createdAt ? new Date(s.createdAt).getTime() : 0;
      return d > weekAgo;
    });

    // Fetch dynamic industry trends
    const industryTrends = await facultyService.getIndustryTrends();

    return successResponse({
      sessionStats: {
        total: totalSessions,
        confirmed: confirmedSessions,
        pending: pendingSessions,
        completed: completedSessions,
        acceptRate: profile?.acceptCount
          ? Math.round((profile.acceptCount / (profile.acceptCount + (profile.declineCount ?? 0))) * 100)
          : 0,
      },
      studentReach: uniqueStudents,
      weeklyActivity: recentSessions.length,
      profileStats: {
        totalAccepted: profile?.acceptCount ?? 0,
        totalDeclined: profile?.declineCount ?? 0,
        subject: profile?.subject ?? '',
      },
      industryTrends,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
