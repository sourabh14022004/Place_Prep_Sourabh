/**
 * dashboard/faculty-portal/app/api/faculty/sessions/[id]/route.ts
 * PATCH /api/faculty/sessions/[id]
 * Body: { action: 'confirm' | 'decline' | 'propose', proposedDate?, proposedTime? }
 */

import connectDB from '../../../../config/db';
import { requireFaculty } from '../../../../utils/authMiddleware';
import { sessionService } from '../../../../services/session.service';
import { proposeSessionSchema } from '../../../../validators/session.validator';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../../utils/apiError';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const user = await requireFaculty(request);
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !['confirm', 'decline', 'propose'].includes(action)) {
      throw ApiError.badRequest('Action must be "confirm", "decline", or "propose".');
    }

    let result;
    if (action === 'confirm') {
      result = await sessionService.confirmSession(id, user.userId);
    } else if (action === 'decline') {
      result = await sessionService.declineSession(id, user.userId);
    } else {
      const validation = proposeSessionSchema.safeParse(body);
      if (!validation.success) {
        throw ApiError.badRequest('Invalid proposal data.', validation.error.flatten().fieldErrors);
      }
      result = await sessionService.proposeAlternative(
        id,
        user.userId,
        validation.data.proposedDate,
        validation.data.proposedTime
      );
    }

    return successResponse(result, {
      message:
        action === 'confirm'
          ? 'Session confirmed. Meet link generated.'
          : action === 'decline'
          ? 'Session declined.'
          : 'Alternative time proposed.',
    });
  } catch (error) {
    const err = error as any;
    require("fs").appendFileSync("/tmp/api-error.log", JSON.stringify({err: err?.message || err, stack: err?.stack}) + "\n");
    return handleApiError(error);
  }
}
