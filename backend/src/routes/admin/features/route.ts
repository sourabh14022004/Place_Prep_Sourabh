/**
 * dashboard/admin-portal/app/api/admin/features/route.ts
 * GET  /api/admin/features — list every feature flag (seeds missing ones).
 * PUT  /api/admin/features — bulk update { updates: [{ key, enabled }] }.
 *
 * This is the single control point for what is visible in the Student and
 * Faculty portals.
 */

import { z } from 'zod';
import connectDB from '../../../config/db';
import { requireAdmin } from '../../../utils/authMiddleware';
import { featureFlagService, DEFAULT_FEATURES } from '../../../services/featureFlag.service';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../utils/apiError';

const putSchema = z.object({
  updates: z
    .array(
      z.object({
        key: z.string().min(1),
        enabled: z.boolean(),
      })
    )
    .min(1)
    .max(100),
});



export async function GET(request: Request) {
  try {
    await connectDB();
    await requireAdmin(request);
    // RESILIENCE FIX: build the response from the canonical registry merged
    // with stored overrides. Previously a partial/empty feature_flags
    // collection produced an almost-empty admin page ("1/1 ON").
    const features = await featureFlagService.getRegistryState();
    return successResponse({ features, registry: DEFAULT_FEATURES });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json().catch(() => null);
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest('Invalid payload. Expected { updates: [{ key, enabled }] }.', parsed.error.flatten());
    }

    const map = await featureFlagService.setMany(parsed.data.updates);
    return successResponse({ map });
  } catch (error) {
    return handleApiError(error);
  }
}
