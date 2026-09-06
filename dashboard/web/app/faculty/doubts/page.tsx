"use client";
import { FeatureGate } from "@/lib/faculty/use-features";
import { useState, useEffect, useRef } from "react";
import {
  MessageCircle, ChevronDown, ChevronUp,
  Clock, CheckCircle2, AlertCircle, Send, Tag,
  Inbox, Filter, Search,
} from "lucide-react";
import { FacultyDoubt, DoubtStatus, DoubtTag } from "@/lib/faculty/types";
import { useFaculty } from "@/lib/faculty/context/FacultyContext";
import { getDoubts, replyToDoubt, resolveDoubt } from "@/lib/faculty/api";

// ── Status config ──────────────────────────────────────
const STATUS_MAP: Record<DoubtStatus, { label: string; dot: string; badge: string; icon: React.ElementType }> = {
  pending:  { label: "Awaiting Reply", dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-700 border-amber-200",   icon: AlertCircle },
  answered: { label: "Answered",       dot: "bg-blue-500",   badge: "bg-blue-600 text-white border-blue-600",         icon: MessageCircle },
  resolved: { label: "Resolved",       dot: "bg-emerald-400",badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
};

// ── Tag config ─────────────────────────────────────────
const TAG_MAP: Record<DoubtTag, { bg: string; text: string; border: string }> = {
  "DSA":              { bg: "bg-violet-50",  text: "text-violet-700", border: "border-violet-200" },
  "System Design":    { bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200"   },
  "LLD":              { bg: "bg-slate-50",   text: "text-slate-700",  border: "border-slate-200"  },
  "HR":               { bg: "bg-rose-50",    text: "text-rose-700",   border: "border-rose-200"   },
  "General":          { bg: "bg-gray-50",    text: "text-gray-600",   border: "border-gray-200"   },
  "Web Development":  { bg: "bg-cyan-50",    text: "text-cyan-700",   border: "border-cyan-200"   },
  "Aptitude":         { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200"  },
};

/**
 * Domain scoping now happens server-side: GET /api/faculty/doubts only returns
 * doubts whose tag is in this faculty member's admin-assigned doubtDomains
 * (plus any domain with no faculty assigned at all). The client no longer
 * filters by subject — the previous SUBJECT_ALIASES map existed only to bridge
 * long-form subject names to short tags, and keeping a second filter here would
 * be a place for the two to silently disagree.
 */

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2)    return "just now";
  if (mins < 60)   return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function TagPill({ tag }: { tag: DoubtTag }) {
  const { bg, text, border } = TAG_MAP[tag];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${bg} ${text} ${border}`}>
      <Tag className="w-2.5 h-2.5" /> {tag}
    </span>
  );
}

function StatusBadge({ status }: { status: DoubtStatus }) {
  const { label, badge, dot, icon: Icon } = STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function DoubtCard({
  doubt, onReply, onResolve,
}: {
  doubt: FacultyDoubt;
  onReply: (id: string, text: string) => void;
  onResolve: (id: string) => void;
}) {
  const [open, setOpen] = useState(doubt.status === "pending");
  const [replyText, setReplyText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_CHARS = 500;

  const accentMap: Record<DoubtStatus, string> = {
    pending:  "border-l-amber-400",
    answered: "border-l-blue-500",
    resolved: "border-l-emerald-400",
  };

  const handleSendReply = () => {
    if (replyText.trim()) {
      onReply(doubt.id, replyText);
      setReplyText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSendReply();
    }
  };

  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${accentMap[doubt.status]} rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md`}>

      {/* ── Clickable Header ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left group"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
          {doubt.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Top meta row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <TagPill tag={doubt.tag} />
            <StatusBadge status={doubt.status} />
            <span className="ml-auto text-[11px] text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo(doubt.createdAt)}
            </span>
          </div>

          {/* Question */}
          <p className="text-sm font-bold text-gray-900 leading-snug mb-1">
            <span className="text-gray-500 font-medium">{doubt.studentName}: </span>
            {doubt.subject}
          </p>
          {!open && (
            <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{doubt.body}</p>
          )}
        </div>

        {/* Chevron */}
        <span className="text-gray-300 group-hover:text-gray-500 mt-1 transition-colors shrink-0">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* ── Expanded Body ── */}
      {open && (
        <div className="border-t border-gray-100">
          {/* Question body */}
          <div className="px-5 py-4 bg-gray-50/80">
            <p className="text-sm text-gray-700 leading-relaxed">{doubt.body}</p>
          </div>

          {/* Replies thread */}
          {doubt.replies.length > 0 && (
            <div className="divide-y divide-gray-100">
              {doubt.replies.map((r) => (
                <div
                  key={r.id}
                  className={`flex gap-3 px-5 py-3.5 ${r.author === "faculty" ? "bg-blue-50/40" : "bg-white"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                    r.author === "faculty"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {r.authorName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold ${r.author === "faculty" ? "text-blue-700" : "text-gray-900"}`}>
                        {r.authorName}
                      </span>
                      {r.author === "faculty" && (
                        <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded tracking-widest">
                          FACULTY
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">· {timeAgo(r.sentAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending nudge */}
          {doubt.status === "pending" && (
            <div className="px-5 py-3 border-t border-amber-100 flex items-center gap-2 bg-amber-50/60">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs font-semibold text-amber-700">This student is waiting for your response.</p>
            </div>
          )}

          {/* Reply Composer */}
          {doubt.status !== "resolved" && (
            <div className="px-5 py-4 border-t border-gray-100 bg-white space-y-2.5">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a reply… (Cmd+Enter to send)"
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 resize-none transition-shadow"
                />
                <span className={`absolute bottom-2.5 right-3 text-[10px] font-medium ${replyText.length > MAX_CHARS * 0.9 ? "text-amber-500" : "text-gray-300"}`}>
                  {replyText.length}/{MAX_CHARS}
                </span>
              </div>
              <div className="flex items-center justify-between">
                {doubt.status === "answered" ? (
                  <button
                    onClick={() => onResolve(doubt.id)}
                    className="text-xs text-gray-500 font-semibold hover:text-emerald-700 flex items-center gap-1.5 bg-gray-50 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Resolved
                  </button>
                ) : (
                  <span className="text-[11px] text-gray-400">Cmd+Enter to send quickly</span>
                )}
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" /> Send Reply
                </button>
              </div>
            </div>
          )}

          {/* Resolved state */}
          {doubt.status === "resolved" && (
            <div className="px-5 py-3 border-t border-emerald-100 flex items-center gap-2 bg-emerald-50/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs font-semibold text-emerald-700">This doubt has been resolved. No further action needed.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function DoubtsPageInner() {
  const { currentFaculty, updateFacultySolvedCount } = useFaculty();
  const [doubts, setDoubts] = useState<FacultyDoubt[]>([]);
  const [statusFilter, setStatusFilter] = useState<"All" | DoubtStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    getDoubts()
      .then((data) => {
        if (cancelled) return;
        const mapped: FacultyDoubt[] = data.map((d: any) => ({
          id: d._id,
          studentName: d.studentName ?? (typeof d.studentId === "object" ? d.studentId?.fullName : "Student"),
          studentInitials: (
            d.studentName ?? (typeof d.studentId === "object" ? d.studentId?.fullName : "Student")
          ).split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
          batch: typeof d.studentId === "object" ? d.studentId?.batch ?? "2024" : "2024",
          subject: d.subject,
          body: d.body,
          tag: (d.tag ?? "General") as DoubtTag,
          status: d.status as DoubtStatus,
          createdAt: d.createdAt,
          replies: (d.replies ?? []).map((r: any) => ({
            id: r._id ?? String(Math.random()),
            author: r.authorRole === "faculty" ? "faculty" : "student",
            authorName: r.authorName,
            body: r.body,
            sentAt: r.sentAt,
          })),
        }));
        setDoubts(mapped);
      })
      // Was `.catch(() => {})`, which silently swallowed the TypeError thrown by
      // the old destructuring bug and left the page showing "No doubts found"
      // as if the inbox were genuinely empty. Surface failures instead.
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e : new Error("Failed to load doubts"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleReply = (id: string, text: string) => {
    const doubt = doubts.find((d) => d.id === id);
    if (doubt?.status === "pending" && currentFaculty) {
      updateFacultySolvedCount(currentFaculty.id);
    }
    // Fire API call (optimistic — UI updates regardless)
    replyToDoubt(id, text).catch(() => {});
    setDoubts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        return {
          ...d,
          status: d.status === "pending" ? "answered" : d.status,
          replies: [
            ...d.replies,
            {
              id: `r${Date.now()}`,
              author: "faculty",
              authorName: currentFaculty?.name || "Prof. Sharma",
              body: text,
              sentAt: new Date().toISOString(),
            },
          ],
        };
      })
    );
  };

  const handleResolve = (id: string) => {
    resolveDoubt(id).catch(() => {});
    setDoubts((prev) => prev.map((d) => (d.id === id ? { ...d, status: "resolved" } : d)));
  };

  // Everything returned by the API is already scoped to this faculty member's
  // assigned domains, so there is nothing left to filter client-side.
  const scopedDoubts = doubts;

  const afterStatusFilter =
    statusFilter === "All" ? scopedDoubts : scopedDoubts.filter((d) => d.status === statusFilter);

  const filtered = searchQuery.trim()
    ? afterStatusFilter.filter(
        (d) =>
          d.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : afterStatusFilter;

  const counts = {
    All:      scopedDoubts.length,
    pending:  scopedDoubts.filter((d) => d.status === "pending").length,
    answered: scopedDoubts.filter((d) => d.status === "answered").length,
    resolved: scopedDoubts.filter((d) => d.status === "resolved").length,
  };

  const STAT_CARDS = [
    {
      label: "Total Doubts",
      value: counts.All,
      icon: Inbox,
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
      valueColor: "text-gray-900",
      border: "border-gray-200",
    },
    {
      label: "Awaiting Reply",
      value: counts.pending,
      icon: AlertCircle,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      valueColor: "text-amber-600",
      border: "border-amber-200",
    },
    {
      label: "Answered",
      value: counts.answered,
      icon: MessageCircle,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      valueColor: "text-blue-600",
      border: "border-blue-200",
    },
    {
      label: "Resolved",
      value: counts.resolved,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-600",
      border: "border-emerald-200",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* ── Page Header ── */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-50 rounded-lg">
            <MessageCircle className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Doubts &amp; Questions</h1>
        </div>
        <p className="text-sm text-gray-500 ml-[52px]">
          Answer student questions across all topics · {counts.pending > 0 && (
            <span className="font-semibold text-amber-600">{counts.pending} waiting for your reply</span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
          <div className="h-12 bg-gray-100 animate-pulse rounded-xl" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : loadError ? (
        <div className="text-center py-16 bg-white border border-red-200 rounded-2xl">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-sm font-bold text-gray-600">Couldn't load doubts</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{loadError.message}</p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {STAT_CARDS.map(({ label, value, icon: Icon, iconBg, iconColor, valueColor, border }) => (
              <div
                key={label}
                className={`bg-white border ${border} rounded-xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow`}
              >
                <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <div>
                  <p className={`text-2xl font-black leading-none ${valueColor}`}>{value}</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Unified Filter Bar ── */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 mb-5 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student, topic..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
              />
            </div>

            {/* Scope toggle removed: the API only returns doubts in this faculty
                member's assigned domains, so "All Doubts" vs "My Subjects" would
                render identical lists and imply a wider pool than exists. */}

            {/* Status pills */}
            <div className="flex items-center gap-1">
              {(["All", "pending", "answered", "resolved"] as const).map((f) => {
                const isActive = statusFilter === f;
                const colorMap = {
                  All:      isActive ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  pending:  isActive ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600 hover:bg-amber-100",
                  answered: isActive ? "bg-blue-600 text-white"  : "bg-blue-50 text-blue-600 hover:bg-blue-100",
                  resolved: isActive ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
                };
                return (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-full capitalize transition-colors ${colorMap[f]}`}
                  >
                    {f} <span className="opacity-75">({counts[f]})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Doubt List ── */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-white border border-dashed border-gray-300 rounded-2xl">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-sm font-bold text-gray-400">No doubts found</p>
                <p className="text-xs text-gray-300 mt-1">
                  {doubts.length === 0
                    ? "Doubts in your assigned domains will appear here."
                    : "Try changing your filter or search query"}
                </p>
              </div>
            ) : (
              filtered.map((d) => (
                <DoubtCard
                  key={d.id}
                  doubt={d}
                  onReply={handleReply}
                  onResolve={handleResolve}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}


// Admin feature-toggle gate (Feature Controls → faculty.doubts)
export default function DoubtsPageGate() {
  return (
    <FeatureGate feature="faculty.doubts" title="Doubts & Questions">
      <DoubtsPageInner />
    </FeatureGate>
  );
}
