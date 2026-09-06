/**
 * GET /api/practice/categories
 * Returns real question counts grouped by questionType for the Practice Zone category cards.
 * Only counts verified, non-duplicate records so counts match what students can actually access.
 */

import connectDB from '../../../config/db';
import { requireAuth } from '../../../utils/authMiddleware';
import { featureFlagService } from '../../../services/featureFlag.service';
import Question from '../../../models/Question';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
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
