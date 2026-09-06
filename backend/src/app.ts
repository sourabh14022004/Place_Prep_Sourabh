/**
 * backend/src/app.ts
 * Express application — the PlacePrep API server.
 *
 * There is deliberately no CORS layer. The Next app proxies /api/* to this
 * server via a rewrite, so the browser only ever sees its own origin and
 * cookies are same-origin. Adding CORS here would re-create the cross-origin
 * problem the portal merge removed.
 */

import express, { type ErrorRequestHandler } from 'express';
import { join } from 'node:path';
import connectDB from './config/db';
import { buildRouter } from './http/fsRouter';
import { handleApiError } from './utils/apiError';
import { logger } from './utils/logger';

export async function createApp() {
  const app = express();

  app.disable('x-powered-by');

  // The route handlers call request.json() themselves, so the body must reach
  // them unparsed. express.raw gives a Buffer the adapter hands to Request.
  app.use(express.raw({ type: '*/*', limit: '10mb' }));

  // Liveness probe — no DB dependency, so it answers even when Mongo is down.
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // One shared connection pool for the whole process. Under Next on serverless
  // every lambda opened its own; three deployments x maxPoolSize 50 could reach
  // 150 connections against a single cluster.
  await connectDB();

  app.use('/api', await buildRouter(join(__dirname, 'routes')));

  // Unknown /api path -> JSON 404, never HTML.
  app.use('/api', (_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint not found.' },
    });
  });

  // Terminal error handler: renders ApiError through the same envelope the
  // route handlers use, so a thrown error and a returned one look identical.
  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    const webRes = handleApiError(err);
    res.status(webRes.status);
    webRes.headers.forEach((v, k) => res.setHeader(k, v));
    webRes
      .text()
      .then((body) => res.end(body))
      .catch(() => res.end());
  };
  app.use(onError);

  logger.info('Express app ready');
  return app;
}
