import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import Company from 'placeprep-backend/src/models/Company';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const category = searchParams.get('category') || '';

    const query: Record<string, unknown> = {};
    if (category) query.category = category;

    const [rawCompanies, total] = await Promise.all([
      Company.find(query)
        .select('name slug category hiringStatus avgSalaryLpa avgProcessWeeks hiringNote isSeeded topicFrequency createdAt')
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Company.countDocuments(query),
    ]);

    const companies = rawCompanies.map((c: any) => {
      const { topicFrequency, ...rest } = c;
      return {
        ...rest,
        questionCount: (topicFrequency ?? []).reduce(
          (s: number, t: any) => s + (t.questionCount ?? 0),
          0
        ),
      };
    });

    return successResponse(
      { companies, total },
      { meta: { page, limit, totalPages: Math.ceil(total / limit) } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json() as Record<string, unknown>;
    const { name, category, country, hiringStatus, avgSalaryLpa, avgProcessWeeks, hiringNote, logoUrl } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: { message: 'name and category are required' } },
        { status: 400 }
      );
    }

    const slug = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const company = await Company.create({
      name,
      slug,
      category,
      country: country || 'India',
      hiringStatus: hiringStatus || 'Active Hiring',
      avgSalaryLpa,
      avgProcessWeeks,
      hiringNote,
      logoUrl,
    });

    return successResponse({ company });
  } catch (error) {
    return handleApiError(error);
  }
}
