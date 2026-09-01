/**
 * dashboard/student-portal/app/api/user/me/roadmap/route.ts
 * GET  /api/user/me/roadmap — student's full roadmap with week-by-week breakdown.
 * POST /api/user/me/roadmap — add a company roadmap for the student.
 *
 * Architecture: Route → Service → Repository → DB
 *
 * FIXES APPLIED:
 *   BUG-R2: questionsPerWeek now scales with preparationWeeks duration
 *   BUG-R4: minFrequency threshold applied — shorter plans show only hottest questions
 *   Section 13 of audit: Full roadmap generation algorithm implemented
 *   FIX: company._id from aggregate wrapped in new ObjectId (was plain object)
 *   FIX: E11000 duplicate key now returns 400 instead of 500
 *   FIX: question query errors are caught per-week and fall back gracefully
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { featureFlagService } from 'placeprep-backend/src/services/featureFlag.service';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { roadmapRepository } from 'placeprep-backend/src/repositories/roadmap.repository';
import { companyRepository } from 'placeprep-backend/src/repositories/company.repository';
import { studentRepository } from 'placeprep-backend/src/repositories/student.repository';
import { roadmapService } from 'placeprep-backend/src/services/roadmap.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from 'placeprep-backend/src/utils/rateLimiter';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await featureFlagService.assertEnabled('student.roadmap');
    const user = await requireStudent(request);
    const roadmaps = await roadmapRepository.findByStudentId(user.userId);
    return successResponse(roadmaps);
  } catch (error) {
    return handleApiError(error);
  }
}


export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit roadmap creation to prevent spam
  const ip = getClientIp(request);
  const rl = checkRateLimit(`roadmap:write:${ip}`, RATE_LIMITS.WRITE);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' } },
      { status: 429 }
    );
  }

  try {
    await connectDB();
    const user = await requireStudent(request);
    const body = await request.json();
    const { companySlug, targetRole, preparationWeeks } = body;

    // Validate required fields
    if (!companySlug || typeof companySlug !== 'string') {
      throw ApiError.badRequest('companySlug is required');
    }

    // Sanitize slug — only lowercase alphanumeric and hyphens
    const safeSlug = companySlug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (safeSlug !== companySlug.toLowerCase()) {
      throw ApiError.badRequest('Invalid companySlug format');
    }

    // Check if already in roadmap (pre-check before hitting DB unique constraint)
    const existing = await roadmapRepository.findByStudentAndCompany(user.userId as any, safeSlug);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Company already in your roadmap' } },
        { status: 400 }
      );
    }

    // Look up the real company to get its _id and display name
    // NOTE: companyRepository.findBySlug uses MongoDB aggregation — returns a plain object,
    // NOT a Mongoose Document. Must wrap _id manually for Mongoose schema.
    const company = await companyRepository.findBySlug(safeSlug);
    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    // FIX: Aggregate returns plain object, string will be auto-cast by Mongoose
    const companyId = (company._id as any).toString();

    const userWeeks = Math.min(Math.max(Number(preparationWeeks) || 12, 4), 52);
    const safeRole = (typeof targetRole === 'string' && targetRole.trim()) ? targetRole.trim() : 'SDE-1';
    const selfRatings = (typeof body.topicSelfRatings === 'object' && body.topicSelfRatings !== null)
      ? body.topicSelfRatings as Record<string, number>
      : {};

    // Persist fresh ratings — merge into StudentProfile without wiping onboarding ratings
    if (Object.keys(selfRatings).length > 0) {
      await studentRepository.mergeTopicRatings(user.userId, selfRatings);
    }

    // Phase 2: unified builder — self-ratings affect order; questionIds populated
    const weeks = await roadmapService.buildWeeks({
      companySlug: safeSlug,
      targetRole: safeRole,
      prepWeeks: userWeeks,
      topicSelfRatings: selfRatings,
    });

    let newRoadmap;
    try {
      newRoadmap = await roadmapRepository.create({
        studentId: user.userId as any,
        companyId: companyId as any,
        companySlug: safeSlug,
        companyName: company.name,
        companyLogoUrl: (company as any).logoUrl || undefined,
        roleName: safeRole,
        weeksCommitted: weeks.length,
        currentWeek: 1,
        pctComplete: 0,
        isActive: true,
        weeks,
      } as any);
    } catch (dbError: any) {
      // FIX: MongoDB duplicate key error (E11000) returns 500 by default — convert to 400
      if (dbError?.code === 11000) {
        return NextResponse.json(
          { success: false, error: { message: 'Company already in your roadmap' } },
          { status: 400 }
        );
      }
      // Log real error in dev so we can see Mongoose validation details
      if (process.env.NODE_ENV !== 'production') {
        console.error('[POST /api/user/me/roadmap] DB save error:', dbError?.message, JSON.stringify(dbError?.errors));
      }
      throw dbError;
    }

    return NextResponse.json(
      successResponse(newRoadmap, { status: 201, message: `${company.name} roadmap created!` } as any),
      { status: 201 }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[POST /api/user/me/roadmap] Unhandled error:', error);
    }
    return handleApiError(error);
  }
}
