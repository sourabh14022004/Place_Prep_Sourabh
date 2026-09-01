/**
 * backend/src/utils/password.ts
 * bcrypt password utilities.
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a stored hash.
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generate a random temporary password.
 * Format: PlacePrep@<6-digit-number>
 */
export function generateTempPassword(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `PlacePrep@${num}`;
}
