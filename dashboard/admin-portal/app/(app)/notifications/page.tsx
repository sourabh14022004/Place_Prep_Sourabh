"use client";

import { useState } from "react";
import { Bell, Check, CheckCheck, AlertTriangle, Info, Send, GraduationCap, Users, Globe } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const TARGET_OPTIONS = [
  { value: "students", label: "All Students", icon: GraduationCap, desc: "Sent to every student on the platform" },
  { value: "faculty", label: "All Faculty", icon: Users, desc: "Sent to every faculty member" },
  { value: "all", label: "Everyone", icon: Globe, desc: "Sent to both students and faculty" },
] as const;

type Target = typeof TARGET_OPTIONS[number]["value"];

export default function NotificationsPage() {
  // Admin inbox — real API via SWR
  const { data: notifsData, mutate: mutateNotifs, isLoading: notifsLoading } = useSWR('/api/admin/notifications', fetcher);
  const notifications = notifsData?.data?.notifications ?? notifsData?.notifications ?? [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: 'PATCH' });
      mutateNotifs();
    } catch { toast.error('Could not mark as read.'); }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/notifications/read-all', { method: 'POST' });
      mutateNotifs();
    } catch { toast.error('Could not mark all as read.'); }
  };

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  // Compose state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<Target>("students");
  const [sending, setSending] = useState(false);
  const [sentLog, setSentLog] = useState<Array<{ title: string; target: string; sentAt: string; recipientCount: number }>>([]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), subtitle: message.trim(), targetAudience: target }),
      });
      if (!res.ok) throw new Error('Send failed');
      const json = await res.json();
      const recipientCount = json?.data?.recipientCount ?? json?.recipientCount ?? 0;
      toast.success(`Notification sent to ${target === 'all' ? 'everyone' : target}.`);
      setSentLog(prev => [{ title: title.trim(), target, sentAt: new Date().toISOString(), recipientCount }, ...prev].slice(0, 20));
      setTitle('');
      setMessage('');
    } catch {
      toast.error('Could not send notification.');
    } finally {
      setSending(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "alert": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "success": return <CheckCheck className="w-4 h-4 text-emerald-500" />;
      case "session": return <CheckCheck className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatSentTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const targetLabel: Record<Target, string> = { students: "Students", faculty: "Faculty", all: "Everyone" };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        <p className="text-xs text-gray-500 mt-0.5">Compose push notifications and manage your notification inbox</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ─── LEFT: Compose Panel (40%) ─── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Compose card */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                <Send className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-800">Compose Notification</h2>
            </div>

            {/* Target select */}
            <div className="mb-3">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Send To</label>
              <div className="space-y-1.5">
                {TARGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTarget(opt.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      target === opt.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${target === opt.value ? "bg-blue-100" : "bg-gray-100"}`}>
                      <opt.icon className={`w-3 h-3 ${target === opt.value ? "text-blue-600" : "text-gray-500"}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${target === opt.value ? "text-blue-700" : "text-gray-700"}`}>{opt.label}</p>
                      <p className="text-[10px] text-gray-400">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="mb-3">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. System Maintenance Tonight"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 placeholder-gray-300"
                maxLength={80}
              />
              <p className="text-right text-[10px] text-gray-300 mt-0.5">{title.length}/80</p>
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a clear, concise notification message..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 placeholder-gray-300 resize-none"
                maxLength={300}
              />
              <p className="text-right text-[10px] text-gray-300 mt-0.5">{message.length}/300</p>
            </div>

            <button
              onClick={handleSend}
              disabled={!title.trim() || !message.trim() || sending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending…" : `Send to ${targetLabel[target]}`}
            </button>
          </div>

          {/* Sent log */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-700 mb-3">Sent Notifications</h3>
            <div className="space-y-3">
              {sentLog.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No notifications sent yet this session.</p>
              ) : sentLog.map((n, i) => (
                <div key={i} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-800 leading-snug">{n.title}</p>
                    <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                      n.target === "students" ? "bg-blue-50 text-blue-600" :
                      n.target === "faculty" ? "bg-emerald-50 text-emerald-600" :
                      "bg-purple-50 text-purple-600"
                    }`}>
                      {targetLabel[n.target as Target] ?? n.target}
                    </span>
                  </div>
                  {n.recipientCount != null && (
                    <p className="text-[10px] text-gray-500 mt-0.5">{n.recipientCount} recipients</p>
                  )}
                  <p className="text-[10px] text-gray-300 mt-1">{formatSentTime(n.sentAt)}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ─── RIGHT: Inbox (60%) ─── */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-800">Inbox</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">{unreadCount}</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            {notifsLoading ? (
              // Skeleton loader — matches notification row layout
              <div className="divide-y divide-gray-50">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-3/5" />
                      <div className="h-3 bg-gray-100 rounded w-4/5" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/4 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No notifications.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((n: any) => (
                  <li
                    key={n._id ?? n.id}
                    className={`px-4 py-3 transition-colors ${!n.isRead ? "bg-blue-50/40 hover:bg-blue-50/60" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-xs mb-0.5 ${!n.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-600"}`}>
                          {n.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed">{n.subtitle ?? n.message ?? ''}</p>
                        <span className="text-[10px] text-gray-400 mt-1 block">{formatTime(n.createdAt ?? n.time)}</span>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n._id ?? n.id)}
                          className="p-1.5 rounded-lg hover:bg-white text-gray-300 hover:text-blue-600 transition-colors shrink-0"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </li>

                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
