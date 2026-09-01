/**
 * backend/src/utils/jwt.ts
 * JWT sign and verify utilities.
 */

import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types/shared.types';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('[PlacePrep Auth] JWT_SECRET is not defined. Set it in .env.local');
  }
  if (secret.length < 32) {
    throw new Error(
      `[PlacePrep Auth] JWT_SECRET is too short (${secret.length} chars). ` +
      'Minimum 32 characters required to prevent token forgery. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }
  return secret;
}

/**
 * Sign a JWT for a given user.
 */
export function signToken(payload: { userId: string; role: string; email: string }): string {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

/**
 * Verify a JWT and return the decoded payload.
 * Returns null if invalid/expired (never throws).
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Decode a JWT without verifying (use only for non-sensitive reads).
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
