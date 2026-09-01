/**
 * dashboard/student-portal/app/api/dashboard/route.ts
 * GET /api/dashboard — student dashboard: stats + roadmaps + recent activity.
 *
 * Returns:
 *   { student, stats, roadmaps, recentActivity }
 *
 * Architecture: Route → Service → Repository → DB
 *
 * FIXES APPLIED:
 *   BUG-D2: Added fullName to student object
 *   BUG-D3: Added totalAssigned (real question count, not companiesOnRoadmap * 20)
 *   BUG-D5: Moved weeklyActivity INTO stats object (was at top level as recentActivity)
 *   BUG-T1: Each roadmap now includes _id, questions[], currentDay
 *   BUG-T2: companyName (not company) in roadmap objects
 *   BUG-T3: currentWeek + currentDay (both computed)
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { studentService } from 'placeprep-backend/src/services/student.service';
import { studentRepository } from 'placeprep-backend/src/repositories/student.repository';
import { roadmapRepository } from 'placeprep-backend/src/repositories/roadmap.repository';
import { questionRepository } from 'placeprep-backend/src/repositories/question.repository';
import QuestionCompletion from 'placeprep-backend/src/models/QuestionCompletion';
import { isValidObjectId, toObjectId } from 'placeprep-backend/src/utils/objectid';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    // These three reads are independent, so they run concurrently rather than
    // as three sequential round-trips.
    //   stats   — xpTotal, streak, problemsSolved, prepScore, weeklyActivity
    //   profile — fullName (BUG-D2)
    //   roadmapDocs — company card section
    const [stats, profile, roadmapDocs] = await Promise.all([
      studentService.getStats(user.userId),
      studentRepository.findByUserId(user.userId),
      roadmapRepository.findByStudentId(user.userId),
    ]);

    // BUG-T1 FIX: For each roadmap, fetch today's questions from the active week.
    // PERF FIX (10k users): completions used to be re-queried PER ROADMAP (N+1 on the
    // hottest endpoint). One indexed query now feeds every roadmap below.
    const completionDocs = await QuestionCompletion.find({ studentId: user.userId })
      .select('questionId companySlug')
      .lean();
    const completedByCompany = new Map<string, Set<string>>();
    for (const c of completionDocs as any[]) {
      const slug = c.companySlug ?? '_none';
      let set = completedByCompany.get(slug);
      if (!set) { set = new Set<string>(); completedByCompany.set(slug, set); }
      set.add(c.questionId.toString());
    }

    const roadmaps = await Promise.all(roadmapDocs.map(async (r) => {
      // Find the currently active week
      const activeWeek = (r.weeks ?? []).find((w: any) => w.status === 'active');

      // Fetch top 5 questions from the active week's topic at this company
      let todayQs: any[] = [];
      let tasksSource: 'plan' | 'extra' | 'none' = 'none';
      if (activeWeek) {
        try {
          const topicLabel = activeWeek.topicLabel as string;

          // Try 1: exact topic match (works when topicLabel === question's topic string)
          let result = await questionRepository.findMany({
            companySlug: r.companySlug,
            topic: topicLabel,
            limit: 20,
          });
          let questions = result?.questions ?? [];

          // Try 2: if exact match returns nothing, try any questions for this company.
          // HONESTY FIX: these are NOT the scheduled plan — flagged 'extra' so the UI
          // labels them "Extra practice" instead of pretending they're Week-N Day-X tasks.
          if (questions.length === 0) {
            const fallback = await questionRepository.findMany({
              companySlug: r.companySlug,
              limit: 20,
            });
            questions = fallback?.questions ?? fallback ?? [];
            tasksSource = questions.length > 0 ? 'extra' : 'none';
          } else {
            tasksSource = 'plan';
          }

          const completedSet = completedByCompany.get(r.companySlug) ?? new Set<string>();

          // Show only incomplete questions, capped at 5
          const incompleteQs = (questions as any[]).filter((q: any) => !completedSet.has(q._id.toString()));
          todayQs = incompleteQs.slice(0, 5).map((q: any) => ({
            id:          q._id.toString(),
            title:       q.problemSummary,
            difficulty:  q.difficulty,
            xp:          q.difficulty === 'Hard' ? 50 : q.difficulty === 'Medium' ? 25 : 10,
            leetcodeUrl: q.leetcodeUrl || q.sourceUrl || null,
            practiceUrl: q.leetcodeUrl || q.sourceUrl || null,
            sourceUrl:   q.sourceUrl ?? null,
          }));
        } catch (err: any) {
          console.error(`[dashboard] question lookup failed for ${r.companySlug}:`, err?.message);
          todayQs = [];
        }
      }

      // Compute current day within the week from doneQuestions
      const questionsPerDay = Math.ceil((activeWeek?.totalQuestions ?? 7) / 7);
      const currentDay = Math.min(
        7,
        Math.ceil((activeWeek?.doneQuestions ?? 0) / Math.max(questionsPerDay, 1)) + 1
      );

      return {
        _id:            r._id.toString(),        // BUG-T4 FIX: roadmapId needed for completeQuestion()
        companySlug:    r.companySlug,
        companyName:    r.companyName,           // BUG-T2 FIX: was co.company (undefined), now co.companyName
        companyLogoUrl: r.companyLogoUrl ?? null,
        roleName:       r.roleName,
        pctComplete:    r.pctComplete,
        currentWeek:    r.currentWeek,           // BUG-T3 FIX: was co.week, now co.currentWeek
        currentDay,                               // BUG-T3 FIX: was co.day (never existed), now computed
        weeksCommitted: r.weeksCommitted,
        isActive:       r.isActive,
        questions:      todayQs,                 // BUG-T1 FIX: THE MAIN MISSING PIECE — was always empty
        tasksSource,                             // HONESTY FIX: 'plan' vs 'extra' labeling
      };
    }));

    // BUG-D3 FIX: Compute real total assigned questions across all roadmaps
    const totalAssigned = roadmapDocs.reduce(
      (sum: number, r: any) => sum + (r.weeks ?? []).reduce((s: number, w: any) => s + (w.totalQuestions ?? 0), 0),
      0
    );

    // Student summary for header section
    const student = {
      fullName: profile?.fullName ?? null,      // BUG-D2 FIX: added fullName
      xp:     stats.xpTotal,
      streak: stats.currentStreakDays,
      solved: stats.problemsSolved,
      score:  stats.prepScore,
      onboardingComplete: stats.onboardingComplete,
    };

    return successResponse({
      student,
      stats: {
        xpTotal:           stats.xpTotal,
        currentStreakDays:  stats.currentStreakDays,
        // BUG-PR1 FIX: expose real bestStreakDays from DB (was Math.max(currentStreak, 5) on frontend)
        bestStreakDays:     profile?.bestStreakDays ?? stats.currentStreakDays ?? 0,
        problemsSolved:    stats.problemsSolved,
        prepScore:         stats.prepScore,
        companiesOnRoadmap: roadmaps.length,
        totalAssigned,                           // BUG-D3 FIX: real total questions, not count*20
        weeklyActivity:    stats.weeklyActivity, // BUG-D5 FIX: moved INTO stats (was at top-level recentActivity)
        prepTargets:       stats.prepTargets,    // SINGLE SOURCE OF TRUTH for dashboard breakdown bars
        // Codolio-style fields
        todaySolved:       stats.todaySolved,
        dailyGoal:         stats.dailyGoal,
        dailyGoalPct:      stats.dailyGoalPct,
        batchRank:         stats.batchRank,
        yearlyActivity:    stats.yearlyActivity, // CRITICAL FIX: was omitted → Progress "Past Year" heatmap rendered ~91% empty
        byDifficulty:      stats.byDifficulty,   // real difficulty split for dashboard cards
        easySolved:        stats.easySolved,
        mediumSolved:      stats.mediumSolved,
        hardSolved:        stats.hardSolved,
        latestActivity:    stats.latestActivity, // also moved here for consistency
      },
      roadmaps,
      // Keep recentActivity for backwards compatibility (but stats.weeklyActivity is the fix)
      recentActivity: stats.weeklyActivity,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
