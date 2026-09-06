/**
 * dashboard/admin-portal/app/api/admin/notifications/send/route.ts
 * POST /api/admin/notifications/send — broadcast notification to target audience.
 *
 * Architecture: Route → Service → Repository → DB
 */

import connectDB from '../../../../config/db';
import { requireAdmin } from '../../../../utils/authMiddleware';
import { adminService } from '../../../../services/admin.service';
import { successResponse } from '../../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../../utils/apiError';
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from '../../../../utils/rateLimiter';

export async function POST(request: Request): Promise<Response> {
  // Rate limit broadcast to prevent accidental spam
  const ip = getClientIp(request);
  const rl = checkRateLimit(`admin:notify:${ip}`, { maxRequests: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return Response.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many notifications sent. Try again in an hour.' } },
      { status: 429 }
    );
  }

  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json();
    const { title, subtitle, iconName, targetAudience = 'students', targetBatch } = body;

    if (!title) throw ApiError.badRequest('Title is required.');

    const { sent } = await adminService.broadcastNotification({
      title,
      subtitle,
      iconName,
      targetAudience,
      targetBatch,
    });

    return successResponse(
      { recipientCount: sent },
      { message: `Notification sent to ${sent} user${sent !== 1 ? 's' : ''}.` }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
