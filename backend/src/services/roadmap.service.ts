/**
 * backend/src/services/roadmap.service.ts
 * Unified roadmap week builder — single source of truth for both onboarding
 * and the POST /api/user/me/roadmap route.
 *
 * Phase 2: self-ratings now affect week order via rationaleScore;
 * questionIds are populated from real DB queries per week.
 */

import { companyRepository } from '../repositories/company.repository';
import { questionRepository } from '../repositories/question.repository';
import type mongoose from 'mongoose';

function getRoadmapParams(weeks: number): { questionsPerWeek: number } {
  if (weeks <= 4)  return { questionsPerWeek: 15 };
  if (weeks <= 6)  return { questionsPerWeek: 12 };
  if (weeks <= 8)  return { questionsPerWeek: 10 };
  if (weeks <= 12) return { questionsPerWeek: 7  };
  return             { questionsPerWeek: 5  };
}

export interface RoadmapWeekDraft {
  weekNumber: number;
  topicLabel: string;
  totalQuestions: number;
  doneQuestions: number;
  status: 'active' | 'locked';
  questionIds: mongoose.Types.ObjectId[];
  rationaleScore: number;
  questionBreakdown: { dsa: number; aptitude: number; coreCs: number; hr: number };
  /** 'company' = questions linked to this company; 'generic' = shared null-slug pool */
  poolSource?: 'company' | 'generic';
  /** Difficulty emphasis for this week (derived from the student's level) */
  difficultyFocus?: 'easy' | 'mixed' | 'hard';
}

// Non-Coding round types that have a corresponding null-slug generic pool.
// LLD and Managerial are omitted — no null-slug content exists for them yet.
const GENERIC_ROUND_MAP: Record<string, { questionType: string; label: string }> = {
  'Aptitude':      { questionType: 'aptitude_mcq',  label: 'Aptitude & Verbal' },
  'System Design': { questionType: 'system_design',  label: 'System Design'    },
  'HR':            { questionType: 'hr_behavioral',  label: 'HR Behavioral'    },
  'Domain':        { questionType: 'core_cs_mcq',    label: 'Core CS'          },
};

const DEFAULT_TOPICS = [
  'Arrays', 'Strings', 'Dynamic Programming', 'Trees', 'Graphs',
  'Greedy', 'Binary Search', 'Hash Tables', 'Sorting', 'Two Pointers',
];

