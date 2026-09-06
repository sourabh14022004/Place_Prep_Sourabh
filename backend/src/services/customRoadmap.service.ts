/**
 * backend/src/services/customRoadmap.service.ts
 * Business rules for faculty/admin-authored roadmaps.
 *
 * Progress is never stored. A student's position in a roadmap is derived by
 * intersecting their QuestionCompletion records with the roadmap's *current*
 * question set. That is what makes live-linked following safe: faculty can add,
 * remove or reorder questions and every follower's percentage stays correct
 * without a migration, because nothing was cached against the old shape.
 */

import mongoose from 'mongoose';
import CustomRoadmap, {
  ICustomRoadmap,
  ICustomRoadmapWeek,
} from '../models/CustomRoadmap';
import QuestionCompletion from '../models/QuestionCompletion';
import Question from '../models/Question';
import { customRoadmapRepository } from '../repositories/customRoadmap.repository';
import { facultyRepository } from '../repositories/faculty.repository';
import { ApiError } from '../utils/apiError';

export interface RoadmapWeekInput {
  weekNumber: number;
  label: string;
  questionIds: string[];
}

export interface WeekProgress {
  weekNumber: number;
  label: string;
  total: number;
  done: number;
  pct: number;
}

export interface RoadmapProgress {
  totalQuestions: number;
  doneQuestions: number;
  pctComplete: number;
  weeks: WeekProgress[];
}

/** "Google + Amazon SDE Sprint" -> "google-amazon-sde-sprint" */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'roadmap';
}

