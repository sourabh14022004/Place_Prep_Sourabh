/**
 * backend/src/routes/staff/custom-roadmaps/[id]/publish/route.ts
 * POST /api/staff/custom-roadmaps/:id/publish — make a roadmap visible to students
 *
 * Also re-publishes a retired roadmap.
 */

import connectDB from '../../../../../config/db';
import { requireStaff } from '../../../../../utils/authMiddleware';
import { customRoadmapRepository } from '../../../../../repositories/customRoadmap.repository';
import { customRoadmapService } from '../../../../../services/customRoadmap.service';
import { successResponse } from '../../../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../../../utils/apiError';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStaff(request);
    const { id } = await params;

    const roadmap = await customRoadmapRepository.findById(id);
    if (!roadmap) throw ApiError.notFound('Roadmap');
    customRoadmapService.assertCanEdit(roadmap, user);

    // An empty roadmap would appear to students as a plan with nothing in it.
    const questionCount = roadmap.weeks.reduce((n, w) => n + w.questionIds.length, 0);
    if (questionCount === 0) {
      throw ApiError.badRequest('Add at least one question before publishing.');
    }
    const emptyWeek = roadmap.weeks.find((w) => w.questionIds.length === 0);
    if (emptyWeek) {
      throw ApiError.badRequest(
        `Week ${emptyWeek.weekNumber} ("${emptyWeek.label}") has no questions. Remove it or add questions before publishing.`
      );
    }

    const updated = await customRoadmapRepository.setStatus(id, 'published');

    return successResponse(
      { roadmap: { id, slug: updated?.slug, status: updated?.status } },
      { message: 'Roadmap published — students can now find and follow it.' }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
