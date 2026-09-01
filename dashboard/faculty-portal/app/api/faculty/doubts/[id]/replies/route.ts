/**
 * dashboard/faculty-portal/app/api/faculty/doubts/[id]/replies/route.ts
 * POST /api/faculty/doubts/[id]/replies — faculty replies to a doubt.
 * POST /api/faculty/doubts/[id]/resolve — mark as resolved.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireFaculty } from 'placeprep-backend/src/utils/authMiddleware';
import { facultyService } from 'placeprep-backend/src/services/faculty.service';
import { facultyRepository } from 'placeprep-backend/src/repositories/faculty.repository';
import { addReplySchema } from 'placeprep-backend/src/validators/doubt.validator';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireFaculty(request);
    const { id } = await params;

    const body = await request.json();
    const validation = addReplySchema.safeParse(body);
    if (!validation.success) throw ApiError.badRequest('Reply cannot be empty.');

    // Get faculty name for the reply attribution
    const facultyProfile = await facultyRepository.findByUserId(user.userId);
    const facultyName = facultyProfile?.fullName || user.email;

    const updated = await facultyService.replyToDoubt(
      id,
      user.userId,
      facultyName,
      validation.data.body
    );

    return successResponse(updated, { message: 'Reply posted.' });
  } catch (error) {
    return handleApiError(error);
  }
}
