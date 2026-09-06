/**
 * dashboard/admin-portal/app/api/admin/students/stats/route.ts
 * GET /api/admin/students/stats — platform-wide student KPI aggregates.
 *
 * Purpose: The Students page KPI strip previously calculated placed count,
 * avg progress, and batch count from only the current page of students.
 * This endpoint returns those metrics over ALL students in the DB.
 */

import connectDB from '../../../../config/db';
import { requireAdmin } from '../../../../utils/authMiddleware';
import { handleApiError } from '../../../../utils/apiError';
import StudentProfile from '../../../../models/StudentProfile';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);

    const [placedCount, totalCount, batchList, avgXpAgg] = await Promise.all([
      StudentProfile.countDocuments({ placementStatus: 'PLACED' }),
      StudentProfile.countDocuments({}),
      StudentProfile.distinct('batch'),
      StudentProfile.aggregate([
        { $group: { _id: null, avg: { $avg: '$xpTotal' } } },
      ]),
    ]);

    const avgXp = avgXpAgg[0]?.avg ?? 0;
    // Progress is stored as xpTotal; normalize to a 0–100% scale (cap at 2000 XP = 100%)
    const avgProgress = Math.min(Math.round(avgXp / 20), 100);

    return Response.json({
      success: true,
      data: {
        placedCount,
        totalCount,
        batchCount: batchList.filter(Boolean).length,
        avgProgress,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
