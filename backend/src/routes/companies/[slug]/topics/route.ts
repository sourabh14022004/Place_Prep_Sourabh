/**
 * dashboard/student-portal/app/api/companies/[slug]/topics/route.ts
 * GET /api/companies/[slug]/topics?role=<roleName>
 * Returns role-specific topic list for the onboarding step-3 self-rating UI.
 * Falls back to company's flat topicFrequency when no role-specific data exists.
 */

import connectDB from '../../../../config/db';
import { requireStudent } from '../../../../utils/authMiddleware';
import { companyRepository } from '../../../../repositories/company.repository';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../../utils/apiError';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  try {
    await connectDB();
    await requireStudent(request);

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') ?? 'SDE-1';

    const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!safeSlug) throw ApiError.badRequest('Invalid company slug');

    const topics = await companyRepository.findRoleTopics(safeSlug, role);
    return successResponse(topics);
  } catch (error) {
    return handleApiError(error);
  }
}
