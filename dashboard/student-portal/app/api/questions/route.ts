/**
 * dashboard/student-portal/app/api/questions/route.ts
 * GET /api/questions — paginated questions with multi-filter.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { questionRepository } from 'placeprep-backend/src/repositories/question.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';
import { rateLimit } from '@/lib/rateLimit';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    // BUG-S1 FIX: Rate limit — 30 requests per 60s per user
    const rl = rateLimit(user.userId, 'questions', 30, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Retry in ${rl.retryAfter}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

    const { questions, total } = await questionRepository.findMany({
      companySlug: searchParams.get('company') || undefined,
      topic: searchParams.get('topic') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      roundType: searchParams.get('roundType') || undefined,
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
