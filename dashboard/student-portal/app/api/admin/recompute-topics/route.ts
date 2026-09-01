/**
 * dashboard/student-portal/app/api/admin/recompute-topics/route.ts
 * POST /api/admin/recompute-topics
 *
 * BUG-M8 FIX: Company.topicFrequency.questionCount is set at seed time and
 * never recomputed as new questions are added to the DB. This admin-only
 * endpoint recomputes real question counts per topic per company using a
 * MongoDB aggregation and writes them back.
 *
 * Call this: curl -X POST /api/admin/recompute-topics (admin cookie required)
 *
 * NOTE: Only requires requireAdmin (re-uses the pattern from other admin routes).
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';
import Company from 'placeprep-backend/src/models/Company';
import Question from 'placeprep-backend/src/models/Question';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);

    // Step 1: For each company, count questions per topic via aggregation
    const companySlugs: string[] = await (Company as any).distinct('slug');
    let updatedCount = 0;

    for (const slug of companySlugs) {
      // Aggregate: { topic -> count } for this company's questions
      const topicCounts: { _id: string; count: number }[] = await (Question as any).aggregate([
        { $match: { companySlug: slug } },
        { $unwind: '$topics' },
        { $group: { _id: '$topics', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }, // top 20 topics per company
      ]);

      if (topicCounts.length === 0) continue;

      const totalQuestions = topicCounts.reduce((s, t) => s + t.count, 0);

      // Build updated topicFrequency array
      const updatedTopicFrequency = topicCounts.map((t) => ({
        topicName: t._id,
        topicSlug: t._id.toLowerCase().replace(/\s+/g, '-'),
        questionCount: t.count,
        frequencyPct: totalQuestions > 0 ? Math.round((t.count / totalQuestions) * 100) : 0,
      }));

      // Write back to Company document
      await Company.findOneAndUpdate(
        { slug },
        {
          $set: {
            topicFrequency: updatedTopicFrequency,
            totalQuestions,
          },
        }
      );

      updatedCount++;
    }

    return successResponse({
      message: `Recomputed topicFrequency for ${updatedCount} companies`,
      updatedCount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
