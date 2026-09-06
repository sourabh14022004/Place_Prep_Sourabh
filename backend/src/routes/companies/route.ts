/**
 * dashboard/student-portal/app/api/companies/route.ts
 * GET /api/companies — list all companies with optional filter.
 */

import connectDB from '../../config/db';
import { featureFlagService } from '../../services/featureFlag.service';
import { requireStudent } from '../../utils/authMiddleware';
import { companyRepository } from '../../repositories/company.repository';
import { successResponse } from '../../utils/apiResponse';
import { handleApiError } from '../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
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
