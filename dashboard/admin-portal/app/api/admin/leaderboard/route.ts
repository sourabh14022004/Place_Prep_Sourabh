/**
 * dashboard/admin-portal/app/api/admin/leaderboard/route.ts
 * GET /api/admin/leaderboard — full XP leaderboard for admin view.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { studentService } from 'placeprep-backend/src/services/student.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
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
