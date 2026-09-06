/**
 * backend/src/routes/staff/custom-roadmaps/route.ts
 * GET  /api/staff/custom-roadmaps — list roadmaps this user may manage
 * POST /api/staff/custom-roadmaps — create a new draft
 *
 * Under /api/staff because both faculty and admin author these; the middleware
 * admits either role to that prefix.
 */

import { z } from 'zod';
import connectDB from '../../../config/db';
import { requireStaff } from '../../../utils/authMiddleware';
import { customRoadmapRepository } from '../../../repositories/customRoadmap.repository';
import { customRoadmapService } from '../../../services/customRoadmap.service';
import { userRepository } from '../../../repositories/user.repository';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../utils/apiError';

const weekSchema = z.object({
  weekNumber: z.number().int().min(1),
  label: z.string().trim().min(1, 'Week label is required').max(120),
  questionIds: z.array(z.string()).default([]),
});

const createSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  description: z.string().trim().max(2000).optional(),
  weeks: z.array(weekSchema).default([]),
});

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStaff(request);

    // Admins moderate everything; faculty see only what they authored.
    const roadmaps =
      user.role === 'admin'
        ? await customRoadmapRepository.listAll()
        : await customRoadmapRepository.listByCreator(user.userId);

    return successResponse({
      roadmaps: roadmaps.map((r) => ({
        id: r._id.toString(),
        title: r.title,
        slug: r.slug,
        description: r.description ?? null,
        status: r.status,
        companySlugs: r.companySlugs,
        companyNames: r.companyNames,
        weekCount: r.weeks.length,
        questionCount: r.weeks.reduce((n, w) => n + w.questionIds.length, 0),
        followerCount: r.followerCount,
        createdByName: r.createdByName,
        isMine: r.createdBy.toString() === user.userId,
        publishedAt: r.publishedAt ?? null,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStaff(request);

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw ApiError.badRequest('Invalid input.', parsed.error.flatten().fieldErrors);
    }
    const { title, description, weeks } = parsed.data;

    // Company list is derived from the questions, never trusted from the
    // client, so a roadmap cannot advertise a company it has no questions for.
    const resolved = await customRoadmapService.resolveQuestions(weeks);

    const author = await userRepository.findById(user.userId);
    if (!author) throw ApiError.unauthorized('Your account could not be found.');

    const roadmap = await customRoadmapRepository.create({
      title,
      slug: await customRoadmapService.generateSlug(title),
      description,
      createdBy: author._id,
      createdByRole: user.role as 'faculty' | 'admin',
      createdByName: await customRoadmapService.resolveAuthorName(
        user.userId,
        user.role,
        author.email
      ),
      status: 'draft',
      weeks: resolved.weeks,
      companySlugs: resolved.companySlugs,
      companyNames: resolved.companyNames,
    });

    return successResponse(
      { roadmap: { id: roadmap._id.toString(), slug: roadmap.slug, status: roadmap.status } },
      { message: 'Draft roadmap created.', status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
