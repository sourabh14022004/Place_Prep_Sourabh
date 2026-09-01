/**
 * backend/src/models/FacultyProfile.ts
 * (Schema updated via automated documentation pass)
 * Faculty data — 1:1 with User.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { FacultyStatus, DoubtTag } from '../types/shared.types';
import { DOUBT_DOMAINS } from '../types/shared.types';

export interface IFacultyProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // ref: User
  fullName: string;
  initials: string;
  subject: string;
  stream?: string;
  avatarUrl?: string;
  status: FacultyStatus;
  acceptCount: number;
  declineCount: number;
  satisfactionAvg: number;
  responseRate: number;
  isSeeded?: boolean;
  lastActiveAt?: Date;
  employeeId?: string;
  department?: string;
  joinedDate?: string;
  expertises?: string[];
  /**
   * Doubt domains this faculty answers, assigned by an admin.
   * Drives BOTH doubt-list visibility and notification routing.
   * Distinct from `expertises` (free-text CV-style tags, display only) and
   * from `subject` (their primary teaching subject) — this one is a validated
   * enum because routing correctness depends on exact matches.
   */
  doubtDomains: DoubtTag[];
  title?: string;
  experience?: string;
  campus?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FacultyProfileSchema = new Schema<IFacultyProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    initials: {
      type: String,
      required: [true, 'Initials are required'],
      trim: true,
      maxlength: 3,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    stream: { type: String, trim: true },
    avatarUrl: { type: String },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'INVITE_PENDING'],
      default: 'PENDING',
      index: true,
    },
    acceptCount: { type: Number, default: 0, min: 0 },
    declineCount: { type: Number, default: 0, min: 0 },
    satisfactionAvg: { type: Number, default: 0, min: 0, max: 5 },
    responseRate: { type: Number, default: 0, min: 0, max: 100 },
    isSeeded: { type: Boolean, default: false },
    lastActiveAt: { type: Date },
    employeeId: { type: String },
    department: { type: String },
    joinedDate: { type: String },
    expertises: { type: [String], default: [] },
    doubtDomains: {
      type: [String],
      enum: DOUBT_DOMAINS as unknown as string[],
      default: [],
      index: true,
    },
    title: { type: String },
    experience: { type: String },
    campus: { type: String },
  },
  {
    timestamps: true,
    collection: 'faculty_profiles',
  }
);

FacultyProfileSchema.index({ fullName: 'text' });

const FacultyProfile: Model<IFacultyProfile> =
  mongoose.models.FacultyProfile ||
  mongoose.model<IFacultyProfile>('FacultyProfile', FacultyProfileSchema);

export default FacultyProfile;
