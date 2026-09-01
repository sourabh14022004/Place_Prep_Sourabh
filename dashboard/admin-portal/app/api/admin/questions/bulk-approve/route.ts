import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId, toObjectId } from 'placeprep-backend/src/utils/objectid';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import Question from 'placeprep-backend/src/models/Question';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json() as {
      ids?: unknown;
      filter?: unknown;
      verified?: unknown;
    };
    const verified = body.verified !== false;

    // Filter-based path: update all questions matching the filter criteria
    if (body.filter && typeof body.filter === 'object' && !Array.isArray(body.filter)) {
      const f = body.filter as Record<string, string>;
      const query: Record<string, unknown> = {};
      if (f.company) query.companySlug = f.company;
      if (f.difficulty) query.difficulty = f.difficulty;
      if (f.questionType) query.questionType = f.questionType;
      if (f.verified === 'true') query.verified = true;
      if (f.verified === 'false') query.verified = false;

      const result = await Question.updateMany(query, { $set: { verified } });
      return successResponse({ modifiedCount: result.modifiedCount, verified });
    }

    // ID-based path: update specific records by _id
    const ids = Array.isArray(body.ids) ? (body.ids as string[]) : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: { message: 'ids array or filter object required' } }, { status: 400 });
    }
    if (ids.length > 500) {
      return NextResponse.json({ error: { message: 'max 500 ids per batch' } }, { status: 400 });
    }

    const objectIds = ids.map((id) => toObjectId(id));
    const result = await Question.updateMany(
      { _id: { $in: objectIds } },
      { $set: { verified } }
    );

    return successResponse({ modifiedCount: result.modifiedCount, verified });
  } catch (error) {
    return handleApiError(error);
  }
}
