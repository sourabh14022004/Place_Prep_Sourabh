/**
 * backend/src/http/fsRouter.ts
 * Mounts the route tree onto Express by walking the filesystem.
 *
 * The routes kept the App Router's directory layout when they moved here, so
 * their URLs are derived from their paths rather than restated in a manifest —
 * there is no second list to drift out of sync with the files:
 *
 *   routes/dashboard/route.ts              -> GET /api/dashboard
 *   routes/questions/[id]/route.ts         -> GET /api/questions/:id
 *   routes/questions/[id]/complete/route.ts-> POST /api/questions/:id/complete
 */

import { Router } from 'express';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { toExpress, type WebHandler } from './adapter';
import { logger } from '../utils/logger';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

/** Recursively collect every route.ts under a directory. */
function findRouteFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) findRouteFiles(full, acc);
    else if (entry === 'route.ts' || entry === 'route.js') acc.push(full);
  }
  return acc;
}

/** "questions/[id]/complete/route.ts" -> "/questions/:id/complete" */
function toExpressPath(routeFile: string, routesRoot: string): string {
  const rel = relative(routesRoot, routeFile);
  const segments = rel.split(sep).slice(0, -1); // drop the route.ts filename
  const mapped = segments.map((s) =>
    s.startsWith('[') && s.endsWith(']') ? `:${s.slice(1, -1)}` : s
  );
  return '/' + mapped.join('/');
}

/**
 * Order routes so a static segment always beats a dynamic one at the same
 * position. Without this, Express matches in registration order and
 * /sessions/book would be captured by /sessions/:id with id="book".
 */
function byStaticFirst(a: string, b: string): number {
  const as = a.split('/').filter(Boolean);
  const bs = b.split('/').filter(Boolean);
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    const x = as[i];
    const y = bs[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const xd = x.startsWith(':');
    const yd = y.startsWith(':');
    if (xd !== yd) return xd ? 1 : -1; // static before dynamic
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

export async function buildRouter(routesRoot: string): Promise<Router> {
  const router = Router();

  const files = findRouteFiles(routesRoot);
  const entries = files
    .map((file) => ({ file, path: toExpressPath(file, routesRoot) }))
    .sort((a, b) => byStaticFirst(a.path, b.path));

  let mounted = 0;
  for (const { file, path } of entries) {
    const mod = (await import(file)) as Record<string, unknown>;
    for (const method of METHODS) {
      const handler = mod[method];
      if (typeof handler !== 'function') continue;
      const verb = method.toLowerCase() as Lowercase<typeof method>;
      router[verb](path, toExpress(handler as WebHandler));
      mounted++;
    }
  }

  logger.info({ routes: entries.length, handlers: mounted }, 'API routes mounted');
  return router;
}
