/**
 * backend/src/utils/rateLimiter.ts
 * In-memory rate limiter — no Redis required for initial deployment.
 * Uses a sliding window algorithm with automatic cleanup of expired entries.
 * Safe for single-instance Next.js (Vercel serverless functions each have own memory,
 * so this provides per-lambda limiting; add Redis for cross-instance limiting post-V1).
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup interval: remove entries older than 1 hour to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > 60 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000); // run every 5 minutes

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a given key (typically IP + endpoint) is within rate limit.
 * Returns { allowed, remaining, resetAt } — never throws.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > config.windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + config.windowMs,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.windowStart + config.windowMs,
  };
}

// Pre-configured rate limit profiles
export const RATE_LIMITS = {
  /** Failed-login attempts per ACCOUNT: 8 per 15 min — brute-force protection.
   *  SUCCESSFUL logins never consume this budget (buckets reset on success). */
  LOGIN_FAILURES: { maxRequests: 8, windowMs: 15 * 60 * 1000 } satisfies RateLimitConfig,
  /** Requests per IP (all attempts): generous because college NATs share IPs. */
  LOGIN_IP: { maxRequests: 30, windowMs: 15 * 60 * 1000 } satisfies RateLimitConfig,
  /** @deprecated legacy alias kept so older imports don't break */
  LOGIN: { maxRequests: 8, windowMs: 15 * 60 * 1000 } satisfies RateLimitConfig,
  /** Standard API: 120 requests per minute per IP */
  API: { maxRequests: 120, windowMs: 60 * 1000 } satisfies RateLimitConfig,
  /** Write operations: 20 per minute per user */
  WRITE: { maxRequests: 20, windowMs: 60 * 1000 } satisfies RateLimitConfig,
  /** Password change: 3 per hour */
  PASSWORD: { maxRequests: 3, windowMs: 60 * 60 * 1000 } satisfies RateLimitConfig,
} as const;

/**
 * Check the limit WITHOUT consuming an attempt.
 * Login uses this to gate BEFORE auth, then only records a strike when the
 * credentials actually fail — so legitimate users can never lock themselves
 * out by logging in successfully.
 */
export function peekRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now - entry.windowStart > config.windowMs) {
    return { allowed: true, remaining: config.maxRequests, resetAt: now + config.windowMs };
  }
  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + config.windowMs };
  }
  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.windowStart + config.windowMs,
  };
}

/** Clear a bucket — called after a SUCCESSFUL login so wins never cost budget. */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Get the client IP from Next.js request headers.
 *
 * SECURITY: header order matters. `x-forwarded-for` is client-controllable on
 * most proxies, so spoofing it defeats per-IP rate limits. Platform-set headers
 * (x-real-ip / x-vercel-forwarded-for) are trusted first; only fall back to the
 * LAST hop of x-forwarded-for (closest to our infrastructure) when they're
 * absent. Callers doing security-critical limiting (login) should ALSO key on
 * the submitted identifier (e.g. email) so rotating IPs doesn't reset limits.
 */
export function getClientIp(request: { headers: { get: (k: string) => string | null } }): string {
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const vercelForwarded = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwarded) return vercelForwarded.split(',')[0].trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    // Take the last entry — appended by OUR proxy, hardest for clients to forge.
    return parts[parts.length - 1] || 'unknown';
  }
  return 'unknown';
}
