/**
 * dashboard/admin-portal/app/api/admin/leaderboard/route.ts
 * GET /api/admin/leaderboard — full XP leaderboard for admin view.
 */

import connectDB from '../../../config/db';
import { requireAdmin } from '../../../utils/authMiddleware';
import { studentService } from '../../../services/student.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const batch = searchParams.get('batch') || undefined;
    const period = searchParams.get('period') || undefined;
    const leaderboard = await studentService.getLeaderboard(batch, period);
    return successResponse(leaderboard);
  } catch (error) {
    return handleApiError(error);
  }
}
