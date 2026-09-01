/**
 * backend/src/utils/authMiddleware.ts
 * JWT cookie validation for Next.js App Router API routes.
 *
 * Usage in an API route:
 *   const user = await requireAuth(request);          // any role
 *   const user = await requireAuth(request, 'admin'); // specific role
 */

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';
import { ApiError } from './apiError';
import type { AuthUser, UserRole } from '../types/shared.types';

export const TOKEN_COOKIE_NAME = 'placeprep_token';

// Module-level debounce store: only write lastSeenAt once per 2 minutes per userId
// This persists across requests in the same Node.js process instance
const SEEN_DEBOUNCE_MS = 2 * 60 * 1000;
const lastSeenWrittenAt = new Map<string, number>();

/**
 * Validate the JWT cookie and return the authenticated user.
 * Throws ApiError.unauthorized if no token, ApiError.forbidden if wrong role.
 */
export async function requireAuth(
  _request: NextRequest,
  requiredRole?: UserRole
): Promise<AuthUser> {
  const cookieStore = await cookies();
  
  // Try role-specific cookie first if a role is required
  let token = null;
  if (requiredRole) {
    token = cookieStore.get(`${TOKEN_COOKIE_NAME}_${requiredRole}`)?.value;
  }
  
  // Fallback to trying all possible cookies if not found
  if (!token) {
    token = cookieStore.get(`${TOKEN_COOKIE_NAME}_student`)?.value
         || cookieStore.get(`${TOKEN_COOKIE_NAME}_faculty`)?.value
         || cookieStore.get(`${TOKEN_COOKIE_NAME}_admin`)?.value
         || cookieStore.get(TOKEN_COOKIE_NAME)?.value;
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

  // Fire-and-forget lastSeenAt + profile lastActiveAt with per-userId debounce (2-min window)
  const lastWrittenAt = lastSeenWrittenAt.get(payload.userId) ?? 0;
  if (Date.now() - lastWrittenAt > SEEN_DEBOUNCE_MS) {
    lastSeenWrittenAt.set(payload.userId, Date.now());
    // Update User.lastSeenAt (used by userRepository.getActiveCountByRole)
    import('../models/User').then(({ default: User }) => {
      User.updateOne({ _id: payload.userId }, { $set: { lastSeenAt: new Date() } }).catch(() => {});
    }).catch(() => {});
    // Update profile lastActiveAt — admin engagement API queries StudentProfile/FacultyProfile.lastActiveAt
    // to compute "Students Online Now" and "Faculty Online Now" counts.
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
export const requireStudent = (req: NextRequest) => requireAuth(req, 'student');
export const requireFaculty = (req: NextRequest) => requireAuth(req, 'faculty');
export const requireAdmin = (req: NextRequest) => requireAuth(req, 'admin');
