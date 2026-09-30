/**
 * dashboard/student-portal/app/api/questions/route.ts
 * GET /api/questions — paginated questions with multi-filter.
 */

import connectDB from '../../config/db';
import { requireStudent } from '../../utils/authMiddleware';
import { questionRepository } from '../../repositories/question.repository';
import { successResponse } from '../../utils/apiResponse';
import { handleApiError } from '../../utils/apiError';
import { rateLimit } from '../../utils/rateLimit';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    // BUG-S1 FIX: Rate limit — 30 requests per 60s per user
    const rl = rateLimit(user.userId, 'questions', 30, 60_000);
    if (!rl.ok) {
      return Response.json(
        { error: `Rate limit exceeded. Retry in ${rl.retryAfter}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const search = searchParams.get('q') || searchParams.get('search') || undefined;

    const { questions, total } = await questionRepository.findMany({
      companySlug: searchParams.get('company') || undefined,
      topic: searchParams.get('topic') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      roundType: searchParams.get('roundType') || undefined,
      search,
      page,
      limit,
    });

    return successResponse(questions, {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
