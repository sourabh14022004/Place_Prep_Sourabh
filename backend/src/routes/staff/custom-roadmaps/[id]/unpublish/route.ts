/**
 * backend/src/routes/staff/custom-roadmaps/[id]/unpublish/route.ts
 * GET  /api/staff/custom-roadmaps/:id/unpublish — impact preview before deciding
 * POST /api/staff/custom-roadmaps/:id/unpublish — { mode: 'retire' | 'remove' }
 *
 * Two-step by design. Followers are linked live, so pulling a roadmap can strand
 * students mid-prep. GET reports how many would be affected; POST requires an
 * explicit mode so neither outcome can happen by accident:
 *
 *   retire — hidden from discovery, existing followers keep it and their progress
 *   remove — deleted for everyone, including current followers
 */

import { z } from 'zod';
import connectDB from '../../../../../config/db';
import { requireStaff } from '../../../../../utils/authMiddleware';
import { customRoadmapRepository } from '../../../../../repositories/customRoadmap.repository';
import { customRoadmapService } from '../../../../../services/customRoadmap.service';
import { successResponse } from '../../../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../../../utils/apiError';

const bodySchema = z.object({
  mode: z.enum(['retire', 'remove']),
});

export async function GET(
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

    // Counted live rather than read off followerCount, since this number is
    // what the confirmation dialog shows before a destructive choice.
    const followerCount = await customRoadmapRepository.countFollowers(id);

    return successResponse({
      title: roadmap.title,
      status: roadmap.status,
      followerCount,
      options: {
        retire: {
          label: 'Hide from new students',
          effect:
            followerCount > 0
              ? `${followerCount} current follower(s) keep this roadmap and their progress. It stops appearing for everyone else.`
              : 'It stops appearing for students. Nobody is currently following it.',
        },
        remove: {
          label: 'Delete for everyone',
          effect:
            followerCount > 0
              ? `Permanently deletes the roadmap and removes it from ${followerCount} student(s) who are following it. Their solved questions stay credited, but this plan disappears.`
              : 'Permanently deletes the roadmap. Nobody is currently following it.',
          destructive: true,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

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

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw ApiError.badRequest(
        "Specify mode: 'retire' to hide from new students, or 'remove' to delete for everyone.",
        parsed.error.flatten().fieldErrors
      );
    }

    const { removedFollows } = await customRoadmapService.unpublish(id, parsed.data.mode);

    return successResponse(
      { mode: parsed.data.mode, removedFollows },
      {
        message:
          parsed.data.mode === 'retire'
            ? 'Roadmap hidden from new students. Existing followers keep it.'
            : `Roadmap deleted. Removed from ${removedFollows} student(s).`,
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
