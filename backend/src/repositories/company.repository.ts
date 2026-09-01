/**
 * backend/src/repositories/company.repository.ts
 */

import Company, { ICompany } from '../models/Company';
import Question from '../models/Question';

// Pipeline stage that joins questions to count per company
// Returns documents with an extra `questionCount` field
//
// NOTE: this pulls every matching question document into `_questions` just to
// take its $size. That is acceptable for the single-document and small-batch
// reads below, but not for the full list — see findAll, which counts questions
// with a separate grouped pass instead.
const withQuestionCount = [
  {
    $lookup: {
      from: 'questions',
      localField: 'slug',
      foreignField: 'companySlug',
      as: '_questions',
    },
  },
  {
    $addFields: {
      questionCount: { $size: '$_questions' },
      topTopic: { $arrayElemAt: ['$topicFrequency.topicName', 0] },
    },
  },
  {
    $project: { _questions: 0 }, // drop the raw join array — not needed
  },
];

/**
 * Fields the company *list* views actually render (grid cards, pickers,
 * autocomplete). Everything else on the document — roundStructure,
 * topicFrequency, roleTopicFrequency — is only needed by the detail page,
 * which goes through findBySlug. Sending those arrays for every company made
 * /api/companies the heaviest endpoint in the portal.
 */
const LIST_PROJECTION = {
  slug: 1,
  name: 1,
  category: 1,
  logoUrl: 1,
  hiringStatus: 1,
  // topTopic is derived here so the caller gets the label without the array.
  topTopic: { $arrayElemAt: ['$topicFrequency.topicName', 0] },
} as const;

export const companyRepository = {
  async findAll(filter?: {
    category?: string;
    hiringStatus?: string;
  }): Promise<(ICompany & { questionCount: number; topTopic?: string })[]> {
    const match: Record<string, unknown> = {};
    if (filter?.category) match.category = filter.category;
    if (filter?.hiringStatus) match.hiringStatus = filter.hiringStatus;

    // Counting via one grouped pass over questions is dramatically cheaper than
    // $lookup-ing every question document per company only to call $size on it.
    const [companies, counts] = await Promise.all([
      Company.aggregate([
        ...(Object.keys(match).length ? [{ $match: match }] : []),
        { $sort: { name: 1 } },
        { $project: LIST_PROJECTION },
      ]),
      Question.aggregate<{ _id: string; count: number }>([
        { $match: { companySlug: { $ne: null } } },
        { $group: { _id: '$companySlug', count: { $sum: 1 } } },
      ]),
    ]);

    const countBySlug = new Map(counts.map(c => [c._id, c.count]));
    return companies.map(c => ({
      ...c,
      questionCount: countBySlug.get(c.slug) ?? 0,
    }));
  },

  async findBySlug(slug: string): Promise<(ICompany & { questionCount: number }) | null> {
    const result = await Company.aggregate([
      { $match: { slug: slug.toLowerCase() } },
      ...withQuestionCount,
      { $limit: 1 },
    ]);
    return result[0] ?? null;
  },

  async findBySlugs(slugs: string[]): Promise<(ICompany & { questionCount: number })[]> {
    return Company.aggregate([
      { $match: { slug: { $in: slugs } } },
      ...withQuestionCount,
    ]);
  },

  async findById(id: string): Promise<ICompany | null> {
    return Company.findById(id).lean<ICompany>();
  },

  async search(query: string): Promise<(ICompany & { questionCount: number })[]> {
    return Company.aggregate([
      { $match: { $text: { $search: query } } },
      { $limit: 20 },
      ...withQuestionCount,
    ]);
  },

  async count(): Promise<number> {
    return Company.countDocuments();
  },

  async create(data: Partial<ICompany>): Promise<ICompany> {
    const company = new Company(data);
    return company.save();
  },

  async deleteAllSeeded(): Promise<void> {
    await Company.deleteMany({ isSeeded: true });
  },

  async findRoundTypes(slug: string): Promise<string[]> {
    const doc = await Company.findOne({ slug: slug.toLowerCase() })
      .select('roundStructure')
      .lean<ICompany>();
    return ((doc?.roundStructure ?? []) as Array<{ roundType?: string }>)
      .map(r => r.roundType ?? '')
      .filter(Boolean);
  },

  async findRoleTopics(slug: string, roleName: string): Promise<Array<{
    topicSlug: string;
    topicName: string;
    frequencyPct: number;
    questionCount: number;
    roundType?: string;
  }>> {
    const company = await Company.findOne({ slug: slug.toLowerCase() })
      .select('roleTopicFrequency topicFrequency')
      .lean<ICompany>();
    if (!company) return [];

    const roleEntry = (company.roleTopicFrequency ?? []).find(r => r.roleName === roleName);
    if (roleEntry?.topics?.length) {
      return roleEntry.topics;
    }

    // Fallback: use flat topicFrequency mapped to the same shape
    return (company.topicFrequency ?? []).map(t => ({
      topicSlug: t.topicSlug,
      topicName: t.topicName,
      frequencyPct: t.frequencyPct,
      questionCount: t.questionCount,
    }));
  },
};
