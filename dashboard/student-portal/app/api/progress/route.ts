/**
 * dashboard/student-portal/app/api/progress/route.ts
 * GET /api/progress — topic-wise question completion percentage for the logged-in student.
 * BUG-FIX D2: scoped to the student's roadmap companies so denominators are sane.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { featureFlagService } from 'placeprep-backend/src/services/featureFlag.service';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { studentService } from 'placeprep-backend/src/services/student.service';
import { roadmapRepository } from 'placeprep-backend/src/repositories/roadmap.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await featureFlagService.assertEnabled('student.progress');
    const user = await requireStudent(request);

    // BUG-FIX D2: fetch active roadmaps and scope topic progress to those company slugs
    const roadmaps = await roadmapRepository.findByStudentId(user.userId);
    const companySlugs = roadmaps
      .map((r: any) => r.companySlug)
      .filter(Boolean) as string[];

    const progress = await studentService.getTopicProgress(user.userId, companySlugs);
    return successResponse(progress);
  } catch (error) {
    return handleApiError(error);
  }
}
