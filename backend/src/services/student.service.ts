/**
 * backend/src/services/student.service.ts
 * Business logic for student portal features.
 */

import { studentRepository } from '../repositories/student.repository';
import { roadmapRepository } from '../repositories/roadmap.repository';
import { companyRepository } from '../repositories/company.repository';
import { questionRepository } from '../repositories/question.repository';
import { roadmapService } from './roadmap.service';
import { notificationRepository } from '../repositories/notification.repository';
import { doubtRepository } from '../repositories/doubt.repository';
import { sessionRepository } from '../repositories/session.repository';
import QuestionCompletion from '../models/QuestionCompletion';
import StudentProfile from '../models/StudentProfile';
import { ApiError } from '../utils/apiError';
import mongoose from 'mongoose';
import type { OnboardingInput } from '../validators/student.validator';

const XP_BY_DIFFICULTY: Record<string, number> = {
  Easy: 10,
  Medium: 25,
  Hard: 50,
};

// ── Platform helpers ──────────────────────────────────────────────────────────

function extractHandle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.trim().replace(/\/+$/, '');
  if (s.includes('/')) s = s.split('/').pop()!;
  return s.replace(/^@/, '') || null;
}

async function fetchLeetCodeStats(handle: string) {
  const query = `query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      profile { ranking }
      submitStatsGlobal { acSubmissionNum { difficulty count } }
    }
  }`;
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'PlacePrep/1.0', Referer: 'https://leetcode.com' },
      body: JSON.stringify({ query, variables: { username: handle } }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await (res.json() as any);
    const u = data?.data?.matchedUser;
    if (!u) return null;
    const ac: { difficulty: string; count: number }[] = u.submitStatsGlobal?.acSubmissionNum ?? [];
    const get = (d: string) => ac.find(x => x.difficulty === d)?.count ?? 0;
    return { ranking: u.profile?.ranking ?? 0, totalSolved: get('All'), easy: get('Easy'), medium: get('Medium'), hard: get('Hard') };
  } catch { return null; }
}

async function fetchCodeforcesStats(handle: string) {
  try {
    const res = await fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    const data = await (res.json() as any);
    if (data.status !== 'OK' || !data.result?.[0]) return null;
    const u = data.result[0];
    return { rating: u.rating ?? 0, maxRating: u.maxRating ?? 0, rank: u.rank ?? 'unrated', maxRank: u.maxRank ?? 'unrated' };
  } catch { return null; }
}

