/**
 * backend/src/repositories/question.repository.ts
 */

import Question, { IQuestion } from '../models/Question';
import mongoose from 'mongoose';

export const questionRepository = {
  async findMany(filter: {
    companySlug?: string;
    companyId?: string;
    topic?: string;
    difficulty?: string;
    roundType?: string;
    questionType?: string;
    isMcq?: boolean;
    minFrequency?: number;  // BUG-R4 FIX: frequency threshold filter
    targetRole?: string;    // Phase 2: filter by role (array-contains match on targetRoles[])
    excludeIds?: string[];  // exclude already-assigned question IDs (prevents cross-week duplicates)
    /**
     * Difficulty ordering hint used by the roadmap builder:
     *   'easy_first' → Easy questions before Medium/Hard (beginners build momentum)
     *   'hard_first' → Hard questions before Easy/Medium (advanced students stay challenged)
     * Frequency score remains the primary sort inside each difficulty band.
     */
    difficultyPreference?: 'easy_first' | 'hard_first';
    page?: number;
    limit?: number;
  }): Promise<{ questions: IQuestion[]; total: number }> {
    const query: Record<string, unknown> = { isDuplicate: { $ne: true }, verified: true };
    if (filter.companySlug) query.companySlug = filter.companySlug;
    if (filter.companyId) query.companyId = new mongoose.Types.ObjectId(filter.companyId);
    if (filter.difficulty) query.difficulty = filter.difficulty;
    if (filter.roundType) {
      if (filter.roundType.includes(',')) {
        query.roundType = { $in: filter.roundType.split(',').map(r => r.trim()) };
      } else {
        query.roundType = filter.roundType;
      }
    }
    if (filter.topic) {
      if (filter.topic.includes('&')) {
        const parts = filter.topic.split('&').map(t => t.trim()).filter(Boolean);
        query.topics = { $in: [filter.topic, ...parts] };
      } else if (filter.topic.includes(',')) {
        const parts = filter.topic.split(',').map(t => t.trim()).filter(Boolean);
        query.topics = { $in: [filter.topic, ...parts] };
      } else {
        query.topics = filter.topic;
      }
    }
    if (filter.questionType) query.questionType = filter.questionType;
    if (filter.isMcq !== undefined) query.isMcq = filter.isMcq;
    if (filter.targetRole) query.targetRoles = filter.targetRole;
    // BUG-R4 FIX: filter by minimum frequency score so low-frequency questions
    // are excluded from roadmap weeks (e.g. minFrequency: 0.4 for 6-week plans)
    if (filter.minFrequency !== undefined) {
      query.frequencyScore = { $gte: filter.minFrequency };
    }
    if (filter.excludeIds?.length) {
      query._id = { $nin: filter.excludeIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    // Alphabetical sort would give Easy < Hard < Medium, so difficulty ordering
    // is applied in JS with an explicit rank. We over-fetch then slice to keep
    // pagination totals untouched.
    const DIFF_RANK: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };
    const wantsDifficultySort = !!filter.difficultyPreference;
    const fetchLimit = wantsDifficultySort ? limit * 6 : limit;

    const [questions, total] = await Promise.all([
      Question.find(query)
        // MCQ-VISIBILITY FIX: inside an MCQ-typed category, interactive quizzes
        // (isMcq:true with options) sort FIRST — otherwise 1600 plain-text docs
        // bury the ~460 real quizzes pages deep.
        .sort(filter.questionType === 'aptitude_mcq' || filter.questionType === 'core_cs_mcq'
          ? { isMcq: -1, frequencyScore: -1, isHot: -1 }
          : { frequencyScore: -1, isHot: -1 })
        .skip(wantsDifficultySort ? 0 : skip)
        .limit(fetchLimit)
        .lean<IQuestion[]>(),
      Question.countDocuments(query),
    ]);

    let result = questions;
    if (wantsDifficultySort) {
      const dir = filter.difficultyPreference === 'easy_first' ? 1 : -1;
      result = [...questions].sort((a, b) => {
        const ra = DIFF_RANK[a.difficulty] ?? 1;
        const rb = DIFF_RANK[b.difficulty] ?? 1;
        return (ra - rb) * dir || (b.frequencyScore ?? 0) - (a.frequencyScore ?? 0);
      }).slice(0, limit);
    }

    return { questions: result, total };
  },

  async findById(id: string): Promise<IQuestion | null> {
    return Question.findById(id).lean<IQuestion>();
  },

  async findByIds(ids: string[]): Promise<IQuestion[]> {
    return Question.find({ _id: { $in: ids } }).lean<IQuestion[]>();
  },

  async countByCompany(companySlug: string): Promise<number> {
    return Question.countDocuments({ companySlug });
  },

  async search(query: string): Promise<IQuestion[]> {
    return Question.find({ $text: { $search: query } })
      .limit(5)
      .lean<IQuestion[]>();
  },

  async create(data: Partial<IQuestion>): Promise<IQuestion> {
    const q = new Question(data);
    return q.save() as unknown as IQuestion;
  },

  /** Find all questions (capped for safety) */
  async findAll(options?: { limit?: number }): Promise<IQuestion[]> {
    return Question.find()
      .limit(options?.limit || 500)
      .lean<IQuestion[]>();
  },

  async deleteAllSeeded(): Promise<void> {
    await Question.deleteMany({ isSeeded: true });
  },

  /**
   * Aggregate verified questions by topic to produce real demand signals.
   * Used by faculty.service.getIndustryTrends() — no fabricated percentages.
   * Sorted by totalFrequency DESC so topics companies weight highly bubble up.
   */
  /**
   * Pull from the shared generic pool (companySlug: null) for a given questionType.
   * Used by roadmap.service to fill non-Coding round weeks (Aptitude, HR, System Design, Core CS).
   */
  async findManyGenericPool({
    questionType,
    limit,
  }: {
    questionType: string;
    limit: number;
  }): Promise<IQuestion[]> {
    return Question.find({
      companySlug: null,
      questionType,
      verified: true,
      isDuplicate: { $ne: true },
    })
      .sort({ frequencyScore: -1 })
      .limit(limit)
      .lean<IQuestion[]>();
  },

  async getTopicDemandSignals(): Promise<Array<{
    topic: string;
    questionCount: number;
    totalFrequency: number;
    companyCount: number;
    hotCount: number;
    companies: string[];
  }>> {
    return Question.aggregate([
      { $match: { verified: true, topics: { $exists: true, $ne: [] } } },
      { $unwind: '$topics' },
      {
        $group: {
          _id:            '$topics',
          questionCount:  { $sum: 1 },
          totalFrequency: { $sum: { $ifNull: ['$frequencyScore', 0] } },
          companySlugs:   { $addToSet: '$companySlug' },
          hotCount:       { $sum: { $cond: ['$isHot', 1, 0] } },
          companyNames:   { $addToSet: '$companyName' },
        },
      },
      {
        $project: {
          topic:         '$_id',
          questionCount: 1,
          totalFrequency: 1,
          companyCount:  { $size: '$companySlugs' },
          hotCount:      1,
          companies: {
            $slice: [
              { $filter: { input: '$companyNames', as: 'n', cond: { $ne: ['$$n', null] } } },
              2,
            ],
          },
        },
      },
      { $match: { questionCount: { $gte: 5 } } },
      { $sort: { totalFrequency: -1, questionCount: -1 } },
      { $limit: 5 },
    ]);
  },
};
