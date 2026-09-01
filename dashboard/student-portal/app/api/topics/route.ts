/**
 * dashboard/student-portal/app/api/topics/route.ts
 * GET /api/topics — Returns all distinct topics from the DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAuth } from 'placeprep-backend/src/utils/authMiddleware';
import Question from 'placeprep-backend/src/models/Question';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAuth(request); // defense-in-depth (middleware alone is not enough)
    const topics = await Question.distinct('topics');
    return successResponse(topics.sort());
  } catch (error) {
    return handleApiError(error);
  }
}
