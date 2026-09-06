"use client";
import { FeatureGate } from "@/lib/features";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarDays, Clock, CheckCircle2, XCircle, AlertCircle,
  Video, ChevronLeft, ChevronRight, X, Send, User,
} from "lucide-react";
import { toast } from "sonner";
import { useSessions, updateSessionStatus } from "@/lib/hooks"; // BUG-FIX C1: use SWR hook
import ErrorState from "@/components/ErrorState";
import { usePageTitle } from "@/lib/use-page-title";

type SessionStatus = "pending" | "confirmed" | "proposed" | "completed" | "cancelled";

interface Session {
  id: string;
  topic: string;
  notes: string;
  date: string;
  time: string;
  duration: number; // BUG-FIX C2: was 30 | 60 — now any valid integer 15–120
  status: SessionStatus;
  facultyName: string;
  meetLink?: string;
  proposedDate?: string;
  proposedTime?: string;
}

interface FacultyOption { id: string; name: string; subject: string; }

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

// helper: normalize any time string to HH:mm
function to24h(t: string): string {
  if (/^\d{2}:\d{2}$/.test(t)) return t; // already HH:mm (native time input emits this)
  const m = t.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return "09:00";
  let h = parseInt(m[1], 10);
  const min = m[2];
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

const STATUS_CFG: Record<SessionStatus, { label: string; cls: string; icon: React.ElementType }> = {
  pending:   { label: "Pending",            cls: "bg-blue-50 text-blue-700 border border-blue-200",  icon: Clock },
  confirmed: { label: "Confirmed",          cls: "bg-blue-600 text-white border border-blue-600",    icon: CheckCircle2 },
  proposed:  { label: "New Time Proposed",  cls: "bg-slate-100 text-slate-700 border border-slate-200", icon: AlertCircle },
  completed: { label: "Completed",          cls: "bg-gray-100 text-gray-500 border border-gray-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelled",          cls: "bg-gray-100 text-gray-400 border border-gray-200", icon: XCircle },
};

// ── Calendar ──────────────────────────────────────────
function MiniCalendar({ onSelect, selected }: { onSelect: (d: string) => void; selected: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const isAvail = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return d >= today;
  };

  const ds = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div className="bg-white border border-gray-200 rounded">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100:bg-slate-800 rounded text-gray-400">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-800">{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100:bg-slate-800 rounded text-gray-400">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 px-3 pt-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const dateStr = ds(day);
          const avail = isAvail(day);
          const isSel = dateStr === selected;
          const isPast = new Date(viewYear, viewMonth, day) < today;
          return (
            <button
              key={day}
              disabled={!avail}
              onClick={() => onSelect(dateStr)}
              className={`aspect-square rounded text-[11px] font-medium flex items-center justify-center ${
                isSel  ? "bg-blue-600 text-white" :
                avail  ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200" :
                isPast ? "text-gray-200 cursor-default" : "text-gray-200 cursor-default"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-50 border border-blue-200 inline-block" />
          Available (any future date)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
          Selected
        </span>
      </div>
    </div>
  );
}

// ── Booking Drawer ────────────────────────────────────
// BUG-FIX C2: onBook duration changed from 30 | 60 to number
function BookingDrawer({ selectedDate, onClose, onBook }: {
  selectedDate: string;
  onClose: () => void;
  onBook: (data: { topic: string; notes: string; date: string; time: string; duration: number; facultyId: string; facultyName: string }) => void;
}) {
  const [time, setTime] = useState("09:00"); // BUG-FIX C2: default for native time input
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState<number>(30); // BUG-FIX C2: number not 30 | 60
  const [facultyList, setFacultyList] = useState<FacultyOption[]>([]);
  const [facultyId, setFacultyId] = useState("");
  const [facultyError, setFacultyError] = useState(false);
  const [facultyLoading, setFacultyLoading] = useState(true);

  const loadFaculty = useCallback(() => {
    setFacultyLoading(true);
    setFacultyError(false);
    fetch("/api/messages/faculty", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const list: FacultyOption[] = (json?.data?.faculty ?? []).map((f: any) => ({
          id: f.id,
          name: f.name,
          subject: f.subject ?? "Faculty",
        }));
        setFacultyList(list);
        setFacultyId((prev) => prev || (list.length > 0 ? list[0].id : ""));
      })
      .catch(() => setFacultyError(true))
      .finally(() => setFacultyLoading(false));
  }, []);

  useEffect(() => {
    loadFaculty();
  }, [loadFaculty]);

  // BUG-FIX C2: canBook includes duration range validation
  const canBook = topic.trim().length >= 5 && facultyId.length > 0 && duration >= 15 && duration <= 120;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded w-full max-w-md shadow-xl overflow-y-auto max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Book a Session</h2>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(selectedDate)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Faculty selector */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Select Faculty *</label>
            {facultyError ? (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 flex items-center justify-between gap-2">
                <span>Couldn&apos;t load faculty list.</span>
                <button onClick={loadFaculty} className="font-semibold underline shrink-0">Retry</button>
              </div>
            ) : facultyLoading ? (
              <p className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                Loading faculty list...
              </p>
            ) : (
              <select
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} — {f.subject}</option>
                ))}
              </select>
            )}
          </div>

          {/* BUG-FIX C2: native time input replaces fixed TIME_SLOTS grid */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* BUG-FIX C2: numeric duration input replaces 30/60 min toggle */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Duration (minutes) <span className="font-normal text-gray-400 normal-case">15–120</span>
            </label>
            <input
              type="number"
              min={15}
              max={120}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {(duration < 15 || duration > 120) && (
              <p className="text-[11px] text-red-500 mt-1">Duration must be between 15 and 120 minutes</p>
            )}
          </div>

          {/* Topic */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Session Topic *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. System Design Mock, DSA Doubt Clearing..."
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {topic.trim().length > 0 && topic.trim().length < 5 && (
              <p className="text-[11px] text-red-500 mt-1">Topic must be at least 5 characters</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Notes <span className="font-normal text-gray-400 normal-case">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Specific topics or questions to cover..."
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded px-3 py-2">
            A meet link will be shared once faculty confirms your request.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b">
          <button onClick={onClose} className="text-sm text-gray-500 px-3 py-1.5">Cancel</button>
          <button
            disabled={!canBook}
            onClick={() => {
              const selectedFaculty = facultyList.find(f => f.id === facultyId);
              onBook({
                topic: topic.trim(),
                notes: notes.trim(),
                date: selectedDate,
                time: to24h(time), // native time input already emits HH:mm; to24h is a no-op here
                duration,
                facultyId,
                facultyName: selectedFaculty?.name ?? "Faculty",
              });
              onClose();
            }}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded ${
              canBook ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Send Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Session Card ────────────────────────────────────
function SessionCard({ session, onAcceptProposal, onDecline }: { session: Session; onAcceptProposal: (id: string) => void; onDecline: (id: string) => void }) {
  const { label, cls, icon: StatusIcon } = STATUS_CFG[session.status];
  const until = daysUntil(session.date);
  const showJoin = session.status === "confirmed" && new Date(session.date) >= new Date();

  return (
    <div className={`bg-white border border-gray-200 rounded overflow-hidden ${
      session.status === "proposed" ? "border-l-4 border-l-blue-400" :
      session.status === "confirmed" ? "border-l-4 border-l-blue-600" : ""
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${cls}`}>
                <StatusIcon className="w-3 h-3" /> {label}
              </span>
              {until && (
                <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {until}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-gray-900">{session.topic}</h3>
            {session.notes && <p className="text-xs text-gray-400 mt-0.5">{session.notes}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-400">
              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{fmtDate(session.date)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.time} · {session.duration} min</span>
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{session.facultyName}</span>
            </div>
          </div>
          {showJoin && session.meetLink && (
            <a href={session.meetLink} target="_blank" rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-blue-700"
            >
              <Video className="w-3.5 h-3.5" /> Join
            </a>
          )}
        </div>
      </div>

      {session.status === "proposed" && session.proposedDate && (
        <div className="border-t border-gray-100 bg-blue-50/50 px-4 py-3">
          <p className="text-xs font-semibold text-gray-700 mb-0.5">Faculty proposed a new time</p>
          <p className="text-xs text-blue-700 font-medium">{fmtDate(session.proposedDate)} at {session.proposedTime}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onAcceptProposal(session.id)}
              className="flex items-center gap-1 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
            >
              <CheckCircle2 className="w-3 h-3" /> Accept
            </button>
            <button
              onClick={() => onDecline(session.id)}
              className="flex items-center gap-1 text-xs font-medium border border-gray-300 text-gray-500 px-3 py-1.5 rounded hover:bg-gray-50:bg-slate-800/60 hover:border-red-300 hover:text-red-500 transition-colors"
            >
              <XCircle className="w-3 h-3" /> Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionsPageInner() {
  usePageTitle("Sessions");
  // BUG-FIX C1: removed useState<Session[]> and manual useEffect fetch
  const [pendingSession, setPendingSession] = useState<Session | null>(null); // optimistic-only
  const [selectedDate, setSelectedDate] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  // BUG-FIX C1: use SWR hook — revalidateOnFocus + refreshInterval:15s (set in hooks.ts)
  const { data: rawSessionsData, isLoading, error: sessionsError, mutate: mutateSessions } = useSessions();

  // BUG-FIX C1: derive sessions from SWR data via useMemo
  const sessions = useMemo<Session[]>(() => {
    const arr = Array.isArray(rawSessionsData) ? rawSessionsData : [];
    return arr.map((s: any) => ({
      id: s._id ?? s.id,
      topic: s.topic,
      notes: s.notes ?? "",
      date: s.requestedDate ?? s.scheduledAt?.split("T")[0] ?? "",
      time: s.requestedTime ?? (s.scheduledAt
        ? new Date(s.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : ""),
      duration: s.durationMin ?? s.durationMins ?? 30, // BUG-FIX C2: number
      status: (s.status === "declined" ? "cancelled" : s.status) as SessionStatus,
      // FIX: facultyName is denormalized on every SessionBooking doc — the old
      // code only read the populated object path, so cards ALWAYS said "Faculty".
      facultyName: typeof s.facultyId === "object" && s.facultyId !== null
        ? s.facultyId?.fullName ?? s.facultyName ?? "Faculty"
        : s.facultyName ?? "Faculty",
      meetLink: s.meetLink,
      proposedDate: s.proposedDate ?? s.proposedAlternativeAt?.split("T")[0],
      proposedTime: s.proposedTime ?? (s.proposedAlternativeAt
        ? new Date(s.proposedAlternativeAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : undefined),
    }));
  }, [rawSessionsData]);

  // Merge optimistic pending session with SWR sessions (for instant post-booking UX)
  const displayedSessions = useMemo(() =>
    pendingSession
      ? [pendingSession, ...sessions.filter(s => s.id !== pendingSession.id)]
      : sessions,
    [sessions, pendingSession]
  );

  // BUG-FIX C1+C2: duration is now number; after API call mutate SWR instead of patching local state
  const handleBook = async (data: { topic: string; notes: string; date: string; time: string; duration: number; facultyId: string; facultyName: string }) => {
    const optimisticId = `s${Date.now()}`;
    setPendingSession({
      id: optimisticId,
      topic: data.topic,
      notes: data.notes,
      date: data.date,
      time: data.time,
      duration: data.duration,
      status: "pending",
      facultyName: data.facultyName,
    });
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          facultyId: data.facultyId,
          topic: data.topic,
          notes: data.notes || undefined,
          requestedDate: data.date,
          requestedTime: data.time,
          durationMin: data.duration, // BUG-FIX C2: now any integer 15–120
        }),
      });
      if (res.ok) {
        toast.success("Session request sent! Faculty will confirm shortly.");
        await mutateSessions(); // BUG-FIX C1: re-fetch from DB via SWR
      } else {
        const errJson = await res.json().catch(() => ({}));
        const fieldErrors = errJson?.error?.details;
        const msg = fieldErrors
          ? Object.values(fieldErrors).flat().join(" ")
          : errJson?.error?.message || "Failed to book session.";
        toast.error(msg);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPendingSession(null); // clear optimistic — SWR data now authoritative
    }
  };

  // BUG-FIX C1: use SWR mutate after API resolves instead of setSessions
  const handleAcceptProposal = async (id: string) => {
    try {
      await updateSessionStatus(id, 'accept_proposal');
      toast.success("Session confirmed! Faculty will share the meet link.");
      await mutateSessions(); // BUG-FIX C1: SWR re-fetch updates the card state
    } catch (err: any) {
      toast.error(err?.message || "Failed to confirm session.");
      await mutateSessions(); // revert to actual DB state on error
    }
  };

  // BUG-FIX C1: use SWR mutate after API resolves instead of setSessions
  const handleDeclineProposal = async (id: string) => {
    try {
      await updateSessionStatus(id, 'cancel');
      toast.success("Proposal declined.");
      await mutateSessions(); // BUG-FIX C1: SWR re-fetch
    } catch (err: any) {
      toast.error(err?.message || "Failed to decline proposal.");
      await mutateSessions();
    }
  };

  const upcoming = displayedSessions.filter((s) => ["pending", "confirmed", "proposed"].includes(s.status));
  const past = displayedSessions.filter((s) => ["completed", "cancelled"].includes(s.status));

  if (sessionsError) {
    return <ErrorState error={sessionsError} title="Couldn't load your sessions" onRetry={() => mutateSessions()} />;
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl animate-pulse">
        <div className="mb-5">
          <div className="h-7 bg-gray-100 rounded w-40 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">
          <div className="h-72 bg-gray-100 rounded-xl" />
          <div className="space-y-4">
            <div className="h-10 bg-gray-100 rounded-lg w-48" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Book a Session</h1>
        <p className="text-xs text-gray-400 mt-0.5">Schedule 1:1 sessions with your faculty mentor</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[300px_1fr_300px] gap-6">
        {/* Left: Calendar */}
        <div className="space-y-4">
          <MiniCalendar onSelect={setSelectedDate} selected={selectedDate} />

          {selectedDate ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Selected Date</p>
              <p className="text-sm font-bold text-gray-900 mb-4">{fmtDate(selectedDate)}</p>
              <button
                onClick={() => setShowBooking(true)}
                className="w-full bg-blue-600 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" /> Request Slot
              </button>
            </div>
          ) : (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs text-gray-500 space-y-2">
              <p className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-blue-600" /> How it works
              </p>
              <p className="flex items-start gap-2"><span className="font-bold text-blue-300">1.</span> Pick any available date on the calendar</p>
              <p className="flex items-start gap-2"><span className="font-bold text-blue-300">2.</span> Choose a time and session topic</p>
              <p className="flex items-start gap-2"><span className="font-bold text-blue-300">3.</span> Faculty confirms or proposes a new time</p>
              <p className="flex items-start gap-2"><span className="font-bold text-blue-300">4.</span> Join via the auto-generated Jitsi Meet link</p>
            </div>
          )}
        </div>

        {/* Middle: Sessions List */}
        <div>
          <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden mb-5 w-fit bg-white shadow-sm p-1">
            {(["upcoming", "past"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-1.5 text-xs font-bold capitalize rounded-xl transition-colors ${
                  tab === t ? "bg-gray-900 text-white shadow" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {t} ({t === "upcoming" ? upcoming.length : past.length})
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {(tab === "upcoming" ? upcoming : past).length === 0 ? (
              <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl">
                <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">
                  {tab === "upcoming" ? "No upcoming sessions. Pick a date to book one!" : "No past sessions yet."}
                </p>
              </div>
            ) : (
              (tab === "upcoming" ? upcoming : past).map((s) => (
                <SessionCard key={s.id} session={s} onAcceptProposal={handleAcceptProposal} onDecline={handleDeclineProposal} />
              ))
            )}
          </div>
        </div>

        {/* Right: Info Card */}
        <div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-white blur-xl"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10 shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Need Expert Help?</h3>
                  <p className="text-blue-100 text-[10px]">Book a 1:1 mentor session</p>
                </div>
              </div>

              <ul className="space-y-1.5 mb-4">
                <li className="flex items-center gap-2 text-[11px] font-medium text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-200 shrink-0" /> Resume Review &amp; Polish
                </li>
                <li className="flex items-center gap-2 text-[11px] font-medium text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-200 shrink-0" /> Mock Interviews (DSA/HR)
                </li>
                <li className="flex items-center gap-2 text-[11px] font-medium text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-200 shrink-0" /> System Design &amp; LLD
                </li>
              </ul>

              <div className="bg-white rounded-lg p-2.5 backdrop-blur-sm border border-white/10 text-[9px] leading-tight text-blue-50">
                Sessions are subject to faculty availability. Please book at least 24 hours in advance.
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBooking && selectedDate && (
        <BookingDrawer selectedDate={selectedDate} onClose={() => setShowBooking(false)} onBook={handleBook} />
      )}
    </div>
  );
}

// Admin feature-toggle gate (Feature Controls → student.sessions)
export default function SessionsPageGate() {
  return (
    <FeatureGate feature="student.sessions" title="Session Booking">
      <SessionsPageInner  />
    </FeatureGate>
  );
}
