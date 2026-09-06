/**
 * dashboard/student-portal/app/api/search/route.ts
 * GET /api/search?q= — MongoDB text search across companies + questions.
 */

import connectDB from '../../config/db';
import { requireStudent } from '../../utils/authMiddleware';
import { companyRepository } from '../../repositories/company.repository';
import { questionRepository } from '../../repositories/question.repository';
import { successResponse } from '../../utils/apiResponse';
import { handleApiError, ApiError } from '../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
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
