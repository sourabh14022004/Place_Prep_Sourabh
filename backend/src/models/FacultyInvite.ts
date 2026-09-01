/**
 * backend/src/models/FacultyInvite.ts
 * Tracks admin-initiated faculty invitations before account activation.
 * Supports INVITE_PENDING → ACTIVE status flow.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IFacultyInvite extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  fullName: string;
  stream?: string;
  invitedByAdminId: mongoose.Types.ObjectId;  // ref: User
  token: string;                               // unique UUID token for invite link
  tokenExpiresAt: Date;                        // 7 days from creation
  acceptedAt?: Date;
  isSeeded?: boolean;
  createdAt: Date;
}

const FacultyInviteSchema = new Schema<IFacultyInvite>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    stream: { type: String, trim: true },
    invitedByAdminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
      index: true,
    },
    tokenExpiresAt: {
      type: Date,
      required: true,
      default: () => {
        const d = new Date();
        d.setDate(d.getDate() + 7); // 7 days from now
        return d;
      },
    },
    acceptedAt: { type: Date },
    isSeeded: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'faculty_invites',
  }
);

const FacultyInvite: Model<IFacultyInvite> =
  mongoose.models.FacultyInvite ||
  mongoose.model<IFacultyInvite>('FacultyInvite', FacultyInviteSchema);

export default FacultyInvite;
