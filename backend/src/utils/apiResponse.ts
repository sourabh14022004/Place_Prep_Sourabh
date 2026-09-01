/**
 * backend/src/utils/apiResponse.ts
 * Standard success/error response shapes for all API endpoints.
 */

import { NextResponse } from 'next/server';
import type { ApiSuccess } from '../types/shared.types';

export function successResponse<T>(
  data: T,
  options?: {
    message?: string;
    status?: number;
    meta?: ApiSuccess<T>['meta'];
  }
): NextResponse {
  const body: ApiSuccess<T> = {
    success: true,
    data,
    ...(options?.message && { message: options.message }),
    ...(options?.meta && { meta: options.meta }),
  };
  return NextResponse.json(body, { status: options?.status ?? 200 });
}

/** Convenience error response — prefer using handleApiError from apiError.ts for full error handling */
export function errorResponse(
  message: string,
  options?: { status?: number; code?: string }
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: options?.code ?? 'ERROR',
        message,
      },
    },
    { status: options?.status ?? 400 }
  );
}
