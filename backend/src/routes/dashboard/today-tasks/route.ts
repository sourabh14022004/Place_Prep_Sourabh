/**
 * dashboard/student-portal/app/api/dashboard/today-tasks/route.ts
 * GET /api/dashboard/today-tasks — returns today's pending practice topics
 * from the student's active roadmap's current week.
 */

import connectDB from '../../../config/db';
import { requireStudent } from '../../../utils/authMiddleware';
import { handleApiError } from '../../../utils/apiError';
import { successResponse } from '../../../utils/apiResponse';
import UserRoadmap from '../../../models/UserRoadmap';
import Question from '../../../models/Question';

export async function GET(request: Request): Promise<Response> {
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
