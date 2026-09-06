/**
 * backend/src/routes/custom-roadmaps/[slug]/route.ts
 * GET /api/custom-roadmaps/:slug — one roadmap, its weeks, and this student's progress
 */

import connectDB from '../../../config/db';
import { requireStudent } from '../../../utils/authMiddleware';
import { customRoadmapRepository } from '../../../repositories/customRoadmap.repository';
import { customRoadmapService } from '../../../services/customRoadmap.service';
import QuestionCompletion from '../../../models/QuestionCompletion';
import mongoose from 'mongoose';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../utils/apiError';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const { slug } = await params;

    const roadmap = await customRoadmapRepository.findBySlug(slug);
    if (!roadmap) throw ApiError.notFound('Roadmap');

    const isFollowing = await customRoadmapRepository.isFollowing(
      user.userId,
      roadmap._id.toString()
    );

    // Drafts are never student-visible. A retired roadmap stays open to the
    // students already following it, but not to anyone else.
    if (roadmap.status === 'draft' || (roadmap.status === 'retired' && !isFollowing)) {
      throw ApiError.notFound('Roadmap');
    }

    const [weeks, progress] = await Promise.all([
      customRoadmapService.hydrateWeeks(roadmap),
      customRoadmapService.computeProgress(user.userId, roadmap),
    ]);

    // Which specific questions are done, so the UI can tick them individually
    // rather than only showing a per-week count.
    const allIds = roadmap.weeks.flatMap((w) => w.questionIds);
    const completions = await QuestionCompletion.find({
      studentId: new mongoose.Types.ObjectId(user.userId),
      questionId: { $in: allIds },
    })
      .select('questionId')
      .lean();
    const doneIds = completions.map((c) => c.questionId.toString());

    return successResponse({
      roadmap: {
        id: roadmap._id.toString(),
        title: roadmap.title,
        slug: roadmap.slug,
        description: roadmap.description ?? null,
        companySlugs: roadmap.companySlugs,
        companyNames: roadmap.companyNames,
        createdByName: roadmap.createdByName,
        followerCount: roadmap.followerCount,
        isFollowing,
        isRetired: roadmap.status === 'retired',
        weeks: weeks.map((w) => ({
          ...w,
          questions: w.questions.map((q) => ({
            id: q._id.toString(),
            title: q.problemSummary,
            difficulty: q.difficulty,
            topics: q.topics ?? [],
            questionType: q.questionType,
            isMcq: q.isMcq ?? false,
            companyName: q.companyName ?? null,
            // No company means it came from the external/generic pool.
            isExternal: !q.companySlug,
            practiceUrl: q.leetcodeUrl || q.sourceUrl || null,
            xp: q.xpValue,
          })),
        })),
        progress,
        completedQuestionIds: doneIds,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
