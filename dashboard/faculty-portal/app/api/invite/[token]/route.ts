/**
 * dashboard/faculty-portal/app/api/invite/[token]/route.ts
 * GET  /api/invite/[token] — validate token, return invite metadata
 * POST /api/invite/[token] — accept invite with chosen password, creates User + FacultyProfile
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from 'placeprep-backend/src/config/db';
import { inviteService } from 'placeprep-backend/src/services/invite.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';

const acceptSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const { token } = await params;
    const invite = await inviteService.validateToken(token);

    return successResponse({
      email:    invite.email,
      fullName: invite.fullName,
      stream:   invite.stream,
      expiresAt: invite.tokenExpiresAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const { token } = await params;

    const body = await request.json().catch(() => {
      throw ApiError.badRequest('Invalid JSON body.');
    });

    const parsed = acceptSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest('Validation failed.', parsed.error.flatten().fieldErrors);
    }

    const result = await inviteService.acceptInvite(token, parsed.data.password);

    return successResponse(result, {
      message: 'Account created. You can now log in.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
