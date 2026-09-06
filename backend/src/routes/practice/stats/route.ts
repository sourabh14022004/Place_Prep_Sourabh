/**
 * dashboard/student-portal/app/api/practice/stats/route.ts
 * GET /api/practice/stats — real KPI counts for the Practice page.
 *
 * BUG-P1 FIX: This route returns the total number of questions in the DB
 * grouped by roundType, so the Practice Category cards show real counts.
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
    
    const counts = await Question.aggregate([
      { $group: { _id: '$roundType', count: { $sum: 1 } } }
    ]);

    // Convert array to a map for easy lookup { "Coding": 2450, "System Design": 380, ... }
    const roundTypeCounts = counts.reduce((acc, curr) => {
      if (curr._id) {
        acc[curr._id] = curr.count;
      }
      return acc;
    }, {} as Record<string, number>);

    return successResponse({ roundTypeCounts });
  } catch (error) {
    return handleApiError(error);
  }
}
