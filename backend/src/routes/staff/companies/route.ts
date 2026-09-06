/**
 * backend/src/routes/staff/companies/route.ts
 * GET /api/staff/companies — company list for the custom-roadmap builder.
 *
 * Exists because neither existing list was reachable by both staff roles:
 * /api/companies requires a student and /api/admin/companies requires an
 * admin, leaving faculty with no way to pick companies.
 *
 * Query params:
 *   search  substring match on name
 *   limit   default 200, max 1000
 */

import connectDB from '../../../config/db';
import { requireStaff } from '../../../utils/authMiddleware';
import Company from '../../../models/Company';
import Question from '../../../models/Question';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    await requireStaff(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 1000);

    const query: Record<string, unknown> = {};
    if (search) {
      query.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    const companies = await Company.find(query)
      .select('_id name slug logoUrl')
      .sort({ name: 1 })
      .limit(limit)
      .lean();

    // Question counts in one aggregate rather than a query per company —
    // a company with no questions is useless to pick, so the UI needs to
    // show this up front instead of after the pick.
    const counts = await Question.aggregate([
      { $match: { companySlug: { $in: companies.map((c) => c.slug) } } },
      { $group: { _id: '$companySlug', count: { $sum: 1 } } },
    ]);
    const countBySlug = new Map(counts.map((c) => [c._id, c.count]));

    return successResponse({
      companies: companies.map((c) => ({
        slug: c.slug,
        name: c.name,
        logoUrl: c.logoUrl ?? null,
        questionCount: countBySlug.get(c.slug) ?? 0,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
