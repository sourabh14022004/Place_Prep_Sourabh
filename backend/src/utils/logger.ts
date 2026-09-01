/**
 * backend/src/utils/logger.ts
 * Structured logger using pino — replaces all console.log in production.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.info({ userId }, 'User logged in');
 *   logger.error({ err }, 'DB connection failed');
 *
 * In development: pretty-prints with color + timestamps.
 * In production:  outputs JSON lines (compatible with Datadog, Loki, CloudWatch).
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    base: {
      service: 'placeprep-backend',
      env: process.env.NODE_ENV || 'development',
    },
    // Redact sensitive fields from all log lines
    redact: {
      paths: ['password', 'token', 'authorization', '*.password', '*.token', 'cookie'],
      censor: '[REDACTED]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }
);
