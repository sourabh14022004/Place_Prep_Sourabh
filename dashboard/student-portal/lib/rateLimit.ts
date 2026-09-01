/**
 * dashboard/student-portal/lib/rateLimit.ts
 *
 * BUG-S1 FIX: Simple in-memory sliding window rate limiter.
 * Prevents logged-in students from scraping all 20,000 questions
 * by paginating /api/practice or /api/questions without throttle.
 *
 * Usage:
 *   const { ok, retryAfter } = rateLimit(userId, 'practice', 30, 60_000);
 *   if (!ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
 *
 * Limits:
 *   - practice/questions: 30 requests per 60 seconds per user
 *   - Global fallback: 100 requests per 60 seconds per IP
 *
 * NOTE: This is in-memory — resets on server restart. For production
 * use Redis-based rate limiting (upstash/ratelimit). This is sufficient
 * for development and low-traffic staging.
 */

interface RateLimitWindow {
  timestamps: number[];
}

// Key: `${windowName}:${identifier}` → sliding window of request timestamps
const store = new Map<string, RateLimitWindow>();

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, window] of store.entries()) {
    const recent = window.timestamps.filter((t) => now - t < 300_000);
    if (recent.length === 0) {
      store.delete(key);
    } else {
      window.timestamps = recent;
    }
  }
}, 300_000);

/**
 * Check and record a rate limit hit.
 * @param identifier - userId or IP string
 * @param windowName - logical name for the rate limit bucket (e.g. 'practice')
 * @param maxRequests - max allowed requests in the window
 * @param windowMs - sliding window duration in milliseconds
 * @returns { ok: boolean, retryAfter?: number } — retryAfter in seconds
 */
export function rateLimit(
  identifier: string,
  windowName: string,
  maxRequests: number,
  windowMs: number
): { ok: boolean; retryAfter?: number } {
  const key = `${windowName}:${identifier}`;
  const now = Date.now();

  let window = store.get(key);
  if (!window) {
    window = { timestamps: [] };
    store.set(key, window);
  }

  // Remove timestamps outside the sliding window
  window.timestamps = window.timestamps.filter((t) => now - t < windowMs);

  if (window.timestamps.length >= maxRequests) {
    // Oldest timestamp + windowMs = when the window clears
    const oldest = window.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { ok: false, retryAfter };
  }

  window.timestamps.push(now);
  return { ok: true };
}
