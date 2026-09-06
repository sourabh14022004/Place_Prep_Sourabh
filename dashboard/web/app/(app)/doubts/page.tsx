"use client";
import { FeatureGate } from "@/lib/features";
import { useState, useEffect } from "react";
import {
  MessageCircle, Plus, ChevronDown, ChevronUp,
  Clock, CheckCircle2, AlertCircle, Send, Tag, X, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/lib/hooks";
import ErrorState from "@/components/ErrorState";
import { usePageTitle } from "@/lib/use-page-title";

type DoubtStatus = "pending" | "answered" | "resolved";
/**
 * Must stay in sync with DOUBT_DOMAINS in backend/src/types/shared.types.ts.
 * A tag missing here is a tag no student can ever pick, which strands every
 * faculty the admin assigned to that domain.
 */
type DoubtTag =
  | "DSA"
  | "System Design"
  | "LLD"
  | "Web Development"
  | "Aptitude"
  | "HR"
  | "General";

interface DoubtReply {
  id: string;
  author: "faculty" | "student";
  authorName: string;
  body: string;
  sentAt: string;
}

interface Doubt {
  id: string;
  subject: string;
  body: string;
  tag: DoubtTag;
  status: DoubtStatus;
  createdAt: string;
  replies: DoubtReply[];
}

const TAGS: DoubtTag[] = [
  "DSA",
  "System Design",
  "LLD",
  "Web Development",
  "Aptitude",
  "HR",
  "General",
];




// ── Status config — blue/white only ──────────────────
const STATUS_MAP: Record<DoubtStatus, { label: string; dot: string; badge: string }> = {
  pending:  { label: "Awaiting Reply", dot: "bg-blue-400",  badge: "bg-blue-50 text-blue-700 border border-blue-200" },
  answered: { label: "Answered",       dot: "bg-blue-600",  badge: "bg-blue-600 text-white border border-blue-600" },
  resolved: { label: "Resolved",       dot: "bg-gray-400",  badge: "bg-gray-100 text-gray-600 border border-gray-200" },
};

// ── Tag config — blue-scale only ──────────────────────
const TAG_MAP: Record<DoubtTag, string> = {
  "DSA":             "bg-blue-100 text-blue-800",
  "System Design":   "bg-blue-50 text-blue-700",
  "LLD":             "bg-slate-100 text-slate-700",
  "Web Development": "bg-sky-50 text-sky-700",
  "Aptitude":        "bg-indigo-50 text-indigo-700",
  "HR":              "bg-gray-100 text-gray-700",
  "General":         "bg-gray-50 text-gray-600",
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function StatusBadge({ status }: { status: DoubtStatus }) {
  const { label, badge } = STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${badge}`}>
      {label}
    </span>
  );
}

function TagPill({ tag }: { tag: DoubtTag }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${TAG_MAP[tag]}`}>
      <Tag className="w-2.5 h-2.5" /> {tag}
    </span>
  );
}

