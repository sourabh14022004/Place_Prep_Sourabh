/**
 * backend/src/models/InterviewExperience.ts
 * Student-submitted interview experiences — primary NST-internal data moat.
 * Admin must verify (isVerified: true) before experience contributes to analytics.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { ExperienceOutcome, Difficulty } from '../types/shared.types';

interface IExperienceRound {
  roundNumber: number;
  type: string;
  topics: string[];
  description: string;
  cleared: boolean;
}

export interface IInterviewExperience extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;  // ref: User
  studentName: string;                  // denormalized
  companyId: mongoose.Types.ObjectId;  // ref: Company
  companySlug: string;                  // denormalized
  companyName: string;                  // denormalized
  role: string;
  interviewDate: Date;
  outcome: ExperienceOutcome;
  overallDifficulty: Difficulty;
  roundsCount: number;
  rounds: IExperienceRound[];
  experienceText: string;
  tips?: string;
  upvoteCount: number;
  upvotedBy: mongoose.Types.ObjectId[]; // array of User._id
  isVerified: boolean;
  source: string;
  isSeeded?: boolean;
  createdAt: Date;
}

const ExperienceRoundSchema = new Schema<IExperienceRound>(
  {
    roundNumber: { type: Number, required: true },
    type: { type: String, required: true },
    topics: { type: [String], default: [] },
    description: { type: String, required: true },
    cleared: { type: Boolean, required: true },
  },
  { _id: false }
);

const InterviewExperienceSchema = new Schema<IInterviewExperience>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName: { type: String, required: true },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    companySlug: { type: String, required: true, index: true },
    companyName: { type: String, required: true },
    role: {
      type: String,
      required: [true, 'Role applied for is required'],
      trim: true,
    },
    interviewDate: {
      type: Date,
      required: [true, 'Interview date is required'],
    },
    outcome: {
      type: String,
      enum: ['offer', 'rejected', 'waiting'],
      required: [true, 'Outcome is required'],
    },
    overallDifficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: [true, 'Overall difficulty is required'],
    },
    roundsCount: {
      type: Number,
      required: true,
      min: 1,
    },
    rounds: { type: [ExperienceRoundSchema], default: [] },
    experienceText: {
      type: String,
      required: [true, 'Experience description is required'],
      minlength: [50, 'Please provide at least 50 characters of experience'],
    },
    tips: { type: String },
    upvoteCount: { type: Number, default: 0, min: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isVerified: { type: Boolean, default: false, index: true },
    source: { type: String, default: 'nst_internal' },
    isSeeded: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'interview_experiences',
  }
);

InterviewExperienceSchema.index({ companySlug: 1, isVerified: 1, createdAt: -1 });
InterviewExperienceSchema.index({ upvoteCount: -1 });

const InterviewExperience: Model<IInterviewExperience> =
  mongoose.models.InterviewExperience ||
  mongoose.model<IInterviewExperience>('InterviewExperience', InterviewExperienceSchema);

export default InterviewExperience;
