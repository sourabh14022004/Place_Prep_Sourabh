import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITopic extends Document {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  category: 'dsa' | 'system_design' | 'core_cs' | 'frontend' | 'backend' | 'hr' | 'aptitude' | 'ml_da';
  parentTopicSlug?: string;
  relevantRoles: string[];
  questionCount: number;
  avgFrequencyScore: number;
  topCompanies: string[];
}

const TopicSchema = new Schema<ITopic>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['dsa', 'system_design', 'core_cs', 'frontend', 'backend', 'hr', 'aptitude', 'ml_da'],
      required: true,
      index: true,
    },
    parentTopicSlug: { type: String },
    relevantRoles: { type: [String], default: [] },
    questionCount: { type: Number, default: 0 },
    avgFrequencyScore: { type: Number, default: 0, min: 0, max: 1 },
    topCompanies: { type: [String], default: [] },
  },
  {
    timestamps: true,
    collection: 'topics',
  }
);

const Topic: Model<ITopic> =
  mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);

export default Topic;
