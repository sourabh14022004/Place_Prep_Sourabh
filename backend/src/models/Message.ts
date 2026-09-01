/**
 * backend/src/models/Message.ts
 * Direct messages between student and faculty.
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: string; // "<studentId>_<facultyId>"
  senderId: mongoose.Types.ObjectId;
  senderRole: 'student' | 'faculty';
  body: string;
  seen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['student', 'faculty'], required: true },
    body: { type: String, required: true, maxlength: 4000 },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for efficient conversation queries
MessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.Message ||
  mongoose.model<IMessage>('Message', MessageSchema);