async function verifyLeetCodeSolve(handle: string, leetcodeUrl: string): Promise<boolean> {
  // Extract slug from URL: https://leetcode.com/problems/two-sum/ → two-sum
  const match = leetcodeUrl.match(/problems\/([^/?#]+)/);
  if (!match) return false;
  const slug = match[1];
  const query = `query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) { titleSlug }
  }`;
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'PlacePrep/1.0', Referer: 'https://leetcode.com' },
      body: JSON.stringify({ query, variables: { username: handle, limit: 100 } }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await (res.json() as any);
    const subs: { titleSlug: string }[] = data?.data?.recentAcSubmissionList ?? [];
    return subs.some(s => s.titleSlug === slug);
  } catch { return false; }
}

async function verifyCodeforcesSolve(handle: string, sourceUrl: string): Promise<boolean> {
  // Extract contestId + index from URL formats:
  //   https://codeforces.com/problemset/problem/1234/A
  //   https://codeforces.com/contest/1234/problem/A
  const match = sourceUrl.match(/\/(\d+)\/(?:problem\/)?([A-Z]\d*)/i);
  if (!match) return false;
  const contestId = parseInt(match[1], 10);
  const index = match[2].toUpperCase();
  try {
    const res = await fetch(
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=200`,
      { signal: AbortSignal.timeout(8000) }
    );
    const data = await (res.json() as any);
    if (data.status !== 'OK') return false;
    return (data.result as any[]).some(
      s => s.verdict === 'OK' && s.problem?.contestId === contestId && s.problem?.index?.toUpperCase() === index
    );
  } catch { return false; }
}

export const studentService = {
  async getProfile(userId: string) {
    let profile = await studentRepository.findByUserId(userId);
    if (!profile) {
      // Auto-create default profile for robustness to prevent 404s
      const user = await import('../repositories/user.repository').then(m => m.userRepository.findById(userId));
      if (!user) throw ApiError.notFound('User not found');

      profile = await studentRepository.create({
        userId: new mongoose.Types.ObjectId(userId),
        fullName: user.email.split('@')[0],
        batch: '2024',
        branch: 'CS & AI',
        year: '3rd',
        onboardingComplete: false,
        placementStatus: 'IN_PROGRESS',
      } as never);
    }

    const handles = (profile as any).platformHandles ?? {};
    const lcHandle = extractHandle(handles.leetcode);
    const cfHandle = extractHandle(handles.codeforces);

    const [lcStats, cfStats] = await Promise.allSettled([
      lcHandle ? fetchLeetCodeStats(lcHandle) : Promise.resolve(null),
      cfHandle ? fetchCodeforcesStats(cfHandle) : Promise.resolve(null),
    ]);

    const profileObj = (profile as any).toObject?.() ?? { ...(profile as any) };
    return {
      ...profileObj,
      platformHandles: { leetcode: lcHandle ?? undefined, codeforces: cfHandle ?? undefined },
      platformStats: {
        leetcode:   lcStats.status === 'fulfilled' ? lcStats.value : null,
        codeforces: cfStats.status === 'fulfilled' ? cfStats.value : null,
      },
    };
  },

  async updateProfile(userId: string, data: Record<string, unknown>) {
    // platformHandles must be expanded to dot-notation so a single-field update
    // (e.g. only leetcode) doesn't wipe the sibling codeforces field.
    const { platformHandles, ...rest } = data as any;
    const flatData: Record<string, unknown> = { ...rest };
    if (platformHandles && typeof platformHandles === 'object') {
      for (const [k, v] of Object.entries(platformHandles as Record<string, string | null>)) {
        const clean = v ? extractHandle(v) : null;
        if (clean) {
          flatData[`platformHandles.${k}`] = clean;
        } else {
          // null means disconnect — unset the field
          await StudentProfile.findOneAndUpdate(
            { userId: new mongoose.Types.ObjectId(userId) },
            { $unset: { [`platformHandles.${k}`]: '' } }
          );
        }
      }
    }
    const profile = await studentRepository.updateByUserId(userId, flatData as any);
    if (!profile) throw ApiError.notFound('Student profile');
    return profile;
  },

  async getStats(userId: string) {
    let profile = await studentRepository.findByUserId(userId);
    if (!profile) {
      profile = await this.getProfile(userId); // Use the robust getProfile
    }
    if (!profile) throw ApiError.notFound('Student profile');

    // DATA-INTEGRITY: seeded demo completions (isSeeded:true) must never count
    // toward a user's real progress — a fresh account shows honest zeros.
    const realCompletionFilter = {
      studentId: new mongoose.Types.ObjectId(userId),
      isSeeded: { $ne: true },
    };
    const [roadmaps, problemsSolved] = await Promise.all([
      roadmapRepository.findByStudentId(userId),
      QuestionCompletion.countDocuments(realCompletionFilter),
    ]);

    // BUG-FIX A3: align prepScore formula with frontend breakdown bars (single source of truth)
    // old formula used different denominators (1500 XP, 80 problems) causing ring vs. bars mismatch
    const totalAssigned = roadmaps.reduce(
      (sum, r) => sum + (r.weeks ?? []).reduce((s, w) => s + (w.totalQuestions ?? 0), 0), 0
    );
    const practiceScore = Math.min((problemsSolved / Math.max(totalAssigned, 1)) * 100, 100) * 0.45;
    const streakScore   = Math.min((profile.currentStreakDays / 30) * 100, 100) * 0.30;
    const xpScore       = Math.min((profile.xpTotal / 5000) * 100, 100) * 0.25;
    const prepScore     = Math.round(practiceScore + streakScore + xpScore);

    // Activity charts — 30 days for the dashboard mini-chart, 365 days so the
    // Progress-page heatmap renders REAL history instead of an empty grid.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const yearAgo = new Date();
    yearAgo.setDate(yearAgo.getDate() - 365);

    const activityAgg = QuestionCompletion.aggregate([
      {
        $match: {
          ...realCompletionFilter,
          completedAt: { $gte: yearAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: 'Asia/Kolkata' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const [activity, recentActivity] = await Promise.all([
      activityAgg,
      // last 30 days slice for the dashboard chart
      QuestionCompletion.aggregate([
        {
          $match: {
            ...realCompletionFilter,
            completedAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: 'Asia/Kolkata' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    /**
     * STREAKS — computed LIVE from real completion days instead of trusting
     * profile counters that seed data (or old bugs) may have inflated.
     * currentStreak: consecutive active days ending today or yesterday.
     * bestStreak: longest run of consecutive active days in the past year.
     */
    const computeStreaks = (
      pairs: { date: string; count: number }[]
    ): { currentStreak: number; bestStreak: number } => {
      if (!pairs.length) return { currentStreak: 0, bestStreak: 0 };
      // Sorted set of local YYYY-MM-DD keys with activity
      const days = [...new Set(pairs.map((p) => p.date))].sort();
      const daySet = new Set(days);
      const DAY_MS = 86_400_000;

      // Best run
      let best = 0;
      let run = 0;
      let prev: Date | null = null;
      for (const d of days) {
        const cur = new Date(`${d}T00:00:00`);
        if (prev && Math.round((cur.getTime() - prev.getTime()) / DAY_MS) === 1) {
          run += 1;
        } else {
          run = 1;
        }
        best = Math.max(best, run);
        prev = cur;
      }

      // Current run must end today or yesterday
      let currentStreak = 0;
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);
      const keyFor = (dt: Date) => {
        const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
        return local.toISOString().split('T')[0];
      };
      if (!daySet.has(keyFor(cursor))) {
        cursor.setTime(cursor.getTime() - DAY_MS); // allow "yesterday" anchors
      }
      while (daySet.has(keyFor(cursor))) {
        currentStreak += 1;
        cursor.setTime(cursor.getTime() - DAY_MS);
      }

      return { currentStreak, bestStreak: Math.max(best, currentStreak) };
    };

    const toPairs = (rows: { _id: string; count: number }[]) =>
      rows.map((a) => ({ date: a._id, count: a.count }));
    const weeklyActivity = toPairs(recentActivity);   // kept for dashboard compat
    const yearlyActivity = toPairs(activity);         // full-year heatmap data

    // Difficulty breakdown of everything the student has actually completed
    const difficultyAgg = await QuestionCompletion.aggregate([
      { $match: { ...realCompletionFilter } },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question',
        },
      },
      { $unwind: '$question' },
      { $group: { _id: '$question.difficulty', count: { $sum: 1 } } },
    ]);
    const byDifficulty: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
    difficultyAgg.forEach((d: { _id: string; count: number }) => {
      if (d._id) byDifficulty[d._id] = d.count;
    });

    // Get latest activity
    const latestCompletion = await QuestionCompletion.findOne({
      studentId: new mongoose.Types.ObjectId(userId)
    })
    .sort({ completedAt: -1 })
    .populate('questionId', 'title problemSummary');

    let latestActivity = null;
    if (latestCompletion && latestCompletion.questionId) {
      latestActivity = {
        title: (latestCompletion.questionId as any).problemSummary, // BUG-D4 FIX: Question has no .title field
        completedAt: latestCompletion.completedAt,
      };
    }

    const { currentStreak, bestStreak } = computeStreaks(yearlyActivity);

    // ── Codolio-style extras ─────────────────────────────────────────
    // Daily goal progress (today's REAL solves vs the user's target)
    const todayKey = (() => {
      const d = new Date();
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return local.toISOString().split('T')[0];
    })();
    const todaySolved = yearlyActivity.find((a) => a.date === todayKey)?.count ?? 0;
    const dailyGoal = profile.dailyGoal ?? 5;

    // Batch rank by XP (single indexed count — cheap even at 10k users)
    let batchRank: number | null = null;
    if (profile.batch) {
      batchRank =
        (await StudentProfile.countDocuments({
          batch: profile.batch,
          xpTotal: { $gt: profile.xpTotal ?? 0 },
        })) + 1;
    }

    return {
      xpTotal: profile.xpTotal,
      // LIVE COMPUTED from real (non-seeded) completions — never seed-inflated
      currentStreakDays: currentStreak,
      bestStreakDays: bestStreak,
      problemsSolved,
      prepScore,
      // SINGLE SOURCE OF TRUTH: the dashboard previously re-implemented this
      // formula client-side with its own magic numbers (5000/30). Now shipped
      // from the same place the score is computed.
      prepTargets: { xp: 5000, streak: 30 },
      companiesOnRoadmap: roadmaps.length,
      weeklyActivity,
      yearlyActivity,
      byDifficulty,
      easySolved: byDifficulty.Easy ?? 0,
      mediumSolved: byDifficulty.Medium ?? 0,
      hardSolved: byDifficulty.Hard ?? 0,
      onboardingComplete: profile.onboardingComplete,
      latestActivity,
      // Codolio-inspired fields
      todaySolved,
      dailyGoal,
      dailyGoalPct: Math.min(100, Math.round((todaySolved / Math.max(dailyGoal, 1)) * 100)),
      batchRank,
      fullName: profile.fullName,
      batch: profile.batch,
    };
  },

  async completeOnboarding(userId: string, data: OnboardingInput) {
    const profile = await studentRepository.findByUserId(userId);
    if (!profile) throw ApiError.notFound('Student profile');

    // Update profile with onboarding data
    await studentRepository.updateByUserId(userId, {
      targetDomains: data.targetDomains,
      targetCategories: data.targetCategories as never,
      topicSelfRatings: new Map(Object.entries(data.topicSelfRatings)),
      targetCompanySlugs: data.targetCompanySlugs,
      prepWeeksCommitted: data.prepWeeksCommitted,
      onboardingComplete: true,
      onboardingCompletedAt: new Date(),
    });

    // Create roadmaps for each target company (max 3 to start)
    const companies = await companyRepository.findBySlugs(
      data.targetCompanySlugs.slice(0, 3)
    );

    for (const company of companies) {
      // Check if roadmap already exists
      const existing = await roadmapRepository.findByStudentAndCompany(
        userId,
        company.slug
      );
      if (existing) continue;

      // Phase 2: unified week builder — self-ratings affect order; questionIds populated
      const totalWeeks = data.prepWeeksCommitted;
      const weeks = await roadmapService.buildWeeks({
        companySlug: company.slug,
        targetRole: data.targetRole,
        prepWeeks: totalWeeks,
        topicSelfRatings: data.topicSelfRatings,
      });

      await roadmapRepository.create({
        studentId: new mongoose.Types.ObjectId(userId),
        companyId: company._id,
        companySlug: company.slug,
        companyName: company.name,
        companyLogoUrl: company.logoUrl,
        roleName: data.targetRole,
        weeksCommitted: weeks.length,
        currentWeek: 1,
        pctComplete: 0,
        isActive: true,
        weeks,
        selfRatingsSnapshot: new Map(Object.entries(data.topicSelfRatings)),
      } as never);
    }

    // XP reward for completing onboarding
    await studentRepository.addXp(userId, 100);
    // BUG-FIX F2: removed 'xp' bell notification — XP feedback is toast-only

    return { success: true, xpAwarded: 100 }; // BUG-FIX F2
  },

  async completeQuestion(
    userId: string,
    questionId: string,
    roadmapId?: string
  ) {
    const question = await questionRepository.findById(questionId);
    if (!question) throw ApiError.notFound('Question');

    const oid = new mongoose.Types.ObjectId(userId);
    const qid = new mongoose.Types.ObjectId(questionId);

    // If already completed, return idempotently — do NOT throw.
    // Previously this threw ApiError.conflict which caused the UI checkbox to roll back
    // even when the question WAS completed (after page refresh, re-click = conflict = unchecked).
    const existing = await QuestionCompletion.findOne({ studentId: oid, questionId: qid });
    if (existing) {
      return {
        xpEarned: existing.xpEarned ?? 0,
        totalXp: 0,
        alreadyCompleted: true,
        verifiedViaPlatform: (existing as any).verifiedViaPlatform ?? false,
      };
    }

    // ── Platform verification ─────────────────────────────────────────────────
    const rawUrl: string =
      (question as any).leetcodeUrl ||
      (question as any).sourceUrl ||
      (question as any).practiceUrl ||
      '';
    const isLcUrl = typeof rawUrl === 'string' && rawUrl.includes('leetcode.com');
    const isCfUrl = typeof rawUrl === 'string' && rawUrl.includes('codeforces.com');
    const lcUrl = isLcUrl ? rawUrl : undefined;
    const cfUrl = isCfUrl ? rawUrl : undefined;

    let verifiedViaPlatform = false;
    let unlinkedPlatform: 'LeetCode' | 'Codeforces' | undefined = undefined;
    let platformName: string | undefined = undefined;

    if (lcUrl || cfUrl) {
      const profile = await StudentProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      const handles = (profile as any)?.platformHandles ?? {};
      const lcHandle = extractHandle(handles.leetcode);
      const cfHandle = extractHandle(handles.codeforces);

      if (lcUrl) {
        platformName = 'LeetCode';
        if (!lcHandle) {
          // Scenario: User hasn't connected LeetCode profile.
          // Allow them to self-mark as done, but flag as unlinked so UI can remind them to connect.
          verifiedViaPlatform = false;
          unlinkedPlatform = 'LeetCode';
        } else {
          const solved = await verifyLeetCodeSolve(lcHandle, lcUrl);
          if (!solved) {
            throw ApiError.badRequest(
              'No accepted LeetCode submission found for this problem. Solve it on LeetCode first, then try again.'
            );
          }
          verifiedViaPlatform = true;
        }
      } else if (cfUrl) {
        platformName = 'Codeforces';
        if (!cfHandle) {
          // Scenario: User hasn't connected Codeforces profile.
          verifiedViaPlatform = false;
          unlinkedPlatform = 'Codeforces';
        } else {
          const solved = await verifyCodeforcesSolve(cfHandle, cfUrl);
          if (!solved) {
            throw ApiError.badRequest(
              'No accepted Codeforces submission found for this problem. Solve it on Codeforces first, then try again.'
            );
          }
          verifiedViaPlatform = true;
        }
      }
    }
    // ── End verification ──────────────────────────────────────────────────────

    // Coerce defensively — some scraped docs lack difficulty, and generic-pool
    // questions carry companySlug: null (both previously 500'd the save).
    const safeDifficulty: 'Easy' | 'Medium' | 'Hard' =
      question.difficulty === 'Easy' || question.difficulty === 'Hard' ? question.difficulty : 'Medium';
    const xpEarned = XP_BY_DIFFICULTY[safeDifficulty] || 10;

    // Atomic: save completion + add XP
    await Promise.all([
      QuestionCompletion.create({
        studentId: oid,
        questionId: qid,
        roadmapId: roadmapId ? new mongoose.Types.ObjectId(roadmapId) : undefined,
        companySlug: question.companySlug ?? null,
        difficulty: safeDifficulty,
        xpEarned,
        verifiedViaPlatform,
      }),
      studentRepository.addXp(userId, xpEarned),
    ]);

    // Update roadmap week progress if roadmapId provided
    if (roadmapId) {
      const roadmap = await roadmapRepository.findById(roadmapId);
      if (roadmap) {
        const activeWeek = roadmap.weeks.find((w) => w.status === 'active');
        if (activeWeek) {
          await roadmapRepository.incrementWeekProgress(roadmapId, activeWeek.weekNumber);
        }
      }
    } else {
      // ROADMAP ↔ PRACTICE MAPPING FIX:
      // Completion came from the Practice page (no roadmapId). Find any roadmap
      // week that contains this question and advance THAT week, so solving in
      // Practice is reflected on the Roadmap automatically (completions are
      // keyed by questionId, so the reverse direction already works).
      try {
        const UserRoadmap = await import('../models/UserRoadmap').then(m => m.default);
        const linkedRoadmap = await UserRoadmap.findOne({
          studentId: oid,
          'weeks.questionIds': qid,
        });
        if (linkedRoadmap) {
          const week = (linkedRoadmap.weeks as { questionIds: mongoose.Types.ObjectId[]; weekNumber: number }[])
            .find((w) => w.questionIds.some((id) => id.equals(qid)));
          if (week) {
            await roadmapRepository.incrementWeekProgress(String(linkedRoadmap._id), week.weekNumber);
          }
        }
      } catch (_mappingErr) {
        // Mapping failure must never block a practice completion
      }
    }

    // B18 FIX: Update streak based on IST date of last activity
    try {
      const profile = await StudentProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (profile) {
        const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const todayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());

        let newStreak = 1; // default: start/reset streak
        if (profile.lastActiveAt) {
          const lastIST = new Date(profile.lastActiveAt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const lastDayIST = new Date(lastIST.getFullYear(), lastIST.getMonth(), lastIST.getDate());
          const diffDays = Math.round((todayIST.getTime() - lastDayIST.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 0) {
            // Solved another question today — keep current streak
            newStreak = profile.currentStreakDays || 1;
          } else if (diffDays === 1) {
            // Solved yesterday → increment streak
            newStreak = (profile.currentStreakDays || 0) + 1;
          } else {
            // Gap > 1 day → streak resets to 1
            newStreak = 1;
          }
        }
        await studentRepository.updateStreak(userId, newStreak);
      }
    } catch (_streakErr) {
      // Streak update failure should never block the completion response
    }

    // B14 FIX: Removed XP persistent notification — XP feedback is toast-only in the UI
    // (previously this created a permanent notification in the bell for every solved question)

    return {
      xpEarned,
      totalXp: 0,
      verifiedViaPlatform,
      unlinkedPlatform,
      platformName,
    }; // totalXp fetched fresh by client
  },

  async uncompleteQuestion(userId: string, questionId: string): Promise<void> {
    const oid = new mongoose.Types.ObjectId(userId);
    const qid = new mongoose.Types.ObjectId(questionId);

    // Find the completion record
    const completion = await QuestionCompletion.findOne({ studentId: oid, questionId: qid });
    if (!completion) return; // already not completed, nothing to do

    const xpToDeduct = completion.xpEarned ?? 0;

    // Remove completion record + deduct XP atomically
    await Promise.all([
      QuestionCompletion.deleteOne({ studentId: oid, questionId: qid }),
      StudentProfile.findOneAndUpdate(
        { userId },
        { $inc: { xpTotal: -xpToDeduct } }
      ),
    ]);

    // If this question was part of a roadmap, decrement doneQuestions
    {
      const UserRoadmap = await import('../models/UserRoadmap').then(m => m.default);
      // Prefer the explicit roadmapId on the completion; otherwise locate the
      // roadmap week containing this question (practice-side completions).
      const rm = completion.roadmapId
        ? await UserRoadmap.findById(completion.roadmapId)
        : await UserRoadmap.findOne({ studentId: oid, 'weeks.questionIds': qid });
      if (rm) {
        // Find the exact week that holds this question; fall back to the active week.
        const qidObj = qid;
        const targetWeek =
          (rm.weeks as any[]).find((w) => w.questionIds?.some((id: any) => id.equals(qidObj))) ??
          rm.weeks.find((w: any) => w.status === 'active' || w.status === 'done');
        if (targetWeek && targetWeek.doneQuestions > 0) {
          targetWeek.doneQuestions -= 1;
          if (targetWeek.status === 'done' && targetWeek.doneQuestions < targetWeek.totalQuestions) {
            targetWeek.status = 'active';
          }
          const totalQ = rm.weeks.reduce((acc: number, w: any) => acc + w.totalQuestions, 0);
          const doneQ = rm.weeks.reduce((acc: number, w: any) => acc + w.doneQuestions, 0);
          rm.pctComplete = totalQ > 0 ? Math.round((doneQ / totalQ) * 100) : 0;
          await rm.save();
        }
      }
    }
  },

  /**
   * Leaderboard. period='this-week'|'this-month' ranks by questions completed in
   * the WINDOW; otherwise by all-time XP.
   *
   * SCALE FIX (10k users): the old monthly path loaded EVERY profile and ran one
   * countDocuments PER STUDENT (~10k queries per view). Both paths are now a
   * single aggregation. Also returns lastActivity + windowScore so the UI can
   * show real columns instead of dead "—" placeholders, and supports server-side
   * `search` (client-side filtering can't find anyone outside the top 100).
   */
  async getLeaderboard(batch?: string, period?: string, search?: string) {
    let sinceDate: Date | undefined;
    if (period === 'this-week') sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'this-month') sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Escape user search input for regex safety
    const escapedSearch = search?.trim()
      ? search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      : undefined;

    interface Row {
      profile: any;
      score?: number;
      lastActivity?: Date;
    }
    let rows: Row[];

    if (sinceDate) {
      // Window leaderboard — ONE aggregation: completions → group → join profiles
      const pipeline: mongoose.PipelineStage[] = [
        { $match: { completedAt: { $gte: sinceDate }, isSeeded: { $ne: true } } },
        { $group: { _id: '$studentId', score: { $sum: 1 }, lastActivity: { $max: '$completedAt' } } },
        { $lookup: { from: 'studentprofiles', localField: '_id', foreignField: 'userId', as: 'profile' } },
        { $unwind: '$profile' },
        ...(batch ? [{ $match: { 'profile.batch': batch } }] : []),
        ...(escapedSearch ? [{ $match: { 'profile.fullName': { $regex: escapedSearch, $options: 'i' } } }] : []),
        { $sort: { score: -1, lastActivity: -1 as const } },
        { $limit: 100 },
      ];
      const agg = await QuestionCompletion.aggregate(pipeline);
      rows = agg.map((r: any) => ({ profile: r.profile, score: r.score, lastActivity: r.lastActivity }));
    } else {
      // All-time XP ranking with optional search — single indexed query
      const filter: Record<string, unknown> = {};
      if (batch) filter.batch = batch;
      if (escapedSearch) filter.fullName = { $regex: escapedSearch, $options: 'i' };
      const profiles = await StudentProfile.find(filter)
        .sort({ xpTotal: -1 })
        .limit(100)
        .lean();
      rows = profiles.map((p) => ({ profile: p }));
    }

    // Batch-fetch doubts + session counts to avoid N+1
    const profileIds = rows.map((r) => r.profile._id.toString());
    const [doubtCounts, sessionCounts] = await Promise.all([
      Promise.all(profileIds.map((id) => doubtRepository.countByStudentIdAndStatus(id))),
      Promise.all(profileIds.map((id) => sessionRepository.countByStudentId(id))),
    ]);

    return rows.map((row, i) => {
      const p = row.profile;
      const nameParts = (p.fullName || '').trim().split(' ');
      const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : (p.fullName?.slice(0, 2) ?? 'ST').toUpperCase();
      return {
        rank: i + 1 as number | string, // '100+' placeholder when the user is outside top-100
        studentId: p.userId.toString(),
        name: p.fullName,
        initials,
        batch: p.batch,
        branch: p.branch,
        xp: p.xpTotal ?? 0,
        // Real metrics for the UI columns:
        windowScore: row.score ?? null,                       // solved within the active window (null on all-time)
        lastActivity: row.lastActivity?.toISOString?.() ?? p.lastActiveAt?.toISOString?.() ?? null,
        tasksCompleted: sessionCounts[i] ?? 0,
        doubtsRaised: doubtCounts[i] ?? 0,
        placementStatus: p.placementStatus,
      };
    });
  },

  /**
   * Topic-wise question completion percentage.
   * BUG-FIX D2: accepts optional companySlugs to scope denominators to the student's roadmap
   * Returns an array like: [{ topic, completed, total, percentage }]
   */
  async getTopicProgress(userId: string, companySlugs?: string[]) {
    // BUG-FIX D2: if student has no roadmap companies, return empty immediately
    if (companySlugs !== undefined && companySlugs.length === 0) return [];

    const studentObjId = new mongoose.Types.ObjectId(userId);
    const slugFilter = companySlugs?.length
      ? [{ $match: { companySlug: { $in: companySlugs } } }]
      : [];

    // Aggregate completions by topic via lookup
    const result = await QuestionCompletion.aggregate([
      // BUG-FIX D2: filter completions to roadmap companies first (no extra DB round-trip)
      ...slugFilter,
      { $match: { studentId: studentObjId, isSeeded: { $ne: true } } },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question',
        },
      },
      { $unwind: '$question' },
      { $unwind: '$question.topics' },
      {
        $group: {
          _id: '$question.topics',
          completed: { $sum: 1 },
        },
      },
    ]);

    // Get total questions per topic — BUG-FIX D2: scoped to roadmap company slugs
    const totals = await QuestionCompletion.db
      .collection('questions')
      .aggregate([
        // BUG-FIX D2: filter to roadmap companies so denominator reflects only assigned questions
        ...(slugFilter.length ? [{ $match: { companySlug: { $in: companySlugs } } }] : []),
        { $unwind: '$topics' },
        { $group: { _id: '$topics', total: { $sum: 1 } } },
      ])
      .toArray();

    const totalMap = new Map<string, number>(
      (totals as { _id: string; total: number }[]).map((t) => [t._id, t.total])
    );

    return result.map((r: { _id: string; completed: number }) => ({
      topic: r._id,
      completed: r.completed,
      total: totalMap.get(r._id) ?? 0,
      percentage:
        totalMap.get(r._id)
          ? Math.round((r.completed / totalMap.get(r._id)!) * 100)
          : 0,
    }));
  },

  async resetOnboarding(userId: string) {
    await studentRepository.updateByUserId(userId, { onboardingComplete: false });
    return { success: true };
  },

  async resetRoadmap(userId: string) {
    await roadmapRepository.deleteByStudentId(userId);
    return { success: true };
  },

  async deleteRoadmap(userId: string, companySlug: string) {
    await roadmapRepository.deleteByStudentAndCompany(userId, companySlug);
    return { success: true };
  },
};
