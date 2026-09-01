/**
 * dashboard/admin-portal/app/api/admin/faculty/invite/route.ts
 * POST /api/admin/faculty/invite — send a faculty invite link
 * GET  /api/admin/faculty/invite — list all invites
 *
 * Architecture: Route → inviteService → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { inviteService } from 'placeprep-backend/src/services/invite.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';

const createInviteSchema = z.object({
  email:    z.string().email('Valid email required').toLowerCase().trim(),
  fullName: z.string().min(2, 'Full name required').max(100).trim(),
  stream:   z.string().max(100).trim().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const admin = await requireAdmin(request);

    const body = await request.json().catch(() => {
      throw ApiError.badRequest('Invalid JSON body.');
    });

    const parsed = createInviteSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest('Validation failed.', parsed.error.flatten().fieldErrors);
    }

    const result = await inviteService.createInvite({
      ...parsed.data,
      invitedByAdminId: admin.userId,
    });

    return successResponse(
      {
        inviteUrl: result.inviteUrl,
        token:     result.invite.token,
        expiresAt: result.invite.tokenExpiresAt,
        isExisting: result.isExisting,
      },
      {
        message: result.isExisting
          ? 'An active invite for this email already exists. Sharing existing link.'
          : 'Invite created. Share the invite URL with the faculty member.',
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'pending' | 'accepted' | undefined

    const invites = await inviteService.listInvites(
      filter === 'pending'  ? { accepted: false } :
      filter === 'accepted' ? { accepted: true  } :
      undefined
    );

    return successResponse(invites);
  } catch (error) {
    return handleApiError(error);
  }
}
