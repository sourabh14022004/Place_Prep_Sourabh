/**
 * dashboard/student-portal/app/api/practice/my-stats/route.ts
 * GET /api/practice/my-stats — PERSONAL practice analytics for the logged-in
 * student (the Progress page "Practice" tab).
 *
 * Everything is aggregated from the student's real QuestionCompletion history:
 *   - totals + per-difficulty counts
 *   - breakdown by question type (DSA / Aptitude / Core CS / HR / Design …)
 *   - last-30-day trend
 *   - 10 most recent completions (with question summary)
 */

import connectDB from '../../../config/db';
import { requireStudent } from '../../../utils/authMiddleware';
import { featureFlagService } from '../../../services/featureFlag.service';
import QuestionCompletion from '../../../models/QuestionCompletion';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';
import { isValidObjectId, toObjectId } from '../../../utils/objectid';

export async function GET(request: Request) {
  try {
    await connectDB();
    await featureFlagService.assertEnabled('student.practice');
    await featureFlagService.assertEnabled('student.progress');
    const auth = await requireStudent(request);
    const studentId = toObjectId(auth.userId);

    // DATA-INTEGRITY: exclude seeded demo completions — personal practice
    // analytics must reflect ONLY what this student actually solved.
    const baseMatch = { studentId, isSeeded: { $ne: true } };

    const [byDifficultyAgg, byTypeAgg, trendAgg, recent, totalSolved] = await Promise.all([
      QuestionCompletion.aggregate([
        { $match: baseMatch },
        { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
        { $unwind: '$question' },
        { $group: { _id: '$question.difficulty', count: { $sum: 1 } } },
      ]),
      QuestionCompletion.aggregate([
        { $match: baseMatch },
        { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
        { $unwind: '$question' },
        {
          $group: {
            _id: { $ifNull: ['$question.questionType', 'dsa'] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      QuestionCompletion.aggregate([
        {
          $match: {
            ...baseMatch,
            completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: 'Asia/Kolkata' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      QuestionCompletion.aggregate([
        { $match: baseMatch },
        { $sort: { completedAt: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'question',
          },
        },
        { $unwind: '$question' },
        {
          $project: {
            _id: 1,
            completedAt: 1,
            xpEarned: 1,
            difficulty: '$question.difficulty',
            questionType: { $ifNull: ['$question.questionType', 'dsa'] },
            summary: { $substrCP: [{ $ifNull: ['$question.problemSummary', ''] }, 0, 140] },
            companySlug: '$question.companySlug',
          },
        },
      ]),
      QuestionCompletion.countDocuments(baseMatch),
    ]);

    const byDifficulty: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
    byDifficultyAgg.forEach((d: { _id?: string; count: number }) => {
      if (d._id) byDifficulty[d._id] = d.count;
    });

    return successResponse({
      totalSolved,
      byDifficulty,
      easySolved: byDifficulty.Easy,
      mediumSolved: byDifficulty.Medium,
      hardSolved: byDifficulty.Hard,
      byQuestionType: byTypeAgg.map((t: { _id: string; count: number }) => ({
        type: t._id,
        count: t.count,
      })),
      trend: trendAgg.map((t: { _id: string; count: number }) => ({ date: t._id, count: t.count })),
      recent,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
