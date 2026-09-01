/**
 * backend/src/config/env.ts
 * Single source of truth for all environment variables.
 * Never call process.env outside this file.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[PlacePrep] Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  mongodb: {
    uri: requireEnv('MONGODB_URI'),
  },
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  portals: {
    student: process.env.STUDENT_PORTAL_URL || 'http://localhost:3000',
    faculty: process.env.FACULTY_PORTAL_URL || 'http://localhost:3001',
    admin: process.env.ADMIN_PORTAL_URL || 'http://localhost:3002',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'PlacePrep NST <noreply@placeprep.nst>',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
} as const;
