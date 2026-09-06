/**
 * dashboard/faculty-portal/app/api/faculty/sessions/route.ts
 * GET /api/faculty/sessions — all session requests for this faculty member.
 */

export const dynamic = 'force-dynamic';

import connectDB from '../../../config/db';
import { featureFlagService } from '../../../services/featureFlag.service';
import { requireFaculty } from '../../../utils/authMiddleware';
import { sessionService } from '../../../services/session.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
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
