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
import mongoose from 'mongoose';
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
    // 1 = connected, 2 = connecting; anything else means queries will fail.
    const readyState = mongoose.connection.readyState;
    const dbUp = readyState === 1;
    res.status(dbUp ? 200 : 503).json({
      status: dbUp ? 'ok' : 'degraded',
      db: ['disconnected', 'connected', 'connecting', 'disconnecting'][readyState] ?? 'unknown',
      uptime: process.uptime(),
    });
  });

  // Warm the shared pool at boot, but do not make it a condition of starting.
  //
  // This used to be a bare `await connectDB()`, so an unreachable database took
  // the whole API process down — and because tsx watch survives its child,
  // concurrently's --kill-others never fired and the web server kept proxying
  // into a closed port, burying the real cause under thousands of ECONNREFUSED
  // dumps. Every route calls connectDB() itself and db.ts clears its cached
  // promise on failure, so a later request reconnects on its own once the
  // database is reachable again.
  try {
    await connectDB();
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : err },
      'Could not reach MongoDB at startup — the API is running but every ' +
        'database-backed route will return 503 until it connects. If this is ' +
        'Atlas, the usual cause is that your current IP is not in Network Access.'
    );
  }

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
