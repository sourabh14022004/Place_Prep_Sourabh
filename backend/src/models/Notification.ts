/**
 * backend/src/models/Notification.ts
 * In-app notification feed for students and faculty.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { NotificationType } from '../types/shared.types';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;  // ref: User
  type: NotificationType;
  title: string;
  subtitle?: string;
  iconName?: string;               // Lucide icon name
  isRead: boolean;
  isSeeded?: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'badge',
        'new_company',
        'roadmap',
        'experience',
        'question',
        'xp',
        'session',
        'doubt',
        'system',
      ],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    subtitle: { type: String, trim: true },
    iconName: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    isSeeded: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'notifications',
  }
);

// Fetch unread notifications quickly
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
