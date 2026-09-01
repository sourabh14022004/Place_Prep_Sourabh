/**
 * backend/src/services/auth.service.ts
 * Business logic for authentication — login, logout, change password, create user.
 * Calls repositories only — never touches Mongoose directly.
 */

import { userRepository } from '../repositories/user.repository';
import { studentRepository } from '../repositories/student.repository';
import { facultyRepository } from '../repositories/faculty.repository';
import { comparePassword, hashPassword, generateTempPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import type { CreateUserInput } from '../validators/auth.validator';

// Constant-cost hash used when the email doesn't exist so that valid emails
// and invalid emails take the SAME time to reject (prevents timing-based
// user enumeration: without this, unknown emails skip bcrypt entirely).
const DUMMY_BCRYPT_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8DsAMd4xM8pTn5tS6kZBk4G3wF1G1y';

export const authService = {
  /**
   * Authenticate user with email + password.
   * Returns signed JWT and redirect URL based on role.
   */
  async login(
    email: string,
    password: string
  ): Promise<{
    token: string;
    role: string;
    userId: string;
    name: string;
    redirectUrl: string;
  }> {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      // Burn the same bcrypt cost as a real comparison, THEN throw the generic
      // error — response time is identical for known and unknown emails.
      await comparePassword(password, DUMMY_BCRYPT_HASH).catch(() => {});
      // Use generic message to prevent user enumeration
      throw ApiError.unauthorized('Invalid email or password.');
    }

    if (!user.isActive) {
      throw ApiError.forbidden(
        'Your account has been deactivated. Please contact admin.'
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    // Update last login timestamp (non-blocking)
    userRepository.updateLastLogin(user._id.toString()).catch(() => {});

    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    // Determine name from profile
    let name = user.email;
    if (user.role === 'student') {
      const profile = await studentRepository.findByUserId(user._id.toString());
      if (profile) name = profile.fullName;
    } else if (user.role === 'faculty') {
      const profile = await facultyRepository.findByUserId(user._id.toString());
      if (profile) name = profile.fullName;
    } else {
      name = 'Administrator';
    }

    // Redirect URL per role.
    // Hardcoded production URLs as fallbacks — env vars override in local dev.
    const studentUrl =
      process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL ||
      'https://nst-prep-portal-by-pranay-student-p.vercel.app';
    const facultyUrl =
      process.env.NEXT_PUBLIC_FACULTY_PORTAL_URL ||
      'https://nst-prep-portal-by-pranay-faculty-portal-aanchv5wk.vercel.app';
    const adminUrl =
      process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL ||
      'https://nst-prep-portal-by-pranay-admin-portal-fpdq0kwf2.vercel.app';

    const baseUrls: Record<string, string> = {
      student: studentUrl,
      faculty: facultyUrl,
      admin:   adminUrl,
    };

    const redirectUrl = baseUrls[user.role] || baseUrls.student;

    return {
      token,
      role: user.role,
      userId: user._id.toString(),
      name,
      redirectUrl,
    };
  },

  /**
   * Change a user's password — verifies old password before updating.
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw ApiError.notFound('User');

    const isValid = await comparePassword(oldPassword, user.passwordHash);
    if (!isValid) {
      throw ApiError.badRequest('Current password is incorrect.');
    }

    const newHash = await hashPassword(newPassword);
    await userRepository.updatePassword(userId, newHash);
  },

  /**
   * Admin creates a new user account.
   * Returns the generated temporary password (admin must share with user).
   */
  async createUser(data: CreateUserInput): Promise<{ tempPassword: string; userId: string }> {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw ApiError.conflict(`A user with email ${data.email} already exists.`);
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const user = await userRepository.create({
      email: data.email,
      passwordHash,
      role: data.role,
    });

    const userId = user._id.toString();

    // Create the corresponding profile
    if (data.role === 'student') {
      await studentRepository.create({
        userId: user._id,
        fullName: data.fullName,
        batch: data.batch || '2024',
        branch: data.branch || 'CS & AI',
        year: data.year || '2nd',
        onboardingComplete: false,
        placementStatus: 'IN_PROGRESS',
      } as never);
    } else if (data.role === 'faculty') {
      const initials =
        data.initials ||
        data.fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 3)
          .toUpperCase();

      await facultyRepository.create({
        userId: user._id,
        fullName: data.fullName,
        initials,
        subject: data.subject || 'General',
        stream: data.stream,
        status: 'ACTIVE',
      } as never);
    }

    return { tempPassword, userId };
  },

  /**
   * Admin resets a user's password — returns new temp password.
   */
  async adminResetPassword(userId: string): Promise<{ tempPassword: string }> {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User');

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    await userRepository.updatePassword(userId, passwordHash);

    return { tempPassword };
  },
};
