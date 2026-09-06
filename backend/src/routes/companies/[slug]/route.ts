/**
 * dashboard/student-portal/app/api/companies/[slug]/route.ts
 * GET /api/companies/[slug] — full company profile.
 *
 * FIXES:
 *   BUG-C1: Increased question limit from 10 to 50
 *   BUG-C7: Show unverified experiences with isVerified flag (admin verification wall removed)
 */

import connectDB from '../../../config/db';
import { requireStudent } from '../../../utils/authMiddleware';
import { companyRepository } from '../../../repositories/company.repository';
import { questionRepository } from '../../../repositories/question.repository';
import { experienceRepository } from '../../../repositories/experience.repository';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../utils/apiError';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  try {
    await connectDB();
    await requireStudent(request);

    const { slug } = await params;
    const company = await companyRepository.findBySlug(slug);
    if (!company) throw ApiError.notFound('Company');

    // BUG-C1 FIX: was hardcoded to 10, increased to 50
    // BUG-C7 FIX: removed verified:true filter — experiences were always empty because
    //   admin never verifies them. Now returns all experiences with isVerified flag
    //   so frontend can show "Pending Verification" badge on unverified ones.
    const [{ questions }, { experiences }] = await Promise.all([
      questionRepository.findMany({ companySlug: slug, limit: 50 }),
      experienceRepository.findAll({ companySlug: slug, limit: 10 }),
    ]);

    return successResponse({ ...company, questions, experiences });
  } catch (error) {
    return handleApiError(error);
  }
}
