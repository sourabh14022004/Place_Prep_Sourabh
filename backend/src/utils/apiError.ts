/**
 * backend/src/utils/apiError.ts
 * Custom API error class and error response builder.
 * Always returns: { success: false, error: { code, message, details? } }
 */

import { NextResponse } from 'next/server';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    // Restore prototype chain (needed for instanceof checks)
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  // Factory methods for common errors
  static unauthorized(message = 'Unauthorized. Please log in.') {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have permission to access this resource.') {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(resource = 'Resource') {
    return new ApiError(`${resource} not found.`, 404, 'NOT_FOUND');
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(message, 400, 'BAD_REQUEST', details);
  }

  static conflict(message: string) {
    return new ApiError(message, 409, 'CONFLICT');
  }

  static internal(message = 'An unexpected error occurred. Please try again.') {
    return new ApiError(message, 500, 'INTERNAL_ERROR');
  }
}

/**
 * Convert any error to a standard API error response.
 * Use this as the final catch in API route handlers.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details as unknown } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  // Unexpected errors — don't leak internals to client, but DO log to Vercel
  console.error('[UNHANDLED_API_ERROR]', error);
  const isDev = process.env.NODE_ENV !== 'production';
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again.',
        ...(isDev && error instanceof Error ? { details: error.message } : {}),
      },
    },
    { status: 500 }
  );
}

/** @deprecated Alias for handleApiError — use handleApiError in new code */
export const errorResponse = handleApiError;
