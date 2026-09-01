/**
 * backend/src/repositories/notification.repository.ts
 */

import Notification, { INotification } from '../models/Notification';
import mongoose from 'mongoose';

export const notificationRepository = {
  async findByUserId(userId: string, limit = 20, types?: string[]): Promise<INotification[]> { // BUG-FIX F1
    return Notification.find({
      userId: new mongoose.Types.ObjectId(userId),
      ...(types?.length ? { type: { $in: types } } : {}), // BUG-FIX F1
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<INotification[]>();
  },

  async markRead(id: string, userId: string): Promise<void> {
    await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: { isRead: true } }
    );
  },

  async markAllRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } }
    );
  },

  async create(data: {
    userId: string;
    type: INotification['type'];
    title: string;
    subtitle?: string;
    iconName?: string;
  }): Promise<INotification> {
    const notification = new Notification({
      ...data,
      userId: new mongoose.Types.ObjectId(data.userId),
    });
    return notification.save();
  },

  /** Bulk insert for admin broadcast notifications */
  async createMany(
    userIds: string[],
    payload: {
      type: INotification['type'];
      title: string;
      subtitle?: string;
      iconName?: string;
    }
  ): Promise<void> {
    const docs = userIds.map((userId) => ({
      userId: new mongoose.Types.ObjectId(userId),
      ...payload,
      isRead: false,
    }));
    await Notification.insertMany(docs, { ordered: false });
  },

  async countUnread(userId: string): Promise<number> {
    return Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });
  },

  /**
   * Check if a doubt-type notification was sent to a user in the last N minutes.
   * Used for deduplication / spam prevention.
   */
  async findRecentDoubtNotif(
    userId: string,
    withinMinutes: number
  ): Promise<INotification | null> {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    return Notification.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      type: 'doubt',
      createdAt: { $gte: cutoff },
    }).lean<INotification>();
  },

  async deleteAllSeeded(): Promise<void> {
    await Notification.deleteMany({ isSeeded: true });
  },
};
