/**
 * dashboard/student-portal/app/api/questions/[id]/route.ts
 * GET /api/questions/[id] — fetch full question detail.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { questionRepository } from 'placeprep-backend/src/repositories/question.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    await requireStudent(request);

    const { id } = await params;
    const question = await questionRepository.findById(id);

    if (!question) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Question not found' } },
        { status: 404 }
      );
    }

    return successResponse(question);
  } catch (error) {
    return handleApiError(error);
  }
}
