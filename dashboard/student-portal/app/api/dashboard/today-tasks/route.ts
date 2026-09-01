/**
 * dashboard/student-portal/app/api/dashboard/today-tasks/route.ts
 * GET /api/dashboard/today-tasks — returns today's pending practice topics
 * from the student's active roadmap's current week.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import UserRoadmap from 'placeprep-backend/src/models/UserRoadmap';
import Question from 'placeprep-backend/src/models/Question';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    // Find the student's active roadmaps
    const roadmaps = await UserRoadmap.find({
      studentId: user.userId,
      isActive: true,
    })
      .sort({ addedAt: -1 })
      .limit(3)
      .lean();

    if (!roadmaps.length) {
      return successResponse({ tasks: [], total: 0 });
    }

    const activeTasks: Array<{
      questionId: string;
      title: string;
      difficulty: string;
      topic: string;
      company: string;
      isCompleted: boolean;
    }> = [];

    for (const roadmap of roadmaps) {
      const { companySlug, weeks = [], currentWeek } = roadmap;

      // Find the current active week
      const activeWeek = weeks.find(
        (w) => w.weekNumber === currentWeek && w.status === 'active'
      ) ?? weeks.find((w) => w.status === 'active');

      if (!activeWeek) continue;

      // Fetch sample questions for this week's topic from Question model
      const questions = await Question.find({
        companySlug,
        topics: activeWeek.topicLabel,
      })
        .select('problemSummary difficulty topics')
        .limit(3)
        .lean();

      if (questions.length > 0) {
        for (const q of questions) {
          activeTasks.push({
            questionId: String(q._id),
            title: q.problemSummary,
            difficulty: q.difficulty,
            topic: q.topics[0] ?? activeWeek.topicLabel,
            company: companySlug,
            isCompleted: false,
          });
        }
      } else {
        // No questions seeded yet — return a placeholder task for the week topic
        activeTasks.push({
          questionId: `${companySlug}-week${activeWeek.weekNumber}`,
          title: `${activeWeek.topicLabel} — Week ${activeWeek.weekNumber}`,
          difficulty: 'Medium',
          topic: activeWeek.topicLabel,
          company: companySlug,
          isCompleted: activeWeek.doneQuestions >= activeWeek.totalQuestions,
        });
      }

      if (activeTasks.length >= 5) break;
    }

    return successResponse({ tasks: activeTasks.slice(0, 5), total: activeTasks.length });
  } catch (error) {
    return handleApiError(error);
  }
}
