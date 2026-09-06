/**
 * dashboard/student-portal/app/api/questions/[id]/route.ts
 * GET /api/questions/[id] — fetch full question detail.
 */

import connectDB from '../../../config/db';
import { requireStudent } from '../../../utils/authMiddleware';
import { questionRepository } from '../../../repositories/question.repository';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    await requireStudent(request);

    const { id } = await params;
    const question = await questionRepository.findById(id);

    if (!question) {
      return Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Question not found' } },
        { status: 404 }
      );
    }

    return successResponse(question);
  } catch (error) {
    return handleApiError(error);
  }
}
