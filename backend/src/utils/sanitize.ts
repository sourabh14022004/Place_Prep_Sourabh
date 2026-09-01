/**
 * backend/src/utils/sanitize.ts
 * Input sanitization to prevent stored XSS attacks.
 * Strips HTML tags and dangerous characters from free-text inputs.
 *
 * Note: We use a simple but effective approach — strip all HTML tags.
 * For V2, integrate DOMPurify (server-side via jsdom) for richer control.
 */

/**
 * Strip HTML tags and dangerous script content from a string.
 * Safe for storage in MongoDB and rendering in React (React auto-escapes on render).
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    // Remove script/style/link/meta tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove all remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove on* event handlers (onclick, onerror, etc)
    .replace(/\bon\w+\s*=/gi, '')
    // Normalize whitespace (collapse multiple spaces/newlines to single)
    .replace(/\s{3,}/g, '\n\n')
    .trim();
}

/**
 * Sanitize a string and enforce max length.
 */
export function sanitizeAndLimit(input: string, maxLength: number): string {
  return sanitizeText(input).slice(0, maxLength);
}

/**
 * Sanitize an object's string fields recursively (1 level deep).
 * Use for sanitizing parsed JSON body before storing to DB.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}
