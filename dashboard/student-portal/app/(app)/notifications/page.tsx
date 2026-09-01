"use client";
import { FeatureGate } from "@/lib/features";
import { PageHeader } from "@/components/ui";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trophy, BarChart, Zap, CheckCircle, BellRing, FileText, Target, Star } from "lucide-react";
import { toast } from "sonner";
import { useNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/hooks";
import { usePageTitle } from "@/lib/use-page-title";

type AppNotification = {
  id: string;
  title: string;
  subtitle?: string;
  iconName?: string;
  type?: string;
  read: boolean;
  createdAt: string;
};

const IconMap: Record<string, React.ElementType> = { Trophy, BarChart, Zap, CheckCircle, FileText, Target, Star, BellRing };

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: AppNotification;
  onMarkRead: (id: string, type: string, alreadyRead: boolean) => void;
}) {
  return (
    <div
      className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50:bg-slate-800/60 transition-colors cursor-pointer ${
        !notification.read ? "bg-blue-50/40" : ""
      }`}
      onClick={() => onMarkRead(notification.id, notification.type ?? '', notification.read)}
    >
      {/* Icon */}
      <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
        {(() => {
          const Icon = IconMap[notification.iconName ?? ""] || Bell;
          return <Icon className="w-5 h-5 text-gray-600" />;
        })()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"} truncate`}>
          {notification.title}
        </div>
        {notification.subtitle && (
          <div className="text-xs text-gray-500 mt-0.5 truncate">{notification.subtitle}</div>
        )}
        <div className="text-[11px] text-gray-400 mt-1">{timeAgo(notification.createdAt)}</div>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
      )}
    </div>
  );
}

function NotificationsPageInner() {
  usePageTitle("Notifications");
  // SWR — polls every 30s for new notifications, auto-revalidates on focus
  const { data: rawData, isLoading, mutate } = useNotifications();

  // Normalize API shape or fall back to mock
  const notifications: AppNotification[] = rawData
    ? (Array.isArray(rawData) ? rawData : rawData.notifications ?? []).map((n: any) => ({
        id: n._id ?? n.id,
        title: n.title,
        subtitle: n.subtitle,
        iconName: n.iconName,
        type: n.type,
        read: n.isRead ?? n.read ?? false,
        createdAt: n.createdAt,
      }))
    : [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const router = useRouter();

  // Map notification type to the relevant student-portal route
  const getNotifLink = (type: string): string => {
    switch (type) {
      case 'session':    return '/sessions';
      case 'doubt':      return '/doubts';
      case 'badge':      return '/leaderboard';
      case 'xp':         return '/leaderboard';
      case 'roadmap':    return '/roadmap';
      case 'experience': return '/submit';
      case 'question':   return '/practice';
      default:           return '';
    }
  };

  const handleMarkRead = async (id: string, type: string, alreadyRead: boolean) => {
    // Deep-link to relevant section first
    const link = getNotifLink(type);
    try {
      if (!alreadyRead) {
        // Only hit API if it's actually unread
        await markNotificationRead(id);
        mutate(); // revalidate from server
      }
    } catch {
      toast.error('Could not mark notification as read.');
    }
    if (link) router.push(link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      mutate();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Could not mark all as read.");
    }
  };

  const grouped = {
    unread: notifications.filter((n) => !n.read),
    read: notifications.filter((n) => n.read),
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread — click any to mark read` : "You're all caught up"}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50:bg-slate-800/60 transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-emerald-500" /> Mark all read
            </button>
          ) : undefined
        }
      />

      {/* Notification list */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* LOADING FIX: the old code rendered the empty state while the first
            fetch was in flight — every visit flashed "All caught up" before
            content appeared. Show skeletons instead. */}
        {isLoading && notifications.length === 0 ? (
          <div className="divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 w-2/3 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-gray-50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
          {/* Unread section */}
          {grouped.unread.length > 0 && (
            <div>
              <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  New · {grouped.unread.length}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {grouped.unread.map((n) => (
                  <NotificationRow key={n.id} notification={n} onMarkRead={handleMarkRead} />
                ))}
              </div>
            </div>
          )}

          {/* Read section */}
          {grouped.read.length > 0 && (
            <div>
              <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Earlier
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {grouped.read.map((n) => (
                  <NotificationRow key={n.id} notification={n} onMarkRead={handleMarkRead} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {notifications.length === 0 && (
            <div className="py-20 text-center">
              <div className="flex justify-center mb-4 text-gray-300"><BellRing className="w-16 h-16" /></div>
              <div className="font-semibold text-gray-700">No notifications yet</div>
              <div className="text-sm text-gray-400 mt-1">We&apos;ll notify you about your roadmap, badges, and new questions</div>
            </div>
          )}
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Click a notification to mark it as read
      </p>
    </div>
  );
}

// Admin feature-toggle gate (Feature Controls → student.notifications)
export default function NotificationsPageGate() {
  return (
    <FeatureGate feature="student.notifications" title="Notifications">
      <NotificationsPageInner  />
    </FeatureGate>
  );
}
