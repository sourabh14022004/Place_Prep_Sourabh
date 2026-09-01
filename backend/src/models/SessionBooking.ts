/**
 * backend/src/models/SessionBooking.ts
 * (Schema updated via automated documentation pass)
 * Student–faculty 1:1 mentorship session bookings.
 * Auto-generates a Jitsi Meet link when status moves to 'confirmed'.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { SessionStatus } from '../types/shared.types';

export interface ISessionBooking extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;   // ref: User
  studentName: string;                   // denormalized
  facultyId: mongoose.Types.ObjectId;   // ref: User
  facultyName: string;                   // denormalized
  topic: string;
  notes?: string;
  requestedDate: string;                 // ISO date string YYYY-MM-DD
  requestedTime: string;                 // HH:mm
  durationMin: number; // BUG-FIX C2: was 30 | 60 — now any integer 15–120
  status: SessionStatus;
  meetLink?: string;                     // Jitsi Meet URL
  proposedDate?: string;
  proposedTime?: string;
  studentFeedbackRating?: number;
  isSeeded?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SessionBookingSchema = new Schema<ISessionBooking>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName: { type: String, required: true },
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    facultyName: { type: String, required: true },
    topic: {
      type: String,
      required: [true, 'Session topic is required'],
      trim: true,
      maxlength: 300,
    },
    notes: { type: String, trim: true },
    requestedDate: {
      type: String,
      required: [true, 'Requested date is required'],
    },
    requestedTime: {
      type: String,
      required: [true, 'Requested time is required'],
    },
    durationMin: {
      type: Number,
      // BUG-FIX C2: allow 15–120 min range (was enum: [30, 60] which MongoDB enforced strictly)
      min: [15, 'Duration must be at least 15 minutes'],
      max: [120, 'Duration cannot exceed 120 minutes'],
      required: [true, 'Please choose a duration'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'proposed', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    meetLink: { type: String },
    proposedDate: { type: String },
    proposedTime: { type: String },
    studentFeedbackRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    isSeeded: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'session_bookings',
  }
);

SessionBookingSchema.index({ facultyId: 1, status: 1 });
SessionBookingSchema.index({ studentId: 1, status: 1 });
SessionBookingSchema.index({ createdAt: -1 }); // admin bookings list

const SessionBooking: Model<ISessionBooking> =
  mongoose.models.SessionBooking ||
  mongoose.model<ISessionBooking>('SessionBooking', SessionBookingSchema);

export default SessionBooking;
