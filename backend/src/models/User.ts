/**
 * backend/src/models/User.ts
 * Root identity record — one document per authenticated user across all portals.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { UserRole } from '../types/shared.types';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  lastSeenAt?: Date; // For DAU/MAU and online tracking
  isSeeded?: boolean; // flag for seed data cleanup
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      required: [true, 'User role is required'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
    lastSeenAt: {
      type: Date,
    },
    isSeeded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Compound index: find active users by role efficiently
UserSchema.index({ role: 1, isActive: 1 });

// Prevent model re-registration during Next.js hot-reloads
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
