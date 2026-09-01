/**
 * backend/src/repositories/user.repository.ts
 * All Mongoose queries for the User collection.
 * Services call this — never call Mongoose directly in services.
 */

import User, { IUser } from '../models/User';
import mongoose from 'mongoose';

export const userRepository = {
  /** Find user by email — includes passwordHash (needed for login) */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim(), isActive: true })
      .select('+passwordHash')
      .lean<IUser>();
  },

  /** Find user by ID — no password */
  async findById(id: string): Promise<IUser | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return User.findById(id).lean<IUser>();
  },

  /** Batch-fetch multiple users by IDs in a SINGLE query — avoids N+1 */
  async findManyByIds(ids: string[]): Promise<IUser[]> {
    if (ids.length === 0) return [];
    const validIds = ids.filter((id) => mongoose.isValidObjectId(id));
    if (validIds.length === 0) return [];
    return User.find({ _id: { $in: validIds } })
      .select('-passwordHash')
      .lean<IUser[]>();
  },

  /** Find user by email — no password */
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() }).lean<IUser>();
  },

  /** Find user with passwordHash by ID (needed for change-password) */
  async findByIdWithPassword(id: string): Promise<IUser | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return User.findById(id).select('+passwordHash').lean<IUser>();
  },

  /** Create a new user */
  async create(data: {
    email: string;
    passwordHash: string;
    role: 'student' | 'faculty' | 'admin';
    isSeeded?: boolean;
  }): Promise<IUser> {
    const user = new User(data);
    return user.save() as unknown as IUser;
  },

  /** Update password hash */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await User.findByIdAndUpdate(id, { passwordHash });
  },

  /** Update email address */
  async updateEmail(id: string, email: string): Promise<void> {
    await User.findByIdAndUpdate(id, { email: email.toLowerCase().trim() });
  },

  /** Update last login timestamp */
  async updateLastLogin(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  },

  /** Soft-delete (deactivate) a user */
  async deactivate(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { isActive: false });
  },

  /** Count users by role */
  async countByRole(role: 'student' | 'faculty' | 'admin'): Promise<number> {
    return User.countDocuments({ role, isActive: true });
  },

  /** Count active users by role within a given timeframe */
  async getActiveCountByRole(role: 'student' | 'faculty' | 'admin', minutes: number): Promise<number> {
    const threshold = new Date(Date.now() - minutes * 60 * 1000);
    return User.countDocuments({ role, isActive: true, lastSeenAt: { $gte: threshold } });
  },

  /** Find all active users, optionally filtered by role */
  async findAllByRole(role?: string): Promise<IUser[]> {
    const filter: Record<string, unknown> = { isActive: true };
    if (role) filter.role = role;
    return User.find(filter).select('-passwordHash').lean<IUser[]>();
  },

  /** Find all active users (all roles) */
  async findAll(): Promise<IUser[]> {
    return User.find({ isActive: true }).select('-passwordHash').lean<IUser[]>();
  },

  /** Activate a user */
  async activate(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { isActive: true });
  },

  /** Delete all seeded users (for seed reset) */
  async deleteAllSeeded(): Promise<void> {
    await User.deleteMany({ isSeeded: true });
  },
};