export const customRoadmapService = {
  /**
   * Faculty own what they create; admins can act on anything.
   * Returns silently for the permitted cases and throws otherwise, so callers
   * can treat it as a guard rather than a boolean they might forget to check.
   */
  assertCanEdit(
    roadmap: Pick<ICustomRoadmap, 'createdBy'>,
    user: { userId: string; role: string }
  ): void {
    if (user.role === 'admin') return;
    if (user.role !== 'faculty') {
      throw ApiError.forbidden('Only faculty and admins can manage custom roadmaps.');
    }
    if (roadmap.createdBy.toString() !== user.userId) {
      throw ApiError.forbidden('You can only edit roadmaps you created.');
    }
  },

  /**
   * Display name for the author, denormalized onto the roadmap so listings
   * don't join. Mirrors how auth.service resolves a name: faculty have a
   * profile with a real name, admins do not.
   */
  async resolveAuthorName(userId: string, role: string, fallback: string): Promise<string> {
    if (role === 'admin') return 'Administrator';
    const profile = await facultyRepository.findByUserId(userId);
    return profile?.fullName || fallback;
  },

  /** Unique slug derived from the title, suffixed only on collision. */
  async generateSlug(title: string, exceptId?: string): Promise<string> {
    const base = slugify(title);
    if (!(await customRoadmapRepository.slugExists(base, exceptId))) return base;
    for (let i = 2; i < 100; i++) {
      const candidate = `${base}-${i}`;
      if (!(await customRoadmapRepository.slugExists(candidate, exceptId))) return candidate;
    }
    return `${base}-${Date.now()}`;
  },

  /**
   * Validate that every referenced question exists, and derive the company
   * list from them. Companies are denormalized onto the roadmap for display,
   * so they are computed from the real questions rather than trusted from the
   * client — otherwise a roadmap could advertise a company it has no questions
   * for. Externally-added questions have no company and contribute nothing.
   */
  async resolveQuestions(weeks: RoadmapWeekInput[]): Promise<{
    weeks: ICustomRoadmapWeek[];
    companySlugs: string[];
    companyNames: string[];
  }> {
    const allIds = weeks.flatMap((w) => w.questionIds);
    const invalid = allIds.filter((id) => !mongoose.isValidObjectId(id));
    if (invalid.length > 0) {
      throw ApiError.badRequest(`Invalid question id: ${invalid[0]}`);
    }

    const uniqueIds = [...new Set(allIds)];
    const found = await Question.find({ _id: { $in: uniqueIds } })
      .select('_id companySlug companyName')
      .lean();

    if (found.length !== uniqueIds.length) {
      const foundSet = new Set(found.map((q) => q._id.toString()));
      const missing = uniqueIds.filter((id) => !foundSet.has(id));
      throw ApiError.badRequest(
        `${missing.length} question(s) no longer exist.`,
        { missingQuestionIds: missing.slice(0, 10) }
      );
    }

    const slugs = new Map<string, string>();
    for (const q of found) {
      if (q.companySlug) slugs.set(q.companySlug, q.companyName ?? q.companySlug);
    }

    return {
      weeks: weeks.map((w) => ({
        weekNumber: w.weekNumber,
        label: w.label,
        questionIds: w.questionIds.map((id) => new mongoose.Types.ObjectId(id)),
      })),
      companySlugs: [...slugs.keys()],
      companyNames: [...slugs.values()],
    };
  },

  /**
   * Progress for one student against one roadmap, computed live.
   * A question appearing in two weeks counts in each — the week percentages
   * are what the student sees, and hiding a repeat would make a week look
   * incomplete forever.
   */
  async computeProgress(
    studentId: string,
    roadmap: Pick<ICustomRoadmap, 'weeks'>
  ): Promise<RoadmapProgress> {
    const allIds = roadmap.weeks.flatMap((w) => w.questionIds);
    if (allIds.length === 0) {
      return { totalQuestions: 0, doneQuestions: 0, pctComplete: 0, weeks: [] };
    }

    const completions = await QuestionCompletion.find({
      studentId: new mongoose.Types.ObjectId(studentId),
      questionId: { $in: allIds },
    })
      .select('questionId')
      .lean();

    const done = new Set(completions.map((c) => c.questionId.toString()));

    const weeks: WeekProgress[] = roadmap.weeks.map((w) => {
      const total = w.questionIds.length;
      const d = w.questionIds.filter((id) => done.has(id.toString())).length;
      return {
        weekNumber: w.weekNumber,
        label: w.label,
        total,
        done: d,
        pct: total === 0 ? 0 : Math.round((d / total) * 100),
      };
    });

    // Deduplicated across weeks, so the headline number matches "distinct
    // questions solved" rather than double-counting a repeated question.
    const distinct = new Set(allIds.map((id) => id.toString()));
    const distinctDone = [...distinct].filter((id) => done.has(id)).length;

    return {
      totalQuestions: distinct.size,
      doneQuestions: distinctDone,
      pctComplete: distinct.size === 0 ? 0 : Math.round((distinctDone / distinct.size) * 100),
      weeks,
    };
  },

  /** Full question objects for each week, in the order faculty arranged them. */
  async hydrateWeeks(roadmap: Pick<ICustomRoadmap, 'weeks'>) {
    const allIds = roadmap.weeks.flatMap((w) => w.questionIds);
    if (allIds.length === 0) return [];

    const questions = await Question.find({ _id: { $in: allIds } })
      .select(
        '_id problemSummary difficulty topics questionType isMcq companySlug companyName ' +
        'leetcodeUrl sourceUrl source xpValue'
      )
      .lean();
    const byId = new Map(questions.map((q) => [q._id.toString(), q]));

    return roadmap.weeks.map((w) => ({
      weekNumber: w.weekNumber,
      label: w.label,
      // Preserve the authored order; a question deleted from the bank since
      // authoring simply drops out rather than rendering as a blank row.
      questions: w.questionIds
        .map((id) => byId.get(id.toString()))
        .filter((q): q is NonNullable<typeof q> => Boolean(q)),
    }));
  },

  /**
   * Unpublish. 'retire' keeps existing followers and hides the roadmap from
   * discovery; 'remove' deletes it and every follow. The route surfaces the
   * follower count first so this is never an accident.
   */
  async unpublish(id: string, mode: 'retire' | 'remove'): Promise<{ removedFollows: number }> {
    if (mode === 'retire') {
      await customRoadmapRepository.setStatus(id, 'retired');
      return { removedFollows: 0 };
    }
    const removedFollows = await customRoadmapRepository.deleteAllFollows(id);
    await customRoadmapRepository.deleteById(id);
    return { removedFollows };
  },
};

export default customRoadmapService;
