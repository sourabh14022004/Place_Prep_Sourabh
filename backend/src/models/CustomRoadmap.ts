/**
 * backend/src/models/CustomRoadmap.ts
 * A prep plan authored by faculty or admin, spanning one or more companies.
 *
 * Distinct from UserRoadmap, which is a per-student *instance* generated from
 * that student's self-ratings and unique on (studentId, companyId, roleName).
 * A CustomRoadmap is a single authored artifact that many students follow, so
 * it carries no studentId and no progress of its own.
 *
 * Followers are linked live rather than given a copy: an edit here reaches
 * everyone already following. That is safe for progress because completion is
 * recorded per (studentId, questionId) in QuestionCompletion, not against a
 * position in this document — removing a question drops it from the
 * denominator without anyone losing credit for work already done.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

/** One week of an authored plan. Faculty arranges questions into these by hand. */
export interface ICustomRoadmapWeek {
  weekNumber: number;
  label: string;
  /** Ordered. May mix company questions and company-less external ones. */
  questionIds: mongoose.Types.ObjectId[];
}

export type CustomRoadmapStatus = 'draft' | 'published' | 'retired';

export interface ICustomRoadmap extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description?: string;

  createdBy: mongoose.Types.ObjectId;      // ref: User
  createdByRole: 'faculty' | 'admin';
  createdByName: string;                   // denormalized for listing

  /**
   * 'retired' is the third state the unpublish flow needs: hidden from
   * discovery while existing followers keep it. A plain draft/published
   * boolean could not express that without stranding mid-prep students.
   */
  status: CustomRoadmapStatus;

  /** Companies chosen in step 1. Denormalized for filtering and display. */
  companySlugs: string[];
  companyNames: string[];

  weeks: ICustomRoadmapWeek[];

  /** Denormalized follower count so listings avoid an N+1 count per row. */
  followerCount: number;

  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomRoadmapWeekSchema = new Schema<ICustomRoadmapWeek>(
  {
    weekNumber: { type: Number, required: true, min: 1 },
    label: { type: String, required: true, trim: true },
    questionIds: { type: [Schema.Types.ObjectId], ref: 'Question', default: [] },
  },
  { _id: false }
);

const CustomRoadmapSchema = new Schema<ICustomRoadmap>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 2000 },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdByRole: { type: String, enum: ['faculty', 'admin'], required: true },
    createdByName: { type: String, required: true },

    status: {
      type: String,
      enum: ['draft', 'published', 'retired'],
      default: 'draft',
      index: true,
    },

    companySlugs: { type: [String], default: [], index: true },
    companyNames: { type: [String], default: [] },

    weeks: { type: [CustomRoadmapWeekSchema], default: [] },

    followerCount: { type: Number, default: 0, min: 0 },

    publishedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'custom_roadmaps',
  }
);

// Student discovery lists published roadmaps newest-first.
CustomRoadmapSchema.index({ status: 1, publishedAt: -1 });
// Faculty "my roadmaps" listing.
CustomRoadmapSchema.index({ createdBy: 1, updatedAt: -1 });

const CustomRoadmap: Model<ICustomRoadmap> =
  mongoose.models.CustomRoadmap ||
  mongoose.model<ICustomRoadmap>('CustomRoadmap', CustomRoadmapSchema);

export default CustomRoadmap;
