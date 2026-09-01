/**
 * dashboard/student-portal/app/api/companies/route.ts
 * GET /api/companies — list all companies with optional filter.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { featureFlagService } from 'placeprep-backend/src/services/featureFlag.service';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { companyRepository } from 'placeprep-backend/src/repositories/company.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await featureFlagService.assertEnabled('student.companies');
    await requireStudent(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    let companies;
    if (search) {
      companies = await companyRepository.search(search);
    } else {
      companies = await companyRepository.findAll({ category });
    }

    return successResponse(companies);
  } catch (error) {
    return handleApiError(error);
  }
}
