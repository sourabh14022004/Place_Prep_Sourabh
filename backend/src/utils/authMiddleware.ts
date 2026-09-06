/**
 * backend/src/utils/authMiddleware.ts
 * JWT cookie validation for API route handlers.
 *
 * Usage in a route:
 *   const user = await requireAuth(request);          // any role
 *   const user = await requireAuth(request, 'admin'); // specific role
 *
 * This used to read the cookie jar via `cookies()` from next/headers, which
 * tied it — and therefore every route that called it — to running inside
 * Next.js. It now parses the Cookie header off the standard Request, so the
 * same function works under the Express server with the callers unchanged.
 */

import { verifyToken } from './jwt';
import { ApiError } from './apiError';
import type { AuthUser, UserRole } from '../types/shared.types';

export const TOKEN_COOKIE_NAME = 'placeprep_token';

// Only write lastSeenAt once per 2 minutes per userId.
//
// Under Next on serverless this Map lived per-lambda, so the debounce leaked
// writes across concurrent instances. On one long-lived server it is a single
// shared map and the debounce actually holds.
const SEEN_DEBOUNCE_MS = 2 * 60 * 1000;
const lastSeenWrittenAt = new Map<string, number>();

/** Parse a Cookie header into a plain record. */
function parseCookies(header: string | null): Record<string, string> {
  const jar: Record<string, string> = {};
  if (!header) return jar;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    if (!key) continue;
    try {
      jar[key] = decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      jar[key] = part.slice(eq + 1).trim();
    }
  }
  return jar;
}

/**
 * Validate the JWT cookie and return the authenticated user.
 * Throws ApiError.unauthorized if no token, ApiError.forbidden if wrong role.
 */
export async function requireAuth(
  request: Request,
  requiredRole?: UserRole
): Promise<AuthUser> {
  const jar = parseCookies(request.headers.get('cookie'));

  // Try the role-specific cookie first when a role is required.
  let token: string | undefined;
  if (requiredRole) {
    token = jar[`${TOKEN_COOKIE_NAME}_${requiredRole}`];
  }

  // Fall back to any role cookie, then the legacy un-suffixed one.
  if (!token) {
    token =
      jar[`${TOKEN_COOKIE_NAME}_student`] ||
      jar[`${TOKEN_COOKIE_NAME}_faculty`] ||
      jar[`${TOKEN_COOKIE_NAME}_admin`] ||
      jar[TOKEN_COOKIE_NAME];
  }

  if (!token) {
    throw ApiError.unauthorized('No authentication token found. Please log in.');
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw ApiError.unauthorized('Invalid or expired session. Please log in again.');
  }

  if (requiredRole && payload.role !== requiredRole) {
    throw ApiError.forbidden(
      `This resource requires ${requiredRole} access. You are logged in as ${payload.role}.`
    );
  }

  // Fire-and-forget lastSeenAt + profile lastActiveAt with per-userId debounce.
  const lastWrittenAt = lastSeenWrittenAt.get(payload.userId) ?? 0;
  if (Date.now() - lastWrittenAt > SEEN_DEBOUNCE_MS) {
    lastSeenWrittenAt.set(payload.userId, Date.now());
    // Update User.lastSeenAt (used by userRepository.getActiveCountByRole)
    import('../models/User').then(({ default: User }) => {
      User.updateOne({ _id: payload.userId }, { $set: { lastSeenAt: new Date() } }).catch(() => {});
    }).catch(() => {});
    // Update profile lastActiveAt — the admin engagement API queries
    // StudentProfile/FacultyProfile.lastActiveAt to compute "online now" counts.
    if (payload.role === 'student') {
      import('../models/StudentProfile').then(({ default: StudentProfile }) => {
        StudentProfile.updateOne({ userId: payload.userId }, { $set: { lastActiveAt: new Date() } }).catch(() => {});
      }).catch(() => {});
    } else if (payload.role === 'faculty') {
      import('../models/FacultyProfile').then(({ default: FacultyProfile }) => {
        FacultyProfile.updateOne({ userId: payload.userId }, { $set: { lastActiveAt: new Date() } }).catch(() => {});
      }).catch(() => {});
    }
  }

  return {
    userId: payload.userId,
    role: payload.role,
    email: payload.email,
  };
}

/**
 * Shortcut guards for specific roles.
 */
export const requireStudent = (req: Request) => requireAuth(req, 'student');
export const requireFaculty = (req: Request) => requireAuth(req, 'faculty');
export const requireAdmin = (req: Request) => requireAuth(req, 'admin');
