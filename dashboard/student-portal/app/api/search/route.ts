/**
 * dashboard/student-portal/app/api/search/route.ts
 * GET /api/search?q= — MongoDB text search across companies + questions.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { companyRepository } from 'placeprep-backend/src/repositories/company.repository';
import { questionRepository } from 'placeprep-backend/src/repositories/question.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireStudent(request);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      throw ApiError.badRequest('Search query must be at least 2 characters.');
    }

    const [companies, questions] = await Promise.all([
      companyRepository.search(q),
      questionRepository.search(q),
    ]);

    return successResponse({
      companies: companies.slice(0, 4),
      questions: questions.slice(0, 4),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
