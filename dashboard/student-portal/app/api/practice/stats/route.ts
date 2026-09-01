/**
 * dashboard/student-portal/app/api/practice/stats/route.ts
 * GET /api/practice/stats — real KPI counts for the Practice page.
 *
 * BUG-P1 FIX: This route returns the total number of questions in the DB
 * grouped by roundType, so the Practice Category cards show real counts.
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
