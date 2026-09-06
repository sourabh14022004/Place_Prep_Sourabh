/**
 * dashboard/admin-portal/app/api/admin/faculty/doubt-domains/route.ts
 * GET /api/admin/faculty/doubt-domains — per-domain faculty coverage.
 *
 * Used by the admin faculty page to show which doubt domains have nobody
 * assigned. Uncovered domains fall back to notifying every faculty member,
 * so a gap here is safe but means routing is not actually happening.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../../config/db';
import { requireAdmin } from '../../../../utils/authMiddleware';
import { adminService } from '../../../../services/admin.service';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError } from '../../../../utils/apiError';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    await requireAdmin(request);
    const coverage = await adminService.getDoubtDomainCoverage();
    return successResponse(coverage);
  } catch (error) {
    return handleApiError(error);
  }
}
