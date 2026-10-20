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
    const rawBatch = searchParams.get('batch');
    const batch = rawBatch && rawBatch.toLowerCase() !== 'all' ? rawBatch : undefined;
    const rawPeriod = searchParams.get('period');
    const period = rawPeriod && rawPeriod.toLowerCase() !== 'all-time' ? rawPeriod : undefined;
    const search = searchParams.get('search') || undefined;
    const leaderboard = await studentService.getLeaderboard(batch, period, search);
    return successResponse(leaderboard);
  } catch (error) {
    return handleApiError(error);
  }
}
