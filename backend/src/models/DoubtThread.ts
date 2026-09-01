/**
 * backend/src/models/DoubtThread.ts
 * Student doubt threads with embedded replies — cross-portal (student posts, faculty replies).
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { DoubtTag, DoubtStatus } from '../types/shared.types';

interface IDoubtReply {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: 'student' | 'faculty';
  body: string;
  sentAt: Date;
}

export interface IDoubtThread extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;       // ref: User
  studentName: string;                       // denormalized
  assignedFacultyId?: mongoose.Types.ObjectId; // ref: User
  assignedFacultyName?: string;              // denormalized
  subject: string;
  body: string;
  tag: DoubtTag;
  status: DoubtStatus;
  replies: IDoubtReply[];
  isSeeded?: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

const DoubtReplySchema = new Schema<IDoubtReply>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, enum: ['student', 'faculty'], required: true },
    body: { type: String, required: true, trim: true },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const DoubtThreadSchema = new Schema<IDoubtThread>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName: { type: String, required: true },
    assignedFacultyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedFacultyName: { type: String },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: [true, 'Doubt description is required'],
      trim: true,
    },
    tag: {
      type: String,
      enum: ['DSA', 'System Design', 'LLD', 'HR', 'General', 'Web Development', 'Aptitude'],
      required: [true, 'Tag is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'answered', 'resolved'],
      default: 'pending',
      index: true,
    },
    replies: { type: [DoubtReplySchema], default: [] },
    isSeeded: { type: Boolean, default: false },
    resolvedAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'doubt_threads',
  }
);

DoubtThreadSchema.index({ status: 1, createdAt: -1 });
DoubtThreadSchema.index({ assignedFacultyId: 1, status: 1 });

const DoubtThread: Model<IDoubtThread> =
  mongoose.models.DoubtThread ||
  mongoose.model<IDoubtThread>('DoubtThread', DoubtThreadSchema);

export default DoubtThread;
