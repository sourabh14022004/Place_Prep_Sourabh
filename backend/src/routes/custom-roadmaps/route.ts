/**
 * backend/src/routes/custom-roadmaps/route.ts
 * GET /api/custom-roadmaps — roadmaps a student can browse and follow
 *
 * Returns published roadmaps, plus any retired one this student already
 * follows: retiring hides a roadmap from discovery without pulling it out from
 * under people mid-prep, so their own list must keep showing it.
 */

import connectDB from '../../config/db';
import { requireStudent } from '../../utils/authMiddleware';
import { customRoadmapRepository } from '../../repositories/customRoadmap.repository';
import { customRoadmapService } from '../../services/customRoadmap.service';
import { successResponse } from '../../utils/apiResponse';
import { handleApiError } from '../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    const [published, follows] = await Promise.all([
      customRoadmapRepository.listPublished(),
      customRoadmapRepository.listFollowsByStudent(user.userId),
    ]);

    const followedIds = new Set(follows.map((f) => f.roadmapId.toString()));

    // Retired-but-followed roadmaps are not in the published list, so fetch
    // the ones this student still needs to see.
    const publishedIds = new Set(published.map((r) => r._id.toString()));
    const missing = follows
      .map((f) => f.roadmapId)
      .filter((id) => !publishedIds.has(id.toString()));
    const retiredFollowed = await customRoadmapRepository.findManyByIds(missing);

    const all = [...published, ...retiredFollowed];

    const roadmaps = await Promise.all(
      all.map(async (r) => {
        const isFollowing = followedIds.has(r._id.toString());
        // Progress only matters for roadmaps the student actually follows;
        // computing it for the whole catalogue would be a query per row.
        const progress = isFollowing
          ? await customRoadmapService.computeProgress(user.userId, r)
          : null;

        return {
          id: r._id.toString(),
          title: r.title,
          slug: r.slug,
          description: r.description ?? null,
          companySlugs: r.companySlugs,
          companyNames: r.companyNames,
          weekCount: r.weeks.length,
          questionCount: r.weeks.reduce((n, w) => n + w.questionIds.length, 0),
          followerCount: r.followerCount,
          createdByName: r.createdByName,
          isFollowing,
          // Signals the UI should show "no longer offered to new students".
          isRetired: r.status === 'retired',
          pctComplete: progress?.pctComplete ?? 0,
          doneQuestions: progress?.doneQuestions ?? 0,
        };
      })
    );

    // Followed first, then most recently published.
    roadmaps.sort((a, b) => Number(b.isFollowing) - Number(a.isFollowing));

    return successResponse({ roadmaps });
  } catch (error) {
    return handleApiError(error);
  }
}
