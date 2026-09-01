/**
 * GET /api/practice/categories
 * Returns real question counts grouped by questionType for the Practice Zone category cards.
 * Only counts verified, non-duplicate records so counts match what students can actually access.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAuth } from 'placeprep-backend/src/utils/authMiddleware';
import { featureFlagService } from 'placeprep-backend/src/services/featureFlag.service';
import Question from 'placeprep-backend/src/models/Question';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAuth(request); // defense-in-depth (middleware alone is not enough)
    await featureFlagService.assertEnabled('student.practice');

    const rows = await Question.aggregate([
      { $match: { isDuplicate: { $ne: true }, verified: true } },
      { $group: { _id: '$questionType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const categories = rows
      .filter((r: { _id: unknown; count: number }) => r._id)
      .map((r: { _id: unknown; count: number }) => ({ questionType: r._id as string, count: r.count as number }));

    return successResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}
