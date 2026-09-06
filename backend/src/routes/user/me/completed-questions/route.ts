/**
 * dashboard/student-portal/app/api/user/me/completed-questions/route.ts
 * GET /api/user/me/completed-questions
 *
 * Returns all question IDs completed by the current student.
 * Used by roadmap/page.tsx to activate green checkmarks on completed questions.
 *
 * BUG-R9 / BUG-M6 FIX:
 *   roadmap/page.tsx was reading progressData?.completedQuestions but
 *   /api/progress returns [{topic, completed, total, percentage}] — not questionIds.
 *   This new route returns the actual { completedQuestions: [{ questionId }] } shape.
 *
 * FIX: Added dev-mode error logging to expose real MongoDB errors.
 * FIX: Returns empty array (not 500) if no completions found or on non-critical errors.
 */

import connectDB from '../../../../config/db';
import { requireStudent } from '../../../../utils/authMiddleware';
// QuestionCompletion uses `export default` (not named export) — import accordingly
import QuestionCompletion from '../../../../models/QuestionCompletion';
import 'placeprep-backend/src/models/Question'; // Ensure Question model is registered before querying
import { isValidObjectId, toObjectId } from '../../../../utils/objectid';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError } from '../../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    // Validate userId before using it as ObjectId
    if (!user.userId || !isValidObjectId(user.userId)) {
      return successResponse({ completedQuestions: [] });
    }

    let completions: any[] = [];
    try {
      completions = await QuestionCompletion.find({
        studentId: user.userId,
      })
        .select('questionId completedAt')
        .lean();
    } catch (dbErr: any) {
      // Log real error in dev — common cause: wrong MongoDB password or model not registered
      if (process.env.NODE_ENV !== 'production') {
        console.error('[GET /api/user/me/completed-questions] DB query error:', dbErr?.message);
      }
      // Return empty array instead of 500 — page still renders without checkmarks
      return successResponse({ completedQuestions: [] });
    }

    const completedQuestions = completions
      .filter((c: any) => c && c.questionId)
      .map((c: any) => ({
        questionId: c.questionId.toString(),
        completedAt: c.completedAt,
      }));

    return successResponse({ completedQuestions });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[GET /api/user/me/completed-questions] Unhandled error:', error);
    }
    return handleApiError(error);
  }
}
