/**
 * backend/src/models/QuestionCompletion.ts
 * Tracks which questions a student has solved — source of XP and streak data.
 * Unique per student+question to prevent double XP counting.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestionCompletion extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId; // ref: User
  questionId: mongoose.Types.ObjectId; // ref: Question
  roadmapId?: mongoose.Types.ObjectId; // ref: UserRoadmap (optional)
  /** Denormalized for analytics. Optional: generic-pool questions have no company. */
  companySlug?: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard'; // denormalized
  xpEarned: number;
  isSeeded?: boolean;
  completedAt: Date;
}

const QuestionCompletionSchema = new Schema<IQuestionCompletion>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    roadmapId: {
      type: Schema.Types.ObjectId,
      ref: 'UserRoadmap',
    },
    // FIX: optional — generic-pool questions (aptitude/HR/core-CS) legitimately
    // have companySlug: null, which made every such completion fail validation.
    companySlug: { type: String, default: null },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
      default: 'Medium', // FIX: some scraped docs lack difficulty — don't hard-fail saves
    },
    xpEarned: { type: Number, required: true, min: 0 },
    isSeeded: { type: Boolean, default: false },
    completedAt: { type: Date, default: Date.now },
  },
  {
    collection: 'question_completions',
  }
);

// Prevent double-counting — one completion per student per question
QuestionCompletionSchema.index({ studentId: 1, questionId: 1 }, { unique: true });
QuestionCompletionSchema.index({ studentId: 1, completedAt: -1 });
QuestionCompletionSchema.index({ completedAt: -1 }); // for admin analytics

const QuestionCompletion: Model<IQuestionCompletion> =
  mongoose.models.QuestionCompletion ||
  mongoose.model<IQuestionCompletion>('QuestionCompletion', QuestionCompletionSchema);

export default QuestionCompletion;
