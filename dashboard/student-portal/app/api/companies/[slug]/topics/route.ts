/**
 * dashboard/student-portal/app/api/companies/[slug]/topics/route.ts
 * GET /api/companies/[slug]/topics?role=<roleName>
 * Returns role-specific topic list for the onboarding step-3 self-rating UI.
 * Falls back to company's flat topicFrequency when no role-specific data exists.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { companyRepository } from 'placeprep-backend/src/repositories/company.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
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
