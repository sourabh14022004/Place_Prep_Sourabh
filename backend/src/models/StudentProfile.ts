/**
 * backend/src/models/StudentProfile.ts
 * (Schema updated via automated documentation pass)
 * Extended student data — 1:1 with User (userId = User._id).
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { PlacementStatus, CompanyCategory } from '../types/shared.types';

export interface IStudentProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // ref: User
  fullName: string;
  batch: string;
  branch: string;
  year: '1st' | '2nd' | '3rd' | '4th';
  avatarUrl?: string;
  onboardingComplete: boolean;
  placementStatus: PlacementStatus;
  placedCompany?: string;
  placedRole?: string;
  bio?: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  xpTotal: number;
  currentStreakDays: number;
  // BUG-PR1 FIX: Track historical best streak (was Math.max(currentStreak, 5) — fake!)
  bestStreakDays: number;
  lastActiveAt?: Date;
  // Onboarding selections
  targetDomains: string[];
  targetCategories: CompanyCategory[];
  topicSelfRatings: Map<string, number>;
  targetCompanySlugs: string[];
  prepWeeksCommitted: number;
  /** Codolio-style daily solve target (questions/day) */
  dailyGoal: number;
  onboardingCompletedAt?: Date;
  questionsCompletedCount?: number;
  doubtsRaisedCount?: number;
  isSeeded?: boolean;
  platformHandles?: {
    leetcode?: string;
    codeforces?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
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
    batch: {
      type: String,
      required: [true, 'Batch is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    year: {
      type: String,
      enum: ['1st', '2nd', '3rd', '4th'],
      required: [true, 'Year is required'],
    },
    avatarUrl: { type: String },
    onboardingComplete: { type: Boolean, default: false },
    placementStatus: {
      type: String,
      enum: ['PLACED', 'IN_PROGRESS', 'INACTIVE'],
      default: 'IN_PROGRESS',
      index: true,
    },
    placedCompany: { type: String },
    placedRole: { type: String },
    bio: { type: String },
    phone: { type: String },
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    xpTotal: { type: Number, default: 0, min: 0 },
    currentStreakDays: { type: Number, default: 0, min: 0 },
    // BUG-PR1 FIX: Track historical best streak so Progress page shows real value
    bestStreakDays: { type: Number, default: 0, min: 0 },
    lastActiveAt: { type: Date },
    // Onboarding
    targetDomains: { type: [String], default: [] },
    targetCategories: { type: [String], default: [] },
    topicSelfRatings: {
      type: Map,
      of: Number,
      default: {},
    },
    targetCompanySlugs: { type: [String], default: [] },
    prepWeeksCommitted: { type: Number, default: 12 },
    dailyGoal: { type: Number, default: 5, min: 1, max: 50 },
    onboardingCompletedAt: { type: Date },
    questionsCompletedCount: { type: Number, default: 0 },
    doubtsRaisedCount: { type: Number, default: 0 },
    isSeeded: { type: Boolean, default: false },
    platformHandles: {
      type: new Schema({
        leetcode:   { type: String, trim: true },
        codeforces: { type: String, trim: true },
      }, { _id: false }),
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'student_profiles',
  }
);

// Performance indexes
StudentProfileSchema.index({ batch: 1, placementStatus: 1 });
StudentProfileSchema.index({ xpTotal: -1 }); // leaderboard queries
StudentProfileSchema.index({ fullName: 'text' }); // search

const StudentProfile: Model<IStudentProfile> =
  mongoose.models.StudentProfile ||
  mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);

export default StudentProfile;
