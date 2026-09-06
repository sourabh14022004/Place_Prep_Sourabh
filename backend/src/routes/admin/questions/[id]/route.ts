import connectDB from '../../../../config/db';
import { requireAdmin } from '../../../../utils/authMiddleware';
import Question from '../../../../models/Question';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError } from '../../../../utils/apiError';

const PATCHABLE_FIELDS = [
  'verified', 'difficulty', 'questionType', 'topics', 'targetRoles',
  'roundType', 'problemSummary', 'explanation', 'sampleAnswer',
  'keyPoints', 'hints', 'followUpQuestions', 'manuallyCurated',
  'isHot', 'subTopic', 'sourceUrl', 'leetcodeUrl',
] as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;
    const question = await Question.findById(id).lean();
    if (!question) {
      return Response.json({ error: { message: 'Question not found' } }, { status: 404 });
    }
    return successResponse({ question });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;

    const body = await request.json() as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    for (const field of PATCHABLE_FIELDS) {
      if (field in body) updates[field] = body[field];
    }

    const question = await Question.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, lean: true }
    );
    if (!question) {
      return Response.json({ error: { message: 'Question not found' } }, { status: 404 });
    }
    return successResponse({ question });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return Response.json({ error: { message: 'Question not found' } }, { status: 404 });
    }
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