export const roadmapService = {
  async buildWeeks(params: {
    companySlug: string;
    targetRole: string;
    prepWeeks: number;
    topicSelfRatings: Record<string, number>;
  }): Promise<RoadmapWeekDraft[]> {
    const { companySlug, targetRole, prepWeeks, topicSelfRatings } = params;
    const { questionsPerWeek } = getRoadmapParams(prepWeeks);

    // ── Student level detection (3-level onboarding maps to ratings 3/6/9) ──
    // Beginner → early weeks emphasise Easy questions to build momentum;
    // Intermediate → pure frequency order; Advanced → later weeks skew Hard.
    const ratingValues = Object.values(topicSelfRatings ?? {});
    const avgRating = ratingValues.length
      ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
      : 5;
    const level: 'beginner' | 'intermediate' | 'advanced' =
      avgRating <= 4.5 ? 'beginner' : avgRating >= 7 ? 'advanced' : 'intermediate';

    /** Difficulty emphasis for a given week index (0-based). */
    const difficultyFocusFor = (weekIdx: number): {
      preference?: 'easy_first' | 'hard_first';
      focus: 'easy' | 'mixed' | 'hard';
    } => {
      if (level === 'beginner') {
        const firstHalf = weekIdx < Math.ceil(prepWeeks / 2);
        return { preference: firstHalf ? 'easy_first' : undefined, focus: firstHalf ? 'easy' : 'mixed' };
      }
      if (level === 'advanced') {
        const secondHalf = weekIdx >= Math.floor(prepWeeks / 2);
        return { preference: secondHalf ? 'hard_first' : undefined, focus: secondHalf ? 'hard' : 'mixed' };
      }
      return { focus: 'mixed' };
    };

    // Get role-specific topics (falls back to flat topicFrequency automatically)
    const roleTopics = await companyRepository.findRoleTopics(companySlug, targetRole);

    // rationaleScore: higher frequency + lower self-rating = higher priority week
    const scored = roleTopics
      .map(t => ({
        ...t,
        rationaleScore: t.frequencyPct * (10 - (topicSelfRatings[t.topicSlug] ?? 5)) / 10,
      }))
      .sort((a, b) => b.rationaleScore - a.rationaleScore);

    const topTopics = scored.slice(0, prepWeeks);
    const topicNames = topTopics.map(t => t.topicName);

    while (topicNames.length < prepWeeks) {
      topicNames.push(DEFAULT_TOPICS[topicNames.length % DEFAULT_TOPICS.length]);
    }

    // Sequential (not parallel) so each week can exclude IDs already assigned to prior weeks.
    // Questions with multiple topics would otherwise appear in more than one week.
    const usedIds = new Set<string>();
    const weeks: RoadmapWeekDraft[] = [];

    for (let i = 0; i < topicNames.length; i++) {
      const topicName = topicNames[i];
      const topicMeta = topTopics[i];
      let questionIds: mongoose.Types.ObjectId[] = [];
      const breakdown = { dsa: 0, aptitude: 0, coreCs: 0, hr: 0 };
      const { preference, focus } = difficultyFocusFor(i);

      try {
        const { questions } = await questionRepository.findMany({
          companySlug,
          topic: topicName,
          excludeIds: [...usedIds],
          limit: questionsPerWeek,
          difficultyPreference: preference,
        });
        questionIds = questions.map(q => q._id as mongoose.Types.ObjectId);
        questionIds.forEach(id => usedIds.add(id.toString()));

        questions.forEach(q => {
          const qt = (q as any).questionType ?? 'dsa';
          if (qt === 'aptitude_mcq') breakdown.aptitude++;
          else if (qt === 'core_cs_mcq') breakdown.coreCs++;
          else if (qt === 'hr_behavioral') breakdown.hr++;
          else breakdown.dsa++;
        });
      } catch {
        // Per-week query failure: leave questionIds empty, fall back to count from meta
      }

      const totalQuestions = questionIds.length > 0
        ? questionIds.length
        : Math.min(Math.max(topicMeta?.questionCount ?? 5, 1), questionsPerWeek);

      weeks.push({
        weekNumber: i + 1,
        topicLabel: topicName,
        totalQuestions,
        doneQuestions: 0,
        status: (i === 0 ? 'active' : 'locked') as 'active' | 'locked',
        questionIds,
        rationaleScore: topicMeta?.rationaleScore ?? 0,
        questionBreakdown: breakdown,
        poolSource: 'company' as const,
        difficultyFocus: focus,
      });
    }

    // Replace low-priority topic weeks with generic-pool weeks for non-Coding rounds
    // (Aptitude, System Design, HR, Domain) that the company actually runs.
    // IMPORTANT: we NEVER exceed prepWeeks — generic weeks slot into the TAIL of the
    // weeks array, replacing the weakest topic weeks so the total stays exactly prepWeeks.
    const companyRoundTypes = await companyRepository.findRoundTypes(companySlug);

    // Collect all applicable generic weeks first (may be fewer than available slots).
    const genericDrafts: RoadmapWeekDraft[] = [];
    for (const [roundType, { questionType, label }] of Object.entries(GENERIC_ROUND_MAP)) {
      if (!companyRoundTypes.includes(roundType)) continue;
      const poolQuestions = await questionRepository.findManyGenericPool({
        questionType,
        limit: questionsPerWeek,
      });
      if (!poolQuestions.length) continue;

      const breakdown = { dsa: 0, aptitude: 0, coreCs: 0, hr: 0 };
      poolQuestions.forEach(q => {
        const qt = (q as any).questionType ?? 'dsa';
        if (qt === 'aptitude_mcq') breakdown.aptitude++;
        else if (qt === 'core_cs_mcq') breakdown.coreCs++;
        else if (qt === 'hr_behavioral') breakdown.hr++;
        else breakdown.dsa++;
      });

      genericDrafts.push({
        weekNumber: 0, // renumbered below
        topicLabel: label,
        totalQuestions: poolQuestions.length,
        doneQuestions: 0,
        status: 'locked',
        questionIds: poolQuestions.map(q => q._id as mongoose.Types.ObjectId),
        rationaleScore: 0,
        questionBreakdown: breakdown,
        poolSource: 'generic',
      });
    }

    // Splice generic weeks into the tail of the weeks array (replace last N topic weeks)
    // so the total never exceeds prepWeeks.
    const slotsForGeneric = Math.min(genericDrafts.length, prepWeeks);
    const topicWeeks = weeks.slice(0, prepWeeks - slotsForGeneric);
    const finalWeeks = [
      ...topicWeeks,
      ...genericDrafts.slice(0, slotsForGeneric),
    ];

    // Re-number all weeks sequentially and mark week-1 active, rest locked.
    finalWeeks.forEach((w, idx) => {
      w.weekNumber = idx + 1;
      w.status = idx === 0 ? 'active' : 'locked';
    });

    return finalWeeks;
  },
};
