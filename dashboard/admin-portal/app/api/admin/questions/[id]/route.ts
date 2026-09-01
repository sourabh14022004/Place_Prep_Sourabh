import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import Question from 'placeprep-backend/src/models/Question';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

const PATCHABLE_FIELDS = [
  'verified', 'difficulty', 'questionType', 'topics', 'targetRoles',
  'roundType', 'problemSummary', 'explanation', 'sampleAnswer',
  'keyPoints', 'hints', 'followUpQuestions', 'manuallyCurated',
  'isHot', 'subTopic', 'sourceUrl', 'leetcodeUrl',
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;
    const question = await Question.findById(id).lean();
    if (!question) {
      return NextResponse.json({ error: { message: 'Question not found' } }, { status: 404 });
    }
    return successResponse({ question });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
      return NextResponse.json({ error: { message: 'Question not found' } }, { status: 404 });
    }
    return successResponse({ question });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return NextResponse.json({ error: { message: 'Question not found' } }, { status: 404 });
    }
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
