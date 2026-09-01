/**
 * dashboard/admin-portal/app/api/admin/analytics/doubts/route.ts
 * GET /api/admin/analytics/doubts — doubt KPIs, timeline, subject/batch/faculty breakdown, hourly heatmap.
 *
 * Returns the exact shape DoubtsIntelPage expects:
 *   { summary, timeline[], bySubject[], byBatch[], byFaculty[], hourlyPattern[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';
import DoubtThread from 'placeprep-backend/src/models/DoubtThread';
import FacultyProfile from 'placeprep-backend/src/models/FacultyProfile';
import StudentProfile from 'placeprep-backend/src/models/StudentProfile';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') ?? 'monthly';

    // Date range window
    const now = new Date();
    let since: Date;
    switch (range) {
      case 'daily':  since = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); break;
      case 'weekly': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'yearly': since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      default:       since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const groupFormat = range === 'daily' ? '%H:00' : range === 'weekly' ? '%Y-%m-%d' : range === 'yearly' ? '%Y-%m' : '%Y-%m-%d';

    // Parallel aggregations — no N+1
    const [
      totalRaisedAgg,
      totalResolvedAgg,
      avgResolutionAgg,
      timelineRaised,
      timelineResolved,
      bySubjectRaw,
      byFacultyRaw,
      facultyProfiles,
      studentProfiles,
      hourlyRaw,
    ] = await Promise.all([
      DoubtThread.countDocuments({ createdAt: { $gte: since } }),
      DoubtThread.countDocuments({ status: 'resolved', createdAt: { $gte: since } }),

      // Avg resolution time in hours
      DoubtThread.aggregate([
        { $match: { status: 'resolved', 'replies.0': { $exists: true }, createdAt: { $gte: since } } },
        {
          $project: {
            resolvedAt: { $max: '$replies.sentAt' },
            createdAt: 1,
          },
        },
        {
          $group: {
            _id: null,
            avgHours: {
              $avg: {
                $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60],
              },
            },
          },
        },
      ]),

      // Timeline — doubts raised per period
      DoubtThread.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: groupFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Timeline — doubts resolved per period
      DoubtThread.aggregate([
        { $match: { status: 'resolved', createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: groupFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // By subject/tag
      DoubtThread.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$tag', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),

      // By faculty — count assigned and resolved
      DoubtThread.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: '$assignedFacultyId',
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),

      FacultyProfile.find({}).select('userId fullName').lean(),

      // All students with batch info — for byBatch
      StudentProfile.find({}).select('userId batch').lean(),

      // Hourly pattern — what time students raise doubts
      DoubtThread.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              day: { $dayOfWeek: '$createdAt' },
              hour: { $hour: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Merge timeline arrays
    const raisedMap = new Map<string, number>(
      (timelineRaised as { _id: string; count: number }[]).map(r => [r._id, r.count])
    );
    const resolvedMap = new Map<string, number>(
      (timelineResolved as { _id: string; count: number }[]).map(r => [r._id, r.count])
    );
    const allPeriods = [...new Set([...raisedMap.keys(), ...resolvedMap.keys()])].sort();
    const timeline = allPeriods.map(period => ({
      period,
      raised: raisedMap.get(period) ?? 0,
      resolved: resolvedMap.get(period) ?? 0,
    }));

    // bySubject
    const bySubject = (bySubjectRaw as { _id: string; count: number }[]).map(s => ({
      subject: s._id ?? 'Unknown',
      count: s.count,
    }));

    // byBatch — aggregate doubts by student batch (join via studentId)
    const studentBatchMap = new Map<string, string>(
      (studentProfiles as unknown as { userId: string; batch: string }[]).map(s => [s.userId.toString(), s.batch])
    );

    const byBatchRaw = await DoubtThread.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$studentId',
          raised: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        },
      },
    ]);

    const batchTotals = new Map<string, { raised: number; resolved: number }>();
    for (const row of byBatchRaw as { _id: string; raised: number; resolved: number }[]) {
      const batch = studentBatchMap.get(row._id?.toString()) ?? 'Unknown';
      const existing = batchTotals.get(batch) ?? { raised: 0, resolved: 0 };
      batchTotals.set(batch, {
        raised: existing.raised + row.raised,
        resolved: existing.resolved + row.resolved,
      });
    }
    const byBatch = [...batchTotals.entries()]
      .map(([batch, v]) => ({ batch, ...v }))
      .sort((a, b) => b.raised - a.raised);

    // byFaculty — merge with profile names
    const facultyMap = new Map<string, string>(
      (facultyProfiles as unknown as { userId: string; fullName: string }[]).map(f => [f.userId.toString(), f.fullName])
    );
    const byFaculty = (byFacultyRaw as { _id: string; total: number; resolved: number }[])
      .filter(f => f._id)
      .map(f => ({
        facultyId: f._id.toString(),
        name: facultyMap.get(f._id.toString()) ?? 'Unknown',
        total: f.total,
        rate: f.total > 0 ? Math.round((f.resolved / f.total) * 100) : 0,
      }));

    // Hourly heatmap for doubts
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatMap = new Map<string, number>();
    for (const r of hourlyRaw as { _id: { day: number; hour: number }; count: number }[]) {
      const dayIdx = (r._id.day + 5) % 7;
      heatMap.set(`${dayIdx}-${r._id.hour}`, r.count);
    }
    const hourlyPattern: { day: string; hour: number; value: number }[] = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        hourlyPattern.push({ day: DAYS[d], hour: h, value: heatMap.get(`${d}-${h}`) ?? 0 });
      }
    }

    const avgHours = (avgResolutionAgg as { avgHours: number }[])[0]?.avgHours ?? 0;
    const resolutionRate = totalRaisedAgg > 0 ? Math.round((totalResolvedAgg / totalRaisedAgg) * 100) : 0;

    return successResponse({
      summary: {
        totalRaised: totalRaisedAgg,
        totalResolved: totalResolvedAgg,
        resolutionRate,
        avgResolutionHours: Math.round(avgHours * 10) / 10,
      },
      timeline,
      bySubject,
      byBatch,
      byFaculty,
      hourlyPattern,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
