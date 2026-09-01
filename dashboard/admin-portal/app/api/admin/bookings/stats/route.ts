/**
 * dashboard/admin-portal/app/api/admin/bookings/stats/route.ts
 * GET /api/admin/bookings/stats — session booking statistics for the admin Bookings page.
 *
 * Returns the exact shape BookingsPage expects:
 *   { summary: { today, thisWeek, thisMonth }, byBatch[], dailyTrend[], topFaculty[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';
import SessionBooking from 'placeprep-backend/src/models/SessionBooking';
import StudentProfile from 'placeprep-backend/src/models/StudentProfile';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);

    const now = new Date();
    const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart   = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    const monthStart  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [
      todayCount,
      weekCount,
      monthCount,
      dailyTrendRaw,
      topFacultyRaw,
      studentBatchRaw,
      byStudentRaw,
    ] = await Promise.all([
      SessionBooking.countDocuments({ createdAt: { $gte: todayStart } }),
      SessionBooking.countDocuments({ createdAt: { $gte: weekStart } }),
      SessionBooking.countDocuments({ createdAt: { $gte: monthStart } }),

      // Daily trend — bookings per day, last 30 days
      SessionBooking.aggregate([
        { $match: { createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top faculty by booking demand (all time for stable ranking)
      SessionBooking.aggregate([
        {
          $group: {
            _id: '$facultyId',
            facultyName: { $first: '$facultyName' },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { bookings: -1 } },
        { $limit: 5 },
      ]),

      // Student batch mapping for byBatch
      StudentProfile.find({}).select('userId batch').lean(),

      // Bookings per student (to join batch)
      SessionBooking.aggregate([
        { $match: { createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: '$studentId',
            upcoming: { $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed']] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    // Daily trend — fill 30-day gaps
    const dailyMap = new Map<string, number>(
      (dailyTrendRaw as { _id: string; count: number }[]).map(d => [d._id, d.count])
    );
    const dailyTrend: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyTrend.push({ date: key, count: dailyMap.get(key) ?? 0 });
    }

    // Top faculty
    const topFaculty = (topFacultyRaw as { _id: string; facultyName: string; bookings: number }[]).map(f => ({
      facultyId: f._id?.toString() ?? '',
      name: f.facultyName ?? 'Unknown Faculty',
      bookings: f.bookings,
    }));

    // byBatch — join student bookings with batch info
    const studentBatchMap = new Map<string, string>(
      (studentBatchRaw as unknown as { userId: string; batch: string }[]).map(s => [s.userId.toString(), s.batch])
    );

    type BatchRow = { batch: string; upcoming: number; completed: number; cancelled: number };
    const batchMap = new Map<string, BatchRow>();

    for (const row of byStudentRaw as { _id: string; upcoming: number; completed: number; cancelled: number }[]) {
      const batch = studentBatchMap.get(row._id?.toString()) ?? 'Unknown';
      const existing = batchMap.get(batch) ?? { batch, upcoming: 0, completed: 0, cancelled: 0 };
      batchMap.set(batch, {
        batch,
        upcoming: existing.upcoming + row.upcoming,
        completed: existing.completed + row.completed,
        cancelled: existing.cancelled + row.cancelled,
      });
    }

    const byBatch = [...batchMap.values()].sort((a, b) => b.batch.localeCompare(a.batch));

    return successResponse({
      summary: {
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
      },
      dailyTrend,
      topFaculty,
      byBatch,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
