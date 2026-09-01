/**
 * dashboard/faculty-portal/app/api/faculty/sessions/route.ts
 * GET /api/faculty/sessions — all session requests for this faculty member.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { featureFlagService } from 'placeprep-backend/src/services/featureFlag.service';
import { requireFaculty } from 'placeprep-backend/src/utils/authMiddleware';
import { sessionService } from 'placeprep-backend/src/services/session.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
  await featureFlagService.assertEnabled('faculty.sessions');
    const user = await requireFaculty(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const sessions = await sessionService.getFacultySessions(user.userId, status);
    return successResponse({ sessions, total: sessions.length });
  } catch (error) {
    return handleApiError(error);
  }
}
