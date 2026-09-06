/**
 * backend/src/routes/custom-roadmaps/[slug]/follow/route.ts
 * POST   /api/custom-roadmaps/:slug/follow — start following
 * DELETE /api/custom-roadmaps/:slug/follow — stop following
 *
 * Unfollowing removes the link only. QuestionCompletion records are left
 * untouched, so a student who re-follows later picks up exactly where they
 * were, and questions solved here still count towards XP and streaks.
 */

import connectDB from '../../../../config/db';
import { requireStudent } from '../../../../utils/authMiddleware';
import { customRoadmapRepository } from '../../../../repositories/customRoadmap.repository';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../../utils/apiError';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const { slug } = await params;

    const roadmap = await customRoadmapRepository.findBySlug(slug);
    if (!roadmap) throw ApiError.notFound('Roadmap');

    // Only a published roadmap can gain new followers; retired ones are
    // readable by existing followers but closed to new ones.
    if (roadmap.status !== 'published') {
      throw ApiError.badRequest('This roadmap is not available to follow.');
    }

    await customRoadmapRepository.follow(user.userId, roadmap._id.toString());
    const followerCount = await customRoadmapRepository.syncFollowerCount(
      roadmap._id.toString()
    );

    return successResponse(
      { isFollowing: true, followerCount },
      { message: `You're now following "${roadmap.title}".` }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const { slug } = await params;

    const roadmap = await customRoadmapRepository.findBySlug(slug);
    if (!roadmap) throw ApiError.notFound('Roadmap');

    await customRoadmapRepository.unfollow(user.userId, roadmap._id.toString());
    const followerCount = await customRoadmapRepository.syncFollowerCount(
      roadmap._id.toString()
    );

    return successResponse(
      { isFollowing: false, followerCount },
      { message: 'Stopped following. Your solved questions are still credited.' }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
