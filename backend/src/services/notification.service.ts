/**
 * backend/src/services/notification.service.ts
 * Business logic for notification operations.
 * Calls repositories only — never touches Mongoose directly.
 */

import { notificationRepository } from '../repositories/notification.repository';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/apiError';
import { sanitizeAndLimit } from '../utils/sanitize';
import type { INotification } from '../models/Notification';

export const notificationService = {
  /**
   * Get the 20 most recent notifications for a user.
   */
  async getUserNotifications(userId: string, types?: string[]): Promise<INotification[]> { // BUG-FIX F1
    return notificationRepository.findByUserId(userId, 20, types); // BUG-FIX F1
  },

  /**
   * Mark a single notification as read.
   * Validates that the notification belongs to this user.
   */
  async markRead(notificationId: string, userId: string): Promise<void> {
    await notificationRepository.markRead(notificationId, userId);
  },

  /**
   * Mark all notifications as read for a user.
   */
  async markAllRead(userId: string): Promise<void> {
    await notificationRepository.markAllRead(userId);
  },

  /**
   * Admin: broadcast notification to a target audience.
   * Validates input, fetches target user IDs, bulk-inserts notifications.
   */
  async broadcast(
    adminId: string,
    data: {
      title: string;
      subtitle?: string;
      targetAudience: 'students' | 'faculty' | 'all';
    }
  ): Promise<{ sent: number }> {
    const sanitizedTitle = sanitizeAndLimit(data.title, 200);
    const sanitizedSubtitle = data.subtitle ? sanitizeAndLimit(data.subtitle, 500) : undefined;

    if (!sanitizedTitle) throw ApiError.badRequest('Notification title cannot be empty.');

    let roleFilter: string | undefined;
    if (data.targetAudience === 'students') roleFilter = 'student';
    else if (data.targetAudience === 'faculty') roleFilter = 'faculty';

    const users = await userRepository.findAllByRole(roleFilter);
    if (users.length === 0) {
      return { sent: 0 };
    }

    const userIds = users.map((u) => (u._id as { toString(): string }).toString());

    await notificationRepository.createMany(userIds, {
      type: 'system',
      title: sanitizedTitle,
      subtitle: sanitizedSubtitle,
      iconName: 'Bell',
    });

    return { sent: userIds.length };
  },

  /**
   * Count unread notifications for a user (for badge display).
   */
  async countUnread(userId: string): Promise<number> {
    return notificationRepository.countUnread(userId);
  },

  /**
   * Send an activity notification to ALL admin users.
   * Called fire-and-forget from session/doubt services so admins see platform activity.
   */
  async notifyAdmins(data: {
    type: INotification['type'];
    title: string;
    subtitle?: string;
    iconName?: string;
  }): Promise<void> {
    const admins = await userRepository.findAllByRole('admin');
    if (admins.length === 0) return;
    const adminIds = admins.map((u) => (u._id as { toString(): string }).toString());
    await notificationRepository.createMany(adminIds, data);
  },
};
