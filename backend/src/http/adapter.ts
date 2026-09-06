/**
 * backend/src/http/adapter.ts
 * Bridge between Express and the Web Fetch API.
 *
 * The route handlers moved off Next.js unchanged because they were already
 * written against Web standards: `(request: Request, ctx) => Promise<Response>`,
 * reading query strings via `new URL(request.url).searchParams` and bodies via
 * `request.json()`. This module is the only place that knows about Express —
 * it converts an Express request into a Web Request, calls the handler, and
 * writes the returned Web Response back onto the Express response.
 */

import type { Request as ExRequest, Response as ExResponse } from 'express';

/** A route handler: the exact shape the Next App Router used. */
export type WebHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> }
) => Promise<Response> | Response;

/** Build a Web Request from an Express request. */
function toWebRequest(req: ExRequest): Request {
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = req.headers.host ?? 'localhost';
  const url = `${proto}://${host}${req.originalUrl}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  // express.raw() leaves a Buffer on req.body. GET/HEAD must not carry one.
  const method = req.method.toUpperCase();
  const hasBody =
    method !== 'GET' && method !== 'HEAD' && Buffer.isBuffer(req.body) && req.body.length > 0;

  // A Node Buffer is not a valid BodyInit. Copy into a plain Uint8Array: a
  // Buffer's backing store is ArrayBufferLike (it may be pooled or shared),
  // while BodyInit requires one backed by a real ArrayBuffer.
  const body = hasBody ? Uint8Array.from(req.body as Buffer) : undefined;

  return new Request(url, {
    method,
    headers,
    ...(body ? { body } : {}),
  });
}

/** Write a Web Response onto an Express response. */
async function sendWebResponse(webRes: Response, res: ExResponse): Promise<void> {
  res.status(webRes.status);

  // getSetCookie() keeps multiple Set-Cookie headers distinct; iterating
  // Headers would fold them into one comma-joined value and browsers would
  // then drop all but the first cookie.
  const setCookies =
    typeof webRes.headers.getSetCookie === 'function' ? webRes.headers.getSetCookie() : [];
  if (setCookies.length > 0) res.setHeader('Set-Cookie', setCookies);

  webRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') return; // handled above
    res.setHeader(key, value);
  });

  if (!webRes.body) {
    res.end();
    return;
  }
  res.end(Buffer.from(await webRes.arrayBuffer()));
}

/**
 * Wrap a Web handler as an Express handler.
 *
 * Errors are re-thrown to Express's error middleware rather than swallowed, so
 * a thrown ApiError still produces the documented JSON error envelope.
 */
export function toExpress(handler: WebHandler) {
  return async (req: ExRequest, res: ExResponse, next: (err?: unknown) => void): Promise<void> => {
    try {
      const webRes = await handler(toWebRequest(req), {
        params: Promise.resolve(req.params as Record<string, string>),
      });
      await sendWebResponse(webRes, res);
    } catch (err) {
      next(err);
    }
  };
}
