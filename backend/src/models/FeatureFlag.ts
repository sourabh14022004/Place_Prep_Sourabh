/**
 * backend/src/models/FeatureFlag.ts
 * Central feature-toggle store controlled from the Admin portal.
 *
 * Each flag gates one feature area of the Student or Faculty portal.
 * When `enabled` is false, every surface tied to that key (sidebar links,
 * pages, and API routes) hides or refuses to serve that feature.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type FeaturePortal = 'student' | 'faculty';

export interface IFeatureFlag extends Document {
  _id: mongoose.Types.ObjectId;
  /** Unique machine key, e.g. "student.practice" */
  key: string;
  portal: FeaturePortal;
  /** Human label shown in the Admin toggle UI */
  label: string;
  description?: string;
  /** Display grouping in the Admin UI (e.g. "Learning", "Faculty Connect") */
  group: string;
  enabled: boolean;
  updatedAt: Date;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    portal: { type: String, enum: ['student', 'faculty'], required: true, index: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    group: { type: String, trim: true, default: 'General' },
    enabled: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    collection: 'feature_flags',
  }
);

const FeatureFlag: Model<IFeatureFlag> =
  (mongoose.models.FeatureFlag as Model<IFeatureFlag>) ||
  mongoose.model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);

export default FeatureFlag;
