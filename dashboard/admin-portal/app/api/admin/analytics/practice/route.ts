/**
 * dashboard/admin-portal/app/api/admin/analytics/practice/route.ts
 * GET /api/admin/analytics/practice — practice KPIs, domain breakdown, daily solvers, batch×domain matrix.
 *
 * Returns the exact shape PracticeZonePage expects:
 *   { summary, byDomain[], dailySolvers[], batchDomainMatrix[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';
import QuestionCompletion from 'placeprep-backend/src/models/QuestionCompletion';
import StudentProfile from 'placeprep-backend/src/models/StudentProfile';

const DOMAINS = ['DSA', 'DBMS', 'OS', 'System Design', 'CN', 'Aptitude'];

// Map question topics to admin-facing domain labels
function topicToDomain(topic: string): string {
  const t = topic.toLowerCase();
  if (t.includes('system design') || t.includes('lld')) return 'System Design';
  if (t.includes('db') || t.includes('sql') || t.includes('database') || t.includes('dbms')) return 'DBMS';
  if (t.includes('os') || t.includes('operating')) return 'OS';
  if (t.includes('network') || t.includes('cn') || t.includes('http')) return 'CN';
  if (t.includes('aptitude') || t.includes('reasoning')) return 'Aptitude';
  return 'DSA'; // Default — arrays, trees, graphs, dp, etc.
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') ?? '30d';
    const daysBack = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    const [
      totalSolved,
      todaySolversRaw,
      topicsRaw,
      dailySolversRaw,
      studentBatchRaw,
      batchDomainRaw,
    ] = await Promise.all([
      // Total completions in range
      QuestionCompletion.countDocuments({ completedAt: { $gte: since } }),

      // Unique solvers today
      QuestionCompletion.distinct('studentId', { completedAt: { $gte: todayStart } }),

      // Top topics in range (joined with question topics)
      QuestionCompletion.aggregate([
        { $match: { completedAt: { $gte: since } } },
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'q',
          },
        },
        { $unwind: { path: '$q', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$q.topics', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$q.topics', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Daily unique solvers last N days
      QuestionCompletion.aggregate([
        { $match: { completedAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            uniqueSolvers: { $addToSet: '$studentId' },
          },
        },
        {
          $project: {
            date: '$_id',
            uniqueSolvers: { $size: '$uniqueSolvers' },
          },
        },
        { $sort: { date: 1 } },
      ]),

      // Student batch mapping
      StudentProfile.find({}).select('userId batch').lean(),

      // Per-student completions with topics — for batch×domain matrix
      QuestionCompletion.aggregate([
        { $match: { completedAt: { $gte: since } } },
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'q',
          },
        },
        { $unwind: { path: '$q', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$q.topics', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { studentId: '$studentId', topic: '$q.topics' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Domain breakdown — aggregate topic counts into domains
    const domainCounts = new Map<string, { questionsSolved: number; uniqueStudentsSet: Set<string> }>();
    for (const dom of DOMAINS) {
      domainCounts.set(dom, { questionsSolved: 0, uniqueStudentsSet: new Set() });
    }

    for (const t of topicsRaw as { _id: string; count: number }[]) {
      const domain = topicToDomain(t._id ?? '');
      const entry = domainCounts.get(domain)!;
      entry.questionsSolved += t.count;
    }

    const byDomain = DOMAINS.map(dom => {
      const entry = domainCounts.get(dom)!;
      return {
        domain: dom,
        questionsSolved: entry.questionsSolved,
        uniqueStudents: 0, // will be filled below
      };
    });

    // Top domain by questions solved
    const topDomain = byDomain.sort((a, b) => b.questionsSolved - a.questionsSolved)[0]?.domain ?? 'DSA';
    // Re-sort to consistent order
    const byDomainSorted = DOMAINS.map(dom => byDomain.find(d => d.domain === dom)!);

    // Daily solvers — fill gaps
    const dailyMap = new Map<string, number>(
      (dailySolversRaw as { date: string; uniqueSolvers: number }[]).map(d => [d.date, d.uniqueSolvers])
    );
    const dailySolvers: { date: string; uniqueSolvers: number }[] = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailySolvers.push({ date: key, uniqueSolvers: dailyMap.get(key) ?? 0 });
    }

    // Batch × Domain matrix
    const studentBatchMap = new Map<string, string>(
      (studentBatchRaw as unknown as { userId: string; batch: string }[]).map(s => [s.userId.toString(), s.batch])
    );

    type BatchDomainRow = { batch: string; domains: Record<string, number> };
    const batchDomainMap = new Map<string, Record<string, number>>();

    for (const row of batchDomainRaw as { _id: { studentId: string; topic: string }; count: number }[]) {
      const batch = studentBatchMap.get(row._id.studentId?.toString()) ?? 'Unknown';
      const domain = topicToDomain(row._id.topic ?? '');
      if (!batchDomainMap.has(batch)) {
        batchDomainMap.set(batch, Object.fromEntries(DOMAINS.map(d => [d, 0])));
      }
      batchDomainMap.get(batch)![domain] = (batchDomainMap.get(batch)![domain] ?? 0) + row.count;
    }

    const batchDomainMatrix: BatchDomainRow[] = [...batchDomainMap.entries()]
      .map(([batch, domains]) => ({ batch, domains }))
      .sort((a, b) => b.batch.localeCompare(a.batch));

    return successResponse({
      summary: {
        totalSolved,
        activeSolversToday: todaySolversRaw.length,
        topDomain,
      },
      byDomain: byDomainSorted,
      dailySolvers,
      batchDomainMatrix,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
