/**
 * GET /api/companies/[slug]/trends
 * Aggregates Question.interviewYear × roundType into year-by-year
 * DSA / SystemDesign / Behavioral percentage breakdown.
 * Returns hasData: false when no questions carry an interviewYear.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import Question from 'placeprep-backend/src/models/Question';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    await requireStudent(request);

    const { slug } = await params;
    const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!safeSlug) throw ApiError.badRequest('Invalid company slug');

    const rows = await Question.aggregate([
      { $match: { companySlug: safeSlug, interviewYear: { $exists: true, $ne: null } } },
      {
        $group: {
          _id:        '$interviewYear',
          dsa:        { $sum: { $cond: [{ $in: ['$roundType', ['Coding', 'Aptitude']] }, 1, 0] } },
          sysDesign:  { $sum: { $cond: [{ $in: ['$roundType', ['System Design', 'LLD']] }, 1, 0] } },
          behavioral: { $sum: { $cond: [{ $eq:  ['$roundType', 'HR'] }, 1, 0] } },
          total:      { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          year:         { $toString: '$_id' },
          DSA:          { $round: [{ $multiply: [{ $divide: ['$dsa',        '$total'] }, 100] }, 0] },
          SystemDesign: { $round: [{ $multiply: [{ $divide: ['$sysDesign',  '$total'] }, 100] }, 0] },
          Behavioral:   { $round: [{ $multiply: [{ $divide: ['$behavioral', '$total'] }, 100] }, 0] },
        },
      },
    ]);

    return successResponse({ data: rows, hasData: rows.length > 0 });
  } catch (error) {
    return handleApiError(error);
  }
}
