import connectDB from '../../../../config/db';
import { requireAdmin } from '../../../../utils/authMiddleware';
import Company from '../../../../models/Company';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError } from '../../../../utils/apiError';

const PATCHABLE_FIELDS = [
  'hiringStatus', 'hiringNote', 'avgSalaryLpa', 'avgProcessWeeks',
  'category', 'tier', 'country', 'logoUrl', 'successRate',
] as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);
    const { slug } = await params;
    const company = await Company.findOne({ slug: slug.toLowerCase() }).lean();
    if (!company) {
      return Response.json({ error: { message: 'Company not found' } }, { status: 404 });
    }
    return successResponse({ company });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);
    const { slug } = await params;

    const body = await request.json() as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    for (const field of PATCHABLE_FIELDS) {
      if (field in body) updates[field] = body[field];
    }

    const company = await Company.findOneAndUpdate(
      { slug: slug.toLowerCase() },
      { $set: updates },
      { new: true, lean: true }
    );
    if (!company) {
      return Response.json({ error: { message: 'Company not found' } }, { status: 404 });
    }
    return successResponse({ company });
  } catch (error) {
    return handleApiError(error);
  }
}
