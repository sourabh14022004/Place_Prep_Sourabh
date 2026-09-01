/**
 * dashboard/admin-portal/app/api/admin/analytics/route.ts
 * GET /api/admin/analytics — curriculum gap, topic frequency, placement funnel.
 *
 * Uses aggregation pipelines — kept in this route since these are read-only analytical
 * queries with no business logic. For V2, move to an analytics.service.ts.
 *
 * PERFORMANCE: Cache-Control: private, max-age=300 instructs the browser to cache
 * analytics responses for 5 minutes. This avoids hammering MongoDB on every
 * 30-second SWR refresh while remaining safe for serverless deployments.
 * Note: module-level globals (e.g. `let analyticsCache`) are unreliable in
 * serverless environments because each cold-start begins with a fresh module scope.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';
import { checkRateLimit, getClientIp, RATE_LIMITS } from 'placeprep-backend/src/utils/rateLimiter';
import StudentProfile from 'placeprep-backend/src/models/StudentProfile';
import QuestionCompletion from 'placeprep-backend/src/models/QuestionCompletion';
import InterviewExperience from 'placeprep-backend/src/models/InterviewExperience';
import DoubtThread from 'placeprep-backend/src/models/DoubtThread';

// Route-segment cache: Next.js will cache this route's response for 5 minutes.
// This is the idiomatic Next.js approach and works correctly in serverless deployments.
export const revalidate = 300;

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Rate limit: prevent analytics route from being hammered
  const ip = getClientIp(request);
  const rl = checkRateLimit(`analytics:${ip}`, RATE_LIMITS.API);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
      { status: 429 }
    );
  }

  try {
    await connectDB();
    await requireAdmin(request);

    const [
      placementFunnel,
      topTopics,
      batchActivity,
      outcomeBreakdown,
      doubtTagFrequency,
    ] = await Promise.all([
      // Placement status breakdown
      StudentProfile.aggregate([
        { $group: { _id: '$placementStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Top 10 most practiced topics
      QuestionCompletion.aggregate([
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'question',
          },
        },
        { $unwind: '$question' },
        { $unwind: '$question.topics' },
        { $group: { _id: '$question.topics', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // XP by batch — engagement comparison
      StudentProfile.aggregate([
        {
          $group: {
            _id: '$batch',
            avgXp: { $avg: '$xpTotal' },
            totalStudents: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
      ]),

      // Interview outcome distribution (verified only)
      InterviewExperience.aggregate([
        { $match: { isVerified: true } },
        { $group: { _id: '$outcome', count: { $sum: 1 } } },
      ]),

      // Doubt tag frequency
      DoubtThread.aggregate([
        { $group: { _id: '$tag', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const responseData = {
      placementFunnel: placementFunnel.map((p: { _id: string; count: number }) => ({
        status: p._id,
        count: p.count,
      })),
      topTopics: topTopics.map((t: { _id: string; count: number }) => ({
        topic: t._id,
        count: t.count,
      })),
      batchActivity: batchActivity.map(
        (b: { _id: string; avgXp: number; totalStudents: number }) => ({
          batch: b._id,
          avgXp: Math.round(b.avgXp),
          totalStudents: b.totalStudents,
        })
      ),
      outcomeBreakdown: outcomeBreakdown.map((o: { _id: string; count: number }) => ({
        outcome: o._id,
        count: o.count,
      })),
      doubtTagFrequency: doubtTagFrequency.map((d: { _id: string; count: number }) => ({
        tag: d._id,
        count: d.count,
      })),
    };

    return NextResponse.json(
      { success: true, data: responseData },
      {
        headers: {
          // 5-minute browser cache — prevents hammering MongoDB on SWR refreshes
          'Cache-Control': 'private, max-age=300',
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
