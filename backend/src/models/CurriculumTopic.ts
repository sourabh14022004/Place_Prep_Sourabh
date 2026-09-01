import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICurriculumTopic extends Document {
  _id: mongoose.Types.ObjectId;
  courseName: string;
  semester: number;
  topicSlug: string;
  taughtDepth: number; // 1–5
  hoursAllocated: number;
  lastUpdated: Date;
}

const CurriculumTopicSchema = new Schema<ICurriculumTopic>(
  {
    courseName: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 10 },
    topicSlug: { type: String, required: true, index: true },
    taughtDepth: { type: Number, required: true, min: 1, max: 5 },
    hoursAllocated: { type: Number, required: true, min: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'curriculum_topics',
  }
);

CurriculumTopicSchema.index({ courseName: 1, semester: 1, topicSlug: 1 }, { unique: true });

const CurriculumTopic: Model<ICurriculumTopic> =
  mongoose.models.CurriculumTopic ||
  mongoose.model<ICurriculumTopic>('CurriculumTopic', CurriculumTopicSchema);

export default CurriculumTopic;