function DoubtCard({ doubt, onResolve, onReply }: { 
  doubt: Doubt; 
  onResolve: (id: string) => void;
  onReply: (id: string, body: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(doubt.status === "answered");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || isSending) return;
    setIsSending(true);
    try {
      await onReply(doubt.id, text);
      setReplyText("");
      toast.success("Reply sent!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send reply.");
    } finally {
      setIsSending(false);
    }
  };

  const leftAccent =
    doubt.status === "answered" ? "border-l-blue-600" :
    doubt.status === "pending"  ? "border-l-blue-300" : "border-l-gray-300";

  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${leftAccent} rounded`}>
      {/* Header row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50:bg-slate-800/60"
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <TagPill tag={doubt.tag} />
            <StatusBadge status={doubt.status} />
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo(doubt.createdAt)}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 leading-snug">{doubt.subject}</p>
          {!open && (
            <p className="text-xs text-gray-400 line-clamp-1">{doubt.body}</p>
          )}
        </div>
        <span className="text-gray-300 mt-0.5 shrink-0">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {/* Question body */}
          <div className="px-4 py-3 bg-gray-50">
            <p className="text-sm text-gray-600 leading-relaxed">{doubt.body}</p>
          </div>

          {/* Replies */}
          {doubt.replies.map((r) => (
            <div key={r.id} className={`flex gap-3 px-4 py-3 border-t border-gray-100 ${r.author === "faculty" ? "bg-blue-50/40" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                r.author === "faculty" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
              }`}>
                {r.authorName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-semibold ${r.author === "faculty" ? "text-blue-700" : "text-gray-700"}`}>
                    {r.authorName}
                  </span>
                  {r.author === "faculty" && (
                    <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-sm tracking-wide">
                      FACULTY
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400">{timeAgo(r.sentAt)}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))}

          {/* Pending notice */}
          {doubt.status === "pending" && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 text-xs text-blue-600 bg-blue-50/50">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Waiting for faculty reply — typically within 24 hours
            </div>
          )}

          {/* Follow-up input (only for answered) */}
          {doubt.status === "answered" && (
            <div className="px-4 py-3 border-t border-gray-100 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && replyText.trim().length > 0) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Write a follow-up..."
                  className="flex-1 text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isSending}
                />
                <button
                  onClick={handleSendReply}
                  disabled={isSending || replyText.trim().length === 0}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send reply"
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={() => onResolve(doubt.id)}
                className="text-xs text-gray-500 font-medium hover:text-blue-600 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" /> Mark as Resolved
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewDoubtDrawer({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (d: Omit<Doubt, "id" | "replies" | "createdAt" | "status">) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<DoubtTag>("DSA");

  const canSubmit = subject.trim().length >= 5 && body.trim().length >= 20;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Ask a Doubt</h2>
            <p className="text-xs text-gray-400 mt-0.5">Faculty typically replies within 24 hours</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Tag */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Topic Area</label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`px-3 py-1 rounded text-xs font-semibold border ${
                    tag === t
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, 100))}
              placeholder="e.g. How to approach graph BFS problems?"
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-right">{subject.length}/100</p>
            {subject.trim().length > 0 && subject.trim().length < 5 && (
              <p className="text-[11px] text-red-500 mt-1">Subject must be at least 5 characters</p>
            )}
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Describe Your Doubt</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Explain your doubt in detail..."
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-[10px] mt-1 text-right">
              {body.trim().length < 20
                ? <span className="text-orange-500">{body.trim().length}/20 chars minimum</span>
                : <span className="text-green-500">{body.trim().length} chars ✓</span>
              }
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b">
          <button onClick={onClose} className="text-sm text-gray-500 px-3 py-1.5">Cancel</button>
          <button
            disabled={!canSubmit}
            onClick={() => { onSubmit({ subject, body, tag }); onClose(); }}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded ${
              canSubmit ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function DoubtsPageInner() {
  usePageTitle("Ask a Doubt");
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Failures here used to be swallowed into an empty list, so a network error
  // was indistinguishable from "you have no doubts yet".
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | DoubtStatus>("all");
  // BUG-C FIX: Get real student name for reply authorName
  const { data: profile } = useProfile();

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    import("@/lib/api").then(({ getDoubts }) =>
      getDoubts().then((data: any[]) => {
        const mapped: Doubt[] = data.map((d) => ({
          id: d._id,
          subject: d.subject,
          body: d.body,
          tag: (d.tag ?? "General") as DoubtTag,
          status: (d.status === "closed" ? "resolved" : d.status) as DoubtStatus,
          createdAt: d.createdAt,
          replies: (d.replies ?? []).map((r: any) => ({
            id: r._id ?? String(Math.random()),
            author: r.authorRole === "faculty" ? "faculty" : "student",
            authorName: r.authorName,
            body: r.body,
            sentAt: r.sentAt,
          })),
        }));
        if (mapped.length > 0) setDoubts(mapped);
        setIsLoading(false);
      }).catch((err: unknown) => {
        setLoadError(err instanceof Error ? err : new Error('Failed to load doubts.'));
        setIsLoading(false);
      })
    ).catch((err: unknown) => {
      setLoadError(err instanceof Error ? err : new Error('Failed to load doubts.'));
      setIsLoading(false);
    });
  }, [reloadKey]);

  const handleSubmit = (d: Omit<Doubt, "id" | "replies" | "createdAt" | "status">) => {
    import("@/lib/hooks").then(({ createDoubt }) =>
      createDoubt({ subject: d.subject, body: d.body, tag: d.tag })
        .then((created: any) => {
          setDoubts((prev) => [{
            id: created._id,
            subject: created.subject,
            body: created.body,
            tag: created.tag as DoubtTag,
            status: "pending",
            createdAt: created.createdAt,
            replies: [],
          }, ...prev]);
          toast.success("Doubt submitted successfully!");
        })
        .catch((err) => {
          toast.error(err?.message || "Failed to submit doubt.");
        })
    ).catch(() => {
      toast.error("Failed to submit doubt.");
    });
  };

  const handleResolve = (id: string) => {
    import("@/lib/hooks").then(({ resolveDoubt }) => {
      // Optimistic update
      setDoubts((prev) => prev.map((d) => d.id === id ? { ...d, status: "resolved" } : d));
      resolveDoubt(id)
        .then(() => toast.success("Doubt marked as resolved!"))
        .catch((err) => {
          toast.error(err?.message || "Failed to resolve doubt.");
          // Revert on error
          setDoubts((prev) => prev.map((d) => d.id === id ? { ...d, status: "answered" } : d));
        });
    });
  };

  const handleReply = async (id: string, body: string): Promise<void> => {
    const res = await fetch(`/api/doubts/${id}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Failed to send reply.");
    }
    // Optimistically append reply to local state
    const json = await res.json();
    const newReply: DoubtReply = {
      id: String(Date.now()),
      author: "student",
      // BUG-C FIX: Use real student name from profile instead of hardcoded "You"
      authorName: (profile?.fullName as string) ?? "You",
      body,
      sentAt: new Date().toISOString(),
    };
    setDoubts((prev) => prev.map((d) =>
      d.id === id ? { ...d, replies: [...d.replies, newReply] } : d
    ));
  };

  const filtered = filter === "all" ? doubts : doubts.filter((d) => d.status === filter);
  const counts = {
    all: doubts.length,
    pending: doubts.filter((d) => d.status === "pending").length,
    answered: doubts.filter((d) => d.status === "answered").length,
    resolved: doubts.filter((d) => d.status === "resolved").length,
  };

  if (loadError) {
    return (
      <ErrorState
        error={loadError}
        title="Couldn't load your doubts"
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex gap-6">
        <div className="flex-1 min-w-0 animate-pulse">
          <div className="h-7 bg-gray-100 rounded w-32 mb-5" />
          <div className="flex gap-2 mb-5">
            {[...Array(4)].map((_, i) => <div key={i} className="h-8 w-20 bg-gray-100 rounded" />)}
          </div>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded border border-gray-200" />
            ))}
          </div>
        </div>
        <aside className="hidden lg:block w-64 shrink-0 space-y-4 animate-pulse">
          <div className="h-36 bg-gray-100 rounded-xl" />
          <div className="h-48 bg-gray-100 rounded-xl" />
          <div className="h-28 bg-gray-100 rounded-xl" />
        </aside>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* ── Main: Doubts list ── */}
      <div className="flex-1 min-w-0">
        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Doubts</h1>
            <p className="text-xs text-gray-400 mt-0.5">Ask questions · Get answers from faculty</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-0 border border-gray-200 rounded overflow-hidden mb-5 w-fit bg-white">
          {(["all", "pending", "answered", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold capitalize border-r border-gray-200 last:border-r-0 ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:bg-gray-50:bg-slate-800/60"
              }`}
            >
              {f}
              <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${
                filter === f ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { label: "Total Doubts",   value: counts.all,      color: "text-gray-900" },
            { label: "Awaiting Reply", value: counts.pending,  color: "text-blue-600" },
            { label: "Resolved",       value: counts.resolved, color: "text-gray-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded px-3 py-2.5">
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-14 bg-white border border-gray-200 rounded">
              <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-400">No doubts in this category</p>
            </div>
          ) : (
            filtered.map((d) => <DoubtCard key={d.id} doubt={d} onResolve={handleResolve} onReply={handleReply} />)
          )}
        </div>
      </div>

      {/* ── Right Panel: Tips + Info ── */}
      <aside className="hidden lg:block w-64 shrink-0 space-y-4">
        {/* Ask a doubt CTA */}
        <div className="bg-blue-600 rounded-xl p-5">
          <MessageCircle className="w-7 h-7 text-white mb-3" />
          <h3 className="text-white font-bold text-sm mb-1">Have a doubt?</h3>
          <p className="text-blue-200 text-xs mb-4">Faculty reviews all doubts within 24 hours.</p>
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-white text-blue-700 font-semibold text-xs py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Ask a Doubt
          </button>
        </div>

        {/* Tips for a great doubt */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">Tips for a Good Doubt</h3>
          <ul className="space-y-2.5">
            {[
              { icon: CheckCircle2, text: "Be specific — include error messages or code snippets" },
              { icon: Tag, text: "Tag correctly (DSA, System Design, etc.)" },
              { icon: AlertCircle, text: "Mention what you already tried" },
              { icon: Clock, text: "One doubt per question — keep it focused" },
            ].map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <Icon className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Quick stats */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">Your Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Doubts Asked</span>
              <span className="text-sm font-bold text-gray-900">{counts.all}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Answered</span>
              <span className="text-sm font-bold text-blue-600">{counts.answered}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Resolved</span>
              <span className="text-sm font-bold text-gray-500">{counts.resolved}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Resolution Rate</span>
              <span className="text-sm font-bold text-green-600">
                {counts.all > 0 ? Math.round((counts.resolved / counts.all) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setShowForm(true)}
        className="lg:hidden fixed bottom-20 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors z-40"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {showForm && <NewDoubtDrawer onClose={() => setShowForm(false)} onSubmit={handleSubmit} />}
    </div>
  );
}



// Admin feature-toggle gate (Feature Controls → student.doubts)
export default function DoubtsPageGate() {
  return (
    <FeatureGate feature="student.doubts" title="Ask a Doubt">
      <DoubtsPageInner  />
    </FeatureGate>
  );
}
