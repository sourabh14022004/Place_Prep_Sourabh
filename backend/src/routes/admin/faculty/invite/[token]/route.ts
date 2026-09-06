/**
 * dashboard/admin-portal/app/api/admin/faculty/invite/[token]/route.ts
 * DELETE /api/admin/faculty/invite/[token] — revoke a pending invite
 */

import connectDB from '../../../../../config/db';
import { requireAdmin } from '../../../../../utils/authMiddleware';
import { inviteService } from '../../../../../services/invite.service';
import { successResponse } from '../../../../../utils/apiResponse';
import { handleApiError } from '../../../../../utils/apiError';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);

    const { token } = await params;
    await inviteService.revokeInvite(token);

    return successResponse({ revoked: true }, { message: 'Invite revoked.' });
  } catch (error) {
    return handleApiError(error);
  }
}
