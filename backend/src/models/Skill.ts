import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISkill extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  category: 'language' | 'framework' | 'tool';
  demandScore: number;
}

const SkillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    category: {
      type: String,
      enum: ['language', 'framework', 'tool'],
      required: true,
      index: true,
    },
    demandScore: { type: Number, default: 0, min: 0, max: 100 },
  },
  {
    timestamps: true,
    collection: 'skills',
  }
);

const Skill: Model<ISkill> =
  mongoose.models.Skill || mongoose.model<ISkill>('Skill', SkillSchema);

export default Skill;
