/**
 * backend/src/services/invite.service.ts
 * Faculty invite flow — token-based invitation without email sending.
 *
 * Flow:
 *   1. Admin calls createInvite(email, fullName, stream)
 *      → creates FacultyInvite with UUID token, expires in 7 days
 *      → returns { inviteUrl } for admin to share manually/via Jira/Slack etc.
 *   2. Faculty opens /invite/[token] in faculty portal
 *      → acceptInvite(token, password) is called
 *      → validates token, creates User + FacultyProfile, marks invite accepted
 */

import { v4 as uuidv4 } from 'uuid';
import FacultyInvite from '../models/FacultyInvite';
import { userRepository } from '../repositories/user.repository';
import { facultyRepository } from '../repositories/faculty.repository';
import { hashPassword } from '../utils/password';
import { ApiError } from '../utils/apiError';
import mongoose from 'mongoose';

const INVITE_EXPIRY_DAYS = 7;

export const inviteService = {
  /**
   * Admin creates a new faculty invite.
   * Returns the invite token and a sharable URL (built from NEXT_PUBLIC_FACULTY_URL env).
   */
  async createInvite(data: {
    email: string;
    fullName: string;
    stream?: string;
    invitedByAdminId: string;
  }) {
    // Check if a user with this email already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw ApiError.conflict(`A user with email ${data.email} already exists.`);
    }

    // Check if an active (non-expired) invite already exists
    const existing = await FacultyInvite.findOne({
      email: data.email.toLowerCase().trim(),
      tokenExpiresAt: { $gt: new Date() },
      acceptedAt: { $exists: false },
    });

    if (existing) {
      // Return the existing invite URL instead of creating a duplicate
      const facultyBaseUrl =
        process.env.NEXT_PUBLIC_FACULTY_URL || 'https://nst-prep-portal-by-pranay-faculty-p-ten.vercel.app';
      return {
        invite: existing,
        inviteUrl: `${facultyBaseUrl}/invite/${existing.token}`,
        isExisting: true,
      };
    }

    const token = uuidv4();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const invite = await FacultyInvite.create({
      email: data.email.toLowerCase().trim(),
      fullName: data.fullName.trim(),
      stream: data.stream?.trim(),
      invitedByAdminId: new mongoose.Types.ObjectId(data.invitedByAdminId),
      token,
      tokenExpiresAt,
    });

    const facultyBaseUrl =
      process.env.NEXT_PUBLIC_FACULTY_URL || 'https://nst-prep-portal-by-pranay-faculty-p-ten.vercel.app';

    return {
      invite,
      inviteUrl: `${facultyBaseUrl}/invite/${token}`,
      isExisting: false,
    };
  },

  /**
   * Validate an invite token — used by faculty portal to verify before showing form.
   */
  async validateToken(token: string) {
    const invite = await FacultyInvite.findOne({ token });
    if (!invite) throw ApiError.notFound('Invite link');
    if (invite.acceptedAt) throw ApiError.badRequest('This invite has already been used.');
    if (invite.tokenExpiresAt < new Date()) {
      throw ApiError.badRequest('This invite link has expired. Ask your admin to resend.');
    }
    return invite;
  },

  /**
   * Faculty accepts invite: set a password and activate their account.
   */
  async acceptInvite(token: string, password: string) {
    const invite = await this.validateToken(token);

    const hashedPassword = await hashPassword(password);

    // Create User account — IUser has no fullName field; that lives on FacultyProfile
    const user = await userRepository.create({
      email: invite.email,
      passwordHash: hashedPassword,
      role: 'faculty',
    });

    // Derive initials from full name (max 2 chars)
    const initials = invite.fullName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Create FacultyProfile — no email field on IFacultyProfile
    await facultyRepository.create({
      userId: user._id as mongoose.Types.ObjectId,
      fullName: invite.fullName,
      initials,
      subject: invite.stream || 'General',
      stream: invite.stream,
    });

    // Mark invite as accepted
    await FacultyInvite.findByIdAndUpdate(invite._id, {
      acceptedAt: new Date(),
    });

    return { email: invite.email, fullName: invite.fullName };
  },

  /**
   * List all invites for admin view (pending + accepted).
   */
  async listInvites(filter?: { accepted?: boolean }) {
    const query: Record<string, unknown> = {};
    if (filter?.accepted === true) query.acceptedAt = { $exists: true };
    if (filter?.accepted === false) query.acceptedAt = { $exists: false };
    return FacultyInvite.find(query).sort({ createdAt: -1 }).limit(200).lean();
  },

  /**
   * Admin revokes a pending invite by token.
   */
  async revokeInvite(token: string) {
    const invite = await FacultyInvite.findOne({ token });
    if (!invite) throw ApiError.notFound('Invite');
    if (invite.acceptedAt) throw ApiError.badRequest('Cannot revoke an already-accepted invite.');
    await FacultyInvite.deleteOne({ _id: invite._id });
  },
};
