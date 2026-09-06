/**
 * backend/src/models/CustomRoadmapFollow.ts
 * Records that a student is following an authored CustomRoadmap.
 *
 * Deliberately holds no progress. Completion already lives in
 * QuestionCompletion keyed by (studentId, questionId), so a student's progress
 * through a roadmap is computed by intersecting their completions with the
 * roadmap's current question set. Storing progress here as well would create a
 * second source of truth that drifts the moment faculty edits the plan.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomRoadmapFollow extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;  // ref: User
  roadmapId: mongoose.Types.ObjectId;  // ref: CustomRoadmap
  startedAt: Date;
  lastActiveAt?: Date;
}

const CustomRoadmapFollowSchema = new Schema<ICustomRoadmapFollow>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roadmapId: { type: Schema.Types.ObjectId, ref: 'CustomRoadmap', required: true, index: true },
    startedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date },
  },
  { collection: 'custom_roadmap_follows' }
);

// A student follows a given roadmap at most once; also the lookup for "am I following?"
CustomRoadmapFollowSchema.index({ studentId: 1, roadmapId: 1 }, { unique: true });

const CustomRoadmapFollow: Model<ICustomRoadmapFollow> =
  mongoose.models.CustomRoadmapFollow ||
  mongoose.model<ICustomRoadmapFollow>('CustomRoadmapFollow', CustomRoadmapFollowSchema);

export default CustomRoadmapFollow;
