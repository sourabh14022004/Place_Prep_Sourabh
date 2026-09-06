/**
 * dashboard/student-portal/app/api/experiences/popular-companies/route.ts
 * GET /api/experiences/popular-companies
 *
 * BUG-EX5 FIX: Returns top companies by real experience count from DB.
 * Previously, submit/page.tsx had hardcoded counts (51, 30, 21, etc.) which
 * never updated as new experiences were submitted.
 *
 * Response: { data: [{ slug, name, count }] }
 */

import connectDB from '../../../config/db';
import { requireStudent } from '../../../utils/authMiddleware';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';
import InterviewExperience from '../../../models/InterviewExperience';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    await requireStudent(request);

    // Aggregate experience count per company, sorted by count DESC, top 6
    const topCompanies = await InterviewExperience.aggregate([
      { $group: {
        _id: '$companySlug',
        name: { $first: '$companyName' },
        count: { $sum: 1 },
      }},
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $project: {
        _id: 0,
        slug: '$_id',
        name: 1,
        count: 1,
      }},
    ]);

    return successResponse({ companies: topCompanies });
  } catch (err) {
    return handleApiError(err);
  }
}
