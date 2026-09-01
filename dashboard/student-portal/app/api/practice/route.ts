/**
 * dashboard/student-portal/app/api/practice/route.ts
 * GET /api/practice — practice zone: questions filtered by topic/difficulty/company.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { featureFlagService } from 'placeprep-backend/src/services/featureFlag.service';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { questionRepository } from 'placeprep-backend/src/repositories/question.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';
import { rateLimit } from '@/lib/rateLimit';

/** Normalize raw DB question → shape the frontend expects */
function normalizeQuestion(q: any) {
  // XP CONSISTENCY FIX: the DB's xpValue is stale/wrong for many records, so
  // Practice used to award "+10 XP" for a Hard question that the Roadmap and
  // Dashboard showed as "+50". Every surface now derives XP from difficulty —
  // the exact formula studentService.completeQuestion uses to grant it.
  const derivedXp = q.difficulty === 'Hard' ? 50 : q.difficulty === 'Medium' ? 25 : 10;
  return {
    _id:              q._id,
    id:               q._id,
    title:            q.problemSummary,
    diff:             q.difficulty,
    difficulty:       q.difficulty,
    xp:               derivedXp,
    xpValue:          derivedXp,
    hot:              q.isHot ?? false,
    isHot:            q.isHot ?? false,
    topic:            Array.isArray(q.topics) ? q.topics[0] : (q.topics ?? ''),
    topics:           q.topics ?? [],
    frequency:        q.frequencyScore != null ? Math.round(q.frequencyScore * 100) : null,
    frequencyScore:   q.frequencyScore ?? 0,
    roundType:        q.roundType,
    questionType:     q.questionType,
    isMcq:            q.isMcq ?? false,
    companySlug:      q.companySlug,
    companyName:      q.companyName,
    sourceUrl:        q.sourceUrl ?? null,
    practiceUrl:      q.leetcodeUrl || q.sourceUrl || null,
    leetcodeUrl:      q.leetcodeUrl || q.sourceUrl || null,
    source:           q.source,
    verified:         q.verified ?? false,
    // Detail fields — all passed through for inline MCQ/answer rendering
    options:          q.options ?? [],
    explanation:      q.explanation ?? null,
    sampleAnswer:     q.sampleAnswer ?? null,
    keyPoints:        q.keyPoints ?? [],
    hints:            q.hints ?? [],
    followUpQuestions: q.followUpQuestions ?? [],
    cautionSource:    q.cautionSource ?? false,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await featureFlagService.assertEnabled('student.practice');
    const user = await requireStudent(request);

    // BUG-S1 FIX: Rate limit — 30 requests per 60s per user
    const rl = rateLimit(user.userId, 'practice', 30, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Retry in ${rl.retryAfter}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawTopic    = searchParams.get('topic')        || undefined;
    const difficulty  = searchParams.get('difficulty')   || undefined;
    const roundType   = searchParams.get('roundType')    || undefined;
    const questionType = searchParams.get('questionType') || undefined;
    const companySlug = searchParams.get('company')      || undefined;
    const isMcqParam  = searchParams.get('isMcq');
    const isMcq       = isMcqParam === 'true' ? true : isMcqParam === 'false' ? false : undefined;
    const page  = Math.max(1, Number(searchParams.get('page'))  || 1);
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);

    // Handle compound topic labels like "Arrays & Strings" from roadmap week names.
    let topic: string | undefined = rawTopic;
    if (rawTopic && rawTopic.includes('&')) {
      topic = undefined;
    }

    let roundTypeQuery: string | string[] | undefined = roundType;
    if (roundType && roundType.includes(',')) {
      roundTypeQuery = roundType.split(',').map(r => r.trim());
    }

    const { questions: rawQuestions, total } = await questionRepository.findMany({
      topic,
      difficulty,
      roundType: roundTypeQuery as any,
      questionType,
      isMcq,
      companySlug,
      page,
      limit,
    });

    // Post-filter for compound topic labels (e.g. "Arrays & Strings" → match "Arrays" OR "Strings")
    let filteredQuestions = rawQuestions;
    let effectiveTotal = total;
    if (rawTopic && rawTopic.includes('&')) {
      const parts = rawTopic.split('&').map(p => p.trim().toLowerCase());
      filteredQuestions = rawQuestions.filter((q: any) =>
        Array.isArray(q.topics) &&
        q.topics.some((t: string) => parts.includes(t.toLowerCase()))
      );
      effectiveTotal = filteredQuestions.length;
    }

    const questions = filteredQuestions.map(normalizeQuestion);

    return successResponse(questions, {
      meta: { page, limit, total: effectiveTotal, totalPages: Math.ceil(effectiveTotal / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
