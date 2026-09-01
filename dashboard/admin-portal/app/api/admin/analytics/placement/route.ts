/**
 * dashboard/admin-portal/app/api/admin/analytics/placement/route.ts
 * GET /api/admin/analytics/placement — batch placement rates, company interest, assignment solve rate.
 *
 * Returns the exact shape PlacementPage expects:
 *   { batchPlacementRate[], companyInterest[], assignmentSolveRate[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';
import StudentProfile from 'placeprep-backend/src/models/StudentProfile';
import QuestionCompletion from 'placeprep-backend/src/models/QuestionCompletion';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);

    const [
      batchRaw,
      companyInterestRaw,
      weeklyCompletionRaw,
    ] = await Promise.all([
      // Per-batch: total students, placed students
      StudentProfile.aggregate([
        {
          $group: {
            _id: '$batch',
            total: { $sum: 1 },
            placed: {
              $sum: { $cond: [{ $eq: ['$placementStatus', 'PLACED'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: -1 } },
      ]),

      // Company interest — unwind targetCompanySlugs array
      StudentProfile.aggregate([
        { $unwind: '$targetCompanySlugs' },
        {
          $group: {
            _id: '$targetCompanySlugs',
            studentCount: { $sum: 1 },
          },
        },
        { $sort: { studentCount: -1 } },
        { $limit: 8 },
      ]),

      // Weekly assignment solve rate — % of students who solved at least 1 Q in each week (last 12 weeks)
      QuestionCompletion.aggregate([
        { $match: { completedAt: { $gte: new Date(Date.now() - 84 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: {
              week: { $isoWeek: '$completedAt' },
              year: { $isoWeekYear: '$completedAt' },
            },
            uniqueSolvers: { $addToSet: '$studentId' },
          },
        },
        {
          $project: {
            week: '$_id.week',
            year: '$_id.year',
            solverCount: { $size: '$uniqueSolvers' },
          },
        },
        { $sort: { year: 1, week: 1 } },
      ]),
    ]);

    // Batch placement rate
    const batchPlacementRate = (batchRaw as { _id: string; total: number; placed: number }[]).map(b => ({
      batch: b._id ?? 'Unknown',
      total: b.total,
      placed: b.placed,
      rate: b.total > 0 ? Math.round((b.placed / b.total) * 100) : 0,
    }));

    // Company interest — capitalize slug to label
    const companyInterest = (companyInterestRaw as { _id: string; studentCount: number }[]).map(c => ({
      company: c._id
        ? c._id.charAt(0).toUpperCase() + c._id.slice(1)
        : 'Unknown',
      studentCount: c.studentCount,
    }));

    // Total students for solve-rate percentage
    const totalStudents = batchPlacementRate.reduce((sum, b) => sum + b.total, 0);

    // Weekly assignment solve rate
    const assignmentSolveRate = (weeklyCompletionRaw as { week: number; year: number; solverCount: number }[]).map(w => ({
      period: `W${w.week} ${w.year}`,
      rate: totalStudents > 0 ? Math.min(Math.round((w.solverCount / totalStudents) * 100), 100) : 0,
    }));

    // Ensure we always have at least a stub array so .at(-1) doesn't fail
    if (assignmentSolveRate.length === 0) {
      assignmentSolveRate.push({ period: 'Current', rate: 0 });
    }

    return successResponse({
      batchPlacementRate,
      companyInterest,
      assignmentSolveRate,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
