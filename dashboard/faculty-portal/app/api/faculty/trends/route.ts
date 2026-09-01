/**
 * dashboard/faculty-portal/app/api/faculty/trends/route.ts
 * GET /api/faculty/trends — aggregated trends data for the faculty dashboard.
 * Returns company alignment data, session stats, and hiring trends.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { featureFlagService } from 'placeprep-backend/src/services/featureFlag.service';
import { requireFaculty } from 'placeprep-backend/src/utils/authMiddleware';
import { sessionService } from 'placeprep-backend/src/services/session.service';
import { facultyRepository } from 'placeprep-backend/src/repositories/faculty.repository';
import { facultyService } from 'placeprep-backend/src/services/faculty.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
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
