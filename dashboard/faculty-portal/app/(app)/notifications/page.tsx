// Faculty Notifications — type-aware deep links + one-way read marking
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, MessageCircle, X, RefreshCw, CalendarDays } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, type NotificationData } from "@/lib/api";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "session" || type === "request")
    return (
      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center ring-2 ring-blue-50">
        <CalendarDays className="w-4 h-4 text-blue-600" />
      </div>
    );
  if (type === "doubt")
    return (
      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center ring-2 ring-amber-50">
        <MessageCircle className="w-4 h-4 text-amber-600" />
      </div>
    );
  if (type === "xp" || type === "badge")
    return (
      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center ring-2 ring-emerald-50">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      </div>
    );
  return (
    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-gray-50">
      <Bell className="w-4 h-4 text-gray-500" />
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map notification type to the relevant portal route for deep linking
  const getNotifLink = (type: string): string => {
    switch (type) {
      case 'session': return '/requests';
      case 'doubt':   return '/doubts';
      case 'badge':   return '/leaderboard';
      case 'xp':      return '/leaderboard';
      default:        return '';
    }
  };

  const fetchNotifications = () => {
    setIsLoading(true);
    setError(null);
    getNotifications()
      .then((data) => setNotifications(data))
      .catch(() => setError('Could not load notifications. Please try again.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // FIX: Mark-all-read — call the /read-all endpoint, then refresh
  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      // Silently ignore — UI already updated optimistically
    }
  };

  // FIX: One-way only — never toggles back to unread. Also deep-links to relevant section.
  const handleMarkRead = (id: string, type: string) => {
    // Mark read in UI immediately (optimistic)
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    // Fire API — best effort
    markNotificationRead(id).catch(() => {});
    // Deep link to relevant section
    const link = getNotifLink(type);
    if (link) router.push(link);
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto pb-20 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-100 rounded w-40 animate-pulse" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex gap-4">
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-48 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-72 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchNotifications}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-blue-600 font-semibold mt-1">
              You have {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            onClick={() => handleMarkRead(notification._id, notification.type)}
            className={`p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${
              !notification.isRead ? "bg-blue-50/40" : ""
            }`}
          >
            {/* Left accent bar for unread */}
            {!notification.isRead && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600 rounded-r" />
            )}

            <div className="mt-1 shrink-0">
              <NotificationIcon type={notification.type} />
            </div>

            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-center justify-between gap-4">
                <h3
                  className={`text-sm ${
                    !notification.isRead
                      ? "font-bold text-gray-900"
                      : "font-medium text-gray-600"
                  }`}
                >
                  {notification.title}
                </h3>
                <span className="text-[11px] text-gray-400 font-medium shrink-0">
                  {timeAgo(notification.createdAt)}
                </span>
              </div>
              {notification.subtitle && (
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {notification.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {!notification.isRead && (
                <div className="w-2 h-2 rounded-full bg-blue-600" />
              )}
              <button
                onClick={(e) => handleDismiss(notification._id, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-400">
              No notifications yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
