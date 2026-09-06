/**
 * dashboard/faculty-portal/app/api/faculty/doubts/[id]/replies/route.ts
 * POST /api/faculty/doubts/[id]/replies — faculty replies to a doubt.
 * POST /api/faculty/doubts/[id]/resolve — mark as resolved.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../../../config/db';
import { requireFaculty } from '../../../../../utils/authMiddleware';
import { facultyService } from '../../../../../services/faculty.service';
import { facultyRepository } from '../../../../../repositories/faculty.repository';
import { addReplySchema } from '../../../../../validators/doubt.validator';
import { successResponse } from '../../../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../../../utils/apiError';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
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
