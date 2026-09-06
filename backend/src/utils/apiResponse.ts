/**
 * backend/src/utils/apiResponse.ts
 * Standard success/error response shapes for all API endpoints.
 *
 * Returns a standard Web `Response`, not a NextResponse. The route handlers
 * this feeds were already written against Web APIs (`new URL(request.url)`,
 * `request.json()`), so dropping the Next wrapper let them move to the Express
 * server unchanged. `Response.json` is the platform equivalent of
 * `NextResponse.json` and is native in Node 18+.
 */

import type { ApiSuccess } from '../types/shared.types';

export function successResponse<T>(
  data: T,
  options?: {
    message?: string;
    status?: number;
    meta?: ApiSuccess<T>['meta'];
  }
): Response {
  const body: ApiSuccess<T> = {
    success: true,
    data,
    ...(options?.message && { message: options.message }),
    ...(options?.meta && { meta: options.meta }),
  };
  return Response.json(body, { status: options?.status ?? 200 });
}

/** Convenience error response — prefer using handleApiError from apiError.ts for full error handling */
export function errorResponse(
  message: string,
  options?: { status?: number; code?: string }
): Response {
  return Response.json(
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

/**
 * Append a Set-Cookie header to an existing Response.
 *
 * Replaces NextResponse's `response.cookies.set(...)`, which only the login and
 * logout routes used. Returns a new Response because Response headers are
 * immutable once constructed with a body.
 */
export function withCookie(
  response: Response,
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
    maxAge?: number;
    path?: string;
  } = {}
): Response {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.path ?? true) parts.push(`Path=${options.path ?? '/'}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  parts.push(`SameSite=${(options.sameSite ?? 'lax').replace(/^./, (c) => c.toUpperCase())}`);

  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', parts.join('; '));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
