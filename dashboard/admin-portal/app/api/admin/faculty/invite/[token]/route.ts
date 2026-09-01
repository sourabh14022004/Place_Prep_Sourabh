/**
 * dashboard/admin-portal/app/api/admin/faculty/invite/[token]/route.ts
 * DELETE /api/admin/faculty/invite/[token] — revoke a pending invite
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { inviteService } from 'placeprep-backend/src/services/invite.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
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
