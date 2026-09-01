/**
 * dashboard/admin-portal/app/api/admin/overview/route.ts
 * GET /api/admin/overview — platform-wide KPIs.
 *
 * Architecture: Route → Service → Repository → DB
 *
 * NOTE: The previous implementation used a module-level `requestTimestamps[]`
 * array to track requests per minute. This is unreliable in serverless deployments:
 * each cold-start or parallel function instance resets the array independently,
 * producing wildly inaccurate metrics. The field is removed from the response to
 * prevent false data from being shown to admins. For accurate req/min tracking,
 * use a persistent store (Redis, MongoDB time-series, or a dedicated APM tool).
 */

import { NextRequest } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { adminService } from 'placeprep-backend/src/services/admin.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);
    const data = await adminService.getOverview();
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
