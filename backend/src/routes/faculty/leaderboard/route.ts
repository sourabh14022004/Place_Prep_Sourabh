/**
 * dashboard/faculty-portal/app/api/faculty/leaderboard/route.ts
 * GET /api/faculty/leaderboard — XP leaderboard (faculty view).
 */

import connectDB from '../../../config/db';
import { featureFlagService } from '../../../services/featureFlag.service';
import { requireFaculty } from '../../../utils/authMiddleware';
import { facultyService } from '../../../services/faculty.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'all';
    const search = searchParams.get('search') || undefined;

    await connectDB();
  await featureFlagService.assertEnabled('faculty.leaderboard');
    await requireFaculty(request);
    const data = await facultyService.getLeaderboard({ timeframe, search });
    return successResponse({ leaderboard: data });
  } catch (error) {
    return handleApiError(error);
  }
}
