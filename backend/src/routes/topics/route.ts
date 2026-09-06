/**
 * dashboard/student-portal/app/api/topics/route.ts
 * GET /api/topics — Returns all distinct topics from the DB
 */

import connectDB from '../../config/db';
import { requireAuth } from '../../utils/authMiddleware';
import Question from '../../models/Question';
import { successResponse } from '../../utils/apiResponse';
import { handleApiError } from '../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    await requireAuth(request); // defense-in-depth (middleware alone is not enough)
    const topics = await Question.distinct('topics');
    return successResponse(topics.sort());
  } catch (error) {
    return handleApiError(error);
  }
}
