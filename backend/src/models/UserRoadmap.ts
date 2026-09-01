/**
 * backend/src/models/UserRoadmap.ts
 * Student's prep roadmap for a specific company — includes week-by-week plan.
 *
 * BUG-R10 FIX: Added questionIds[] to IRoadmapWeek so we know WHICH specific
 *   questions are assigned to each week (not just how many).
 *   Without this, WeekQuestions can't show the right assigned set.
 *
 * BUG-PR2 FIX: Added lastActive date to UserRoadmap so the Progress page can show
 *   "Last Practiced: 3 days ago" instead of "Just now" for every company.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { WeekStatus } from '../types/shared.types';

interface IRoadmapWeek {
  weekNumber: number;
  topicLabel: string;
  totalQuestions: number;
  doneQuestions: number;
  status: WeekStatus;
  questionIds: mongoose.Types.ObjectId[];
  // --- Phase 1: personalization audit trail ---
  rationaleScore: number; // frequencyPct * (10 - selfRating) / 10
  questionBreakdown: {
    dsa: number;
    aptitude: number;
    coreCs: number;
    hr: number;
  };
}

export interface IUserRoadmap extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId; // ref: User
  companyId: mongoose.Types.ObjectId; // ref: Company
  companySlug: string; // denormalized
  companyName: string; // denormalized
  companyLogoUrl?: string; // denormalized
  roleName: string;
  weeksCommitted: number;
  currentWeek: number;
  pctComplete: number;
  isActive: boolean;
  weeks: IRoadmapWeek[];
  // --- Phase 1: personalization audit trail ---
  selfRatingsSnapshot: Map<string, number>; // ratings at generation time
  lastActive?: Date;
  isSeeded?: boolean;
  addedAt?: Date;
}

const RoadmapWeekSchema = new Schema<IRoadmapWeek>(
  {
    weekNumber: { type: Number, required: true },
    topicLabel: { type: String, required: true },
    totalQuestions: { type: Number, default: 0 },
    doneQuestions: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['done', 'active', 'locked'],
      default: 'locked',
    },
    questionIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Question',
      default: [],
    },
    // --- Phase 1: personalization audit trail per week ---
    rationaleScore: { type: Number, default: 0 },
    questionBreakdown: {
      type: {
        dsa: { type: Number, default: 0 },
        aptitude: { type: Number, default: 0 },
        coreCs: { type: Number, default: 0 },
        hr: { type: Number, default: 0 },
      },
      default: {},
    },
  },
  { _id: false }
);

const UserRoadmapSchema = new Schema<IUserRoadmap>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    companySlug: { type: String, required: true },
    companyName: { type: String, required: true },
    companyLogoUrl: { type: String },
    roleName: { type: String, required: true },
    weeksCommitted: { type: Number, required: true, min: 1, max: 52 },
    currentWeek: { type: Number, default: 1 },
    pctComplete: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    weeks: { type: [RoadmapWeekSchema], default: [] },
    // --- Phase 1: self-ratings at the time this roadmap was generated ---
    selfRatingsSnapshot: { type: Map, of: Number, default: {} },
    lastActive: { type: Date, default: null },
    isSeeded: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now },
  },
  {
    collection: 'user_roadmaps',
  }
);

// One roadmap entry per student per company per role
UserRoadmapSchema.index({ studentId: 1, companyId: 1, roleName: 1 }, { unique: true });
UserRoadmapSchema.index({ studentId: 1, isActive: 1 });

const UserRoadmap: Model<IUserRoadmap> =
  mongoose.models.UserRoadmap ||
  mongoose.model<IUserRoadmap>('UserRoadmap', UserRoadmapSchema);

export default UserRoadmap;
