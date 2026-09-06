/**
 * dashboard/student-portal/app/api/progress/route.ts
 * GET /api/progress — topic-wise question completion percentage for the logged-in student.
 * BUG-FIX D2: scoped to the student's roadmap companies so denominators are sane.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../config/db';
import { featureFlagService } from '../../services/featureFlag.service';
import { requireStudent } from '../../utils/authMiddleware';
import { studentService } from '../../services/student.service';
import { roadmapRepository } from '../../repositories/roadmap.repository';
import { successResponse } from '../../utils/apiResponse';
import { handleApiError } from '../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
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
