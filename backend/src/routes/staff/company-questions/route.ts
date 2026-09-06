/**
 * backend/src/routes/staff/company-questions/route.ts
 * GET /api/staff/company-questions?companies=google,amazon&...
 *
 * Step 2 of building a custom roadmap: after picking companies, show the
 * questions available for them so faculty can take all or cherry-pick.
 *
 * Query params:
 *   companies  comma-separated slugs (required)
 *   topic      filter by topic
 *   difficulty Easy | Medium | Hard
 *   search     substring match on the problem summary
 *   limit      default 100, max 500
 */

import connectDB from '../../../config/db';
import { requireStaff } from '../../../utils/authMiddleware';
import Question from '../../../models/Question';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    await requireStaff(request);

    const { searchParams } = new URL(request.url);
    const companies = (searchParams.get('companies') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (companies.length === 0) {
      throw ApiError.badRequest('Select at least one company.');
    }

    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);

    const query: Record<string, unknown> = { companySlug: { $in: companies } };
    if (topic) query.topics = topic;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      // Escaped so a stray '(' in a search box cannot throw a regex error.
      query.problemSummary = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    const questions = await Question.find(query)
      .select(
        '_id problemSummary difficulty topics questionType isMcq roundType ' +
        'companySlug companyName leetcodeUrl sourceUrl frequencyScore xpValue'
      )
      .sort({ frequencyScore: -1 })
      .limit(limit)
      .lean();

    // Per-company totals let the UI show "showing 100 of 812" rather than
    // implying the list is everything available.
    const totals = await Question.aggregate([
      { $match: { companySlug: { $in: companies } } },
      { $group: { _id: '$companySlug', count: { $sum: 1 } } },
    ]);

    return successResponse({
      questions: questions.map((q) => ({
        id: q._id.toString(),
        title: q.problemSummary,
        difficulty: q.difficulty,
        topics: q.topics ?? [],
        questionType: q.questionType,
        isMcq: q.isMcq ?? false,
        roundType: q.roundType,
        companySlug: q.companySlug ?? null,
        companyName: q.companyName ?? null,
        practiceUrl: q.leetcodeUrl || q.sourceUrl || null,
        frequency: q.frequencyScore != null ? Math.round(q.frequencyScore * 100) : null,
      })),
      returned: questions.length,
      totalsByCompany: Object.fromEntries(totals.map((t) => [t._id, t.count])),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
