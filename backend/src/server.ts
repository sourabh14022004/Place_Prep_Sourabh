/**
 * backend/src/server.ts
 * Entry point for the PlacePrep API server.
 */

import dotenv from 'dotenv';
import { resolve } from 'node:path';

// `dotenv/config` only reads `.env`. The repo keeps secrets in `.env.local`
// (Next's convention, and what .gitignore covers), so load that explicitly
// and fall back to `.env` for deploy targets that inject one.
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });
import { createApp } from './app';
import { logger } from './utils/logger';

const PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);

async function main() {
  const app = await createApp();

  const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, `PlacePrep API listening on http://localhost:${PORT}`);
  });

  // Let in-flight requests finish instead of dropping them on redeploy.
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      logger.info({ signal }, 'shutting down');
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10_000).unref();
    });
  }
}

main().catch((err) => {
  logger.error({ err }, 'failed to start API server');
  process.exit(1);
});
