/**
 * dashboard/student-portal/app/api/sessions/[id]/route.ts
 * PATCH /api/sessions/[id]
 * Body: { action: 'accept_proposal' } — student accepts faculty-proposed alternative time
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { sessionService } from 'placeprep-backend/src/services/session.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) throw ApiError.badRequest('Invalid session id.');
    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    if (!action || !['accept_proposal', 'cancel'].includes(action)) {
      throw ApiError.badRequest('Action must be "accept_proposal" or "cancel".');
    }

    let result;
    if (action === 'accept_proposal') {
      // Student accepts the faculty-proposed alternative time — confirm session
      result = await sessionService.acceptProposal(id, user.userId);
    } else {
      result = await sessionService.cancelSession(id, user.userId);
    }

    return successResponse(result, {
      message: action === 'accept_proposal' ? 'Session confirmed.' : 'Session cancelled.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
