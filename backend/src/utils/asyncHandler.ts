/**
 * backend/src/utils/asyncHandler.ts
 * Wraps async Next.js API route handlers to eliminate repetitive try/catch.
 * Every handler wrapped here has guaranteed error handling via handleApiError.
 *
 * Usage:
 *   export const GET = asyncHandler(async (req) => {
 *     await connectDB();
 *     const user = await requireStudent(req);
 *     return successResponse(data);
 *   });
 */


import { handleApiError } from './apiError';

type RouteHandler = (
  request: Request,
  context?: { params: Record<string, string> }
) => Promise<Response>;

export function asyncHandler(fn: RouteHandler): RouteHandler {
  return async (request: Request, context?: { params: Record<string, string> }) => {
    try {
      return await fn(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
