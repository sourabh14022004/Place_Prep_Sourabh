"use client";
import { FeatureGate } from "@/lib/features";
import { usePageTitle } from "@/lib/use-page-title";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Search, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  senderId: "student" | "faculty";
  body: string;
  sentAt: string;
  seen: boolean;
}

interface Faculty {
  id: string;
  name: string;
  initials: string;
  subject: string;
  online: boolean;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(messages: Message[]) {
  const groups: Record<string, Message[]> = {};
  messages.forEach((m) => {
    const d = new Date(m.sentAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const key =
      d.toDateString() === today.toDateString() ? "Today" :
      d.toDateString() === yesterday.toDateString() ? "Yesterday" :
      d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return Object.entries(groups).map(([dateLabel, messages]) => ({ dateLabel, messages }));
}

// ── Sidebar: faculty list ─────────────────────────────
function FacultyList({ faculty, selected, onSelect, loading, error, onRetry }: {
  faculty: Faculty[];
  selected: string;
  onSelect: (id: string) => void;
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = faculty.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-900 mb-2">Messages</h2>
        <div className="flex items-center gap-2 bg-gray-100 rounded px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-xs text-gray-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Faculty rows */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        )}
        {!loading && error && (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-red-600 font-medium mb-2">Couldn&apos;t load faculty.</p>
            <button onClick={onRetry} className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline">
              Retry
            </button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">No faculty found</p>
        )}
        {filtered.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-100 ${
              selected === f.id ? "bg-blue-50 border-l-2 border-l-blue-600" : "hover:bg-gray-50:bg-slate-800/60"
            }`}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {f.initials}
              </div>
              {f.online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-gray-900 truncate">{f.name}</span>
                {f.lastAt && f.lastAt !== new Date(0).toISOString() && (
                  <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(f.lastAt)}</span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                {f.lastMessage || f.subject}
              </p>
            </div>

            {/* Unread */}
            {f.unread > 0 && (
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5">
                {f.unread}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Chat window ───────────────────────────────────────
function ChatWindow({ facultyId, faculty }: { facultyId: string; faculty: Faculty }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadMessages = useCallback(() => {
    setLoadError(false);
    setLoading(true);
    if (!facultyId) return;
    fetch(`/api/messages/${facultyId}`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const msgs = json?.data?.messages ?? [];
        setMessages(msgs.map((m: any) => ({
          id: m.id ?? m._id,
          senderId: m.senderId,
          body: m.body,
          sentAt: m.sentAt ?? m.createdAt,
          seen: m.seen ?? true,
        })));
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [facultyId]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch messages for this conversation (reuses loadMessages for retry support)
  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facultyId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const body = input.trim();
    setInput("");
    setSending(true);

    // Optimistic update
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      senderId: "student",
      body,
      sentAt: new Date().toISOString(),
      seen: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/messages/${facultyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const data = await res.json();
        const saved = data?.data ?? data;
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? { ...optimistic, id: saved.id } : m))
        );
      } else {
        // FAILURE FIX: failed sends used to stay rendered as delivered.
        // Mark them with a visible ✕ so the user knows to retry.
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? { ...m, id: `${optimistic.id}-failed` } : m))
        );
        toast.error("Message failed to send. Please try again.");
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, id: `${optimistic.id}-failed` } : m))
      );
      toast.error("Network error — message not sent.");
    } finally {
      setSending(false);
    }
  };

  const grouped = groupByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {faculty.initials}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{faculty.name}</p>
          <p className="text-[11px] text-gray-400">{faculty.subject}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
          </div>
        ) : (
          grouped.map(({ dateLabel, messages: dayMsgs }) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {dateLabel}
                </span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>
              <div className="space-y-2">
                {dayMsgs.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.senderId === "student" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[72%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                        m.senderId === "student"
                          ? "bg-blue-600 text-white rounded-br-md"
                          : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                      }`}
                    >
                      <p>{m.body}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          m.senderId === "student" ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        {fmtTime(m.sentAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t border-gray-200 bg-white shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none bg-gray-100 border border-transparent focus:border-blue-300 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
      <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded flex items-center justify-center mb-3">
        <Send className="w-5 h-5 text-blue-300" />
      </div>
      <p className="text-sm font-semibold text-gray-500">Select a conversation</p>
      <p className="text-xs text-gray-400 mt-1">Choose a faculty member from the list</p>
    </div>
  );
}

function MessagesPageInner() {
  usePageTitle("Messages");
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [facultyError, setFacultyError] = useState(false);

  // ERROR FIX: a failed fetch previously rendered as "No faculty found" —
  // indistinguishable from an empty directory and impossible to recover.
  const loadFacultyList = useCallback(() => {
    setFacultyError(false);
    setLoadingFaculty(true);
    fetch("/api/messages/faculty", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const raw: any[] = data?.faculty ?? data?.data?.faculty ?? [];
        setFaculty(
          raw.map((f: any) => ({
            id: f.id ?? f._id,
            name: f.name ?? f.fullName ?? "Faculty",
            initials: (f.name ?? f.fullName ?? "F")
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
            subject: f.subject ?? "Placement Mentor",
            online: f.online ?? false,
            lastMessage: f.lastMessage ?? "",
            lastAt: f.lastAt ?? new Date(0).toISOString(),
            unread: f.unread ?? 0,
          }))
        );
      })
      .catch(() => setFacultyError(true))
      .finally(() => setLoadingFaculty(false));
  }, []);

  useEffect(() => {
    loadFacultyList();
  }, [loadFacultyList]);

  const selectedFaculty = faculty.find((f) => f.id === selectedFacultyId);

  return (
    <div className="-mx-6 -my-6 flex" style={{ height: "calc(100vh - 56px)" }}>
      {/* Faculty sidebar */}
      <div className="w-64 shrink-0 border-r border-gray-200">
        <FacultyList
          faculty={faculty}
          selected={selectedFacultyId}
          onSelect={setSelectedFacultyId}
          loading={loadingFaculty}
          error={facultyError}
          onRetry={loadFacultyList}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {selectedFaculty
          ? <ChatWindow facultyId={selectedFacultyId} faculty={selectedFaculty} />
          : <EmptyState />}
      </div>
    </div>
  );
}

// Admin feature-toggle gate (Feature Controls → student.messages)
export default function MessagesPageGate() {
  return (
    <FeatureGate feature="student.messages" title="Faculty Messages">
      <MessagesPageInner  />
    </FeatureGate>
  );
}
