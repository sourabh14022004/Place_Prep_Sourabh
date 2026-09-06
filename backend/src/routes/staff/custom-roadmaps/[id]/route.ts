/**
 * backend/src/routes/staff/custom-roadmaps/[id]/route.ts
 * GET   /api/staff/custom-roadmaps/:id — full roadmap with hydrated questions
 * PATCH /api/staff/custom-roadmaps/:id — update title, description or weeks
 */

import { z } from 'zod';
import connectDB from '../../../../config/db';
import { requireStaff } from '../../../../utils/authMiddleware';
import { customRoadmapRepository } from '../../../../repositories/customRoadmap.repository';
import { customRoadmapService } from '../../../../services/customRoadmap.service';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../../utils/apiError';

const weekSchema = z.object({
  weekNumber: z.number().int().min(1),
  label: z.string().trim().min(1, 'Week label is required').max(120),
  questionIds: z.array(z.string()).default([]),
});

const patchSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  weeks: z.array(weekSchema).optional(),
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
    // Faculty may only open their own; admins may open any.
    customRoadmapService.assertCanEdit(roadmap, user);

    return successResponse({
      roadmap: {
        id: roadmap._id.toString(),
        title: roadmap.title,
        slug: roadmap.slug,
        description: roadmap.description ?? null,
        status: roadmap.status,
        companySlugs: roadmap.companySlugs,
        companyNames: roadmap.companyNames,
        followerCount: roadmap.followerCount,
        createdByName: roadmap.createdByName,
        publishedAt: roadmap.publishedAt ?? null,
        weeks: await customRoadmapService.hydrateWeeks(roadmap),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
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

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw ApiError.badRequest('Invalid input.', parsed.error.flatten().fieldErrors);
    }
    const { title, description, weeks } = parsed.data;

    const patch: Record<string, unknown> = {};
    if (title !== undefined) {
      patch.title = title;
      // Only re-slug when the title actually changed: a published roadmap's
      // URL is something students may have open, so it should not churn.
      if (title !== roadmap.title) {
        patch.slug = await customRoadmapService.generateSlug(title, id);
      }
    }
    if (description !== undefined) patch.description = description;

    if (weeks !== undefined) {
      const resolved = await customRoadmapService.resolveQuestions(weeks);
      patch.weeks = resolved.weeks;
      patch.companySlugs = resolved.companySlugs;
      patch.companyNames = resolved.companyNames;
    }

    const updated = await customRoadmapRepository.update(id, patch);

    return successResponse(
      { roadmap: { id, slug: updated?.slug, status: updated?.status } },
      {
        message:
          roadmap.status === 'published' && roadmap.followerCount > 0
            ? `Saved. ${roadmap.followerCount} student(s) following this roadmap see the change immediately.`
            : 'Saved.',
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
