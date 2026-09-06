/**
 * backend/src/routes/staff/questions/route.ts
 * POST /api/staff/questions — add an external question (LeetCode etc.)
 *
 * Created without a company, joining the 2,282 company-less questions already
 * in the bank that roadmap.service treats as the shared generic pool. Being
 * real Question documents means completion, XP and search work on them with no
 * extra plumbing — the alternative, embedding them in the roadmap, would have
 * needed a parallel progress system since QuestionCompletion keys on questionId.
 */

import { z } from 'zod';
import connectDB from '../../../config/db';
import { requireStaff } from '../../../utils/authMiddleware';
import Question, { QUESTION_TYPES, TARGET_ROLES } from '../../../models/Question';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../utils/apiError';

const createSchema = z.object({
  problemSummary: z.string().trim().min(3, 'Question title is required').max(500),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  topics: z.array(z.string().trim()).default([]),
  questionType: z.enum(QUESTION_TYPES).default('dsa'),
  roundType: z
    .enum(['Coding', 'System Design', 'HR', 'Aptitude', 'LLD', 'Domain', 'Managerial'])
    .default('Coding'),
  targetRoles: z.array(z.enum(TARGET_ROLES)).default(['SDE-1', 'SDE-2']),
  leetcodeUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  sourceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  source: z.string().trim().max(100).default('external'),
  explanation: z.string().trim().max(5000).optional(),
  hints: z.array(z.string().trim()).default([]),
});

const XP_BY_DIFFICULTY = { Easy: 10, Medium: 25, Hard: 50 } as const;

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStaff(request);

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw ApiError.badRequest('Invalid input.', parsed.error.flatten().fieldErrors);
    }
    const body = parsed.data;

    if (!body.leetcodeUrl && !body.sourceUrl) {
      throw ApiError.badRequest('Provide a practice link (LeetCode URL or source URL).');
    }

    const question = await Question.create({
      // No companyId/companySlug/companyName: this is generic-pool content.
      problemSummary: body.problemSummary,
      difficulty: body.difficulty,
      topics: body.topics,
      questionType: body.questionType,
      roundType: body.roundType,
      targetRoles: body.targetRoles,
      leetcodeUrl: body.leetcodeUrl || undefined,
      sourceUrl: body.sourceUrl || undefined,
      source: body.source,
      explanation: body.explanation,
      hints: body.hints,
      // XP is derived from difficulty everywhere else in the app; matching that
      // here keeps an external question worth the same as an equivalent one.
      xpValue: XP_BY_DIFFICULTY[body.difficulty],
      // Staff-authored, so trusted — but flagged as curated rather than scraped.
      verified: user.role === 'admin',
      manuallyCurated: true,
      isCanonical: true,
    });

    return successResponse(
      {
        question: {
          id: question._id.toString(),
          title: question.problemSummary,
          difficulty: question.difficulty,
          xp: question.xpValue,
        },
      },
      { message: 'Question added.', status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
