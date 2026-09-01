import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import Question from 'placeprep-backend/src/models/Question';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const company = searchParams.get('company') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const roundType = searchParams.get('roundType') || '';
    const questionType = searchParams.get('questionType') || '';
    const verifiedParam = searchParams.get('verified');

    const query: Record<string, unknown> = {};
    if (company) query.companySlug = company;
    if (difficulty) query.difficulty = difficulty;
    if (roundType) query.roundType = roundType;
    if (questionType) query.questionType = questionType;
    if (verifiedParam === 'true') query.verified = true;
    if (verifiedParam === 'false') query.verified = false;

    const [questions, total] = await Promise.all([
      Question.find(query)
        .select('companyName companySlug problemSummary difficulty roundType questionType verified manuallyCurated isHot isSeeded sourceId createdAt')
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Question.countDocuments(query),
    ]);

    return successResponse(
      { questions, total },
      { meta: { page, limit, totalPages: Math.ceil(total / limit) } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json() as Record<string, unknown>;
    const question = await Question.create({
      ...body,
      verified: false,
      manuallyCurated: true,
    });

    return successResponse({ question });
  } catch (error) {
    return handleApiError(error);
  }
}
