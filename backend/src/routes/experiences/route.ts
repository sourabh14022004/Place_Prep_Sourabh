/**
 * dashboard/student-portal/app/api/experiences/route.ts
 * GET  /api/experiences — browse verified experiences + own unverified submissions
 * POST /api/experiences — submit a new experience
 *
 * BUG-FIX E1 (GET): own unverified submissions are now included so the student
 * always sees their own entry (before and after admin verification).
 * BUG-FIX E1 (POST): response includes xpAwarded so the frontend can show a
 * dynamic amount instead of a hardcoded "+50 XP".
 */

import connectDB from '../../config/db';
import { checkRateLimit, RATE_LIMITS } from '../../utils/rateLimiter';
import { featureFlagService } from '../../services/featureFlag.service';
import { requireStudent } from '../../utils/authMiddleware';
import { experienceRepository } from '../../repositories/experience.repository';
import { companyRepository } from '../../repositories/company.repository';
import { studentRepository } from '../../repositories/student.repository';
import { submitExperienceSchema } from '../../validators/experience.validator';
import { successResponse } from '../../utils/apiResponse';
import { handleApiError, ApiError } from '../../utils/apiError';
import { isValidObjectId, toObjectId } from '../../utils/objectid';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();

    await featureFlagService.assertEnabled('student.experience');
    const user = await requireStudent(request);

    // Write throttle — protects against spam/XP-farming
    const rl = checkRateLimit(`write:${user.userId}`, RATE_LIMITS.WRITE);
    if (!rl.allowed) {
      return Response.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' } },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companySlug = searchParams.get('company') || undefined;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 20);

    // Public verified feed
    const { experiences: publicFeed, total: publicTotal } = await experienceRepository.findAll({
      companySlug,
      verified: true,
      page: 1,         // fetch full first page for deduplication
      limit: limit + 20, // fetch a bit more to account for deduplication
    });

    // BUG-FIX E1: fetch own submissions (verified or not) so the student always sees their own
    const ownExperiences = await experienceRepository.findByStudentId(user.userId);

    // Merge: own first, then public — dedupe by _id (own takes precedence)
    const ownIds = new Set(ownExperiences.map((e: any) => String(e._id)));
    const deduped = [
      ...ownExperiences,
      ...publicFeed.filter((e: any) => !ownIds.has(String(e._id))),
    ];

    // Apply pagination to the merged list
    const total = publicTotal + ownExperiences.filter((e: any) => !e.isVerified).length;
    const start = (page - 1) * limit;
    const experiences = deduped.slice(start, start + limit);

    return successResponse(experiences, { meta: { page, limit, total } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    const body = await request.json();
    const validation = submitExperienceSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest('Invalid experience data.', validation.error.flatten().fieldErrors);
    }

    const company = await companyRepository.findBySlug(validation.data.companySlug);
    if (!company) throw ApiError.notFound('Company');

    const profile = await studentRepository.findByUserId(user.userId);

    const experience = await experienceRepository.create({
      studentId: toObjectId(user.userId),
      studentName: profile?.fullName || user.email,
      companyId: company._id,
      companySlug: company.slug,
      companyName: company.name,
      role: validation.data.role,
      interviewDate: new Date(validation.data.interviewDate),
      outcome: validation.data.outcome,
      overallDifficulty: validation.data.overallDifficulty,
      roundsCount: validation.data.roundsCount,
      rounds: validation.data.rounds,
      experienceText: validation.data.experienceText,
      tips: validation.data.tips,
      isVerified: false,
      source: 'nst_internal',
    });

    const XP_AWARDED = 50;
    // BUG-EX1 FIX: Award XP for submitting an experience
    try {
      await studentRepository.addXp(user.userId, XP_AWARDED);
    } catch {
      // Don't fail the request if XP award fails — experience was already created
    }

    // BUG-FIX E1: include xpAwarded in response so frontend can show real amount
    return Response.json(
      {
        success: true,
        data: { ...(experience as any).toObject?.() ?? experience, xpAwarded: XP_AWARDED },
        message: `Experience submitted! +${XP_AWARDED} XP awarded. It will appear after admin verification.`,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
