"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Loader2, CheckCircle, Lightbulb,
  ChevronDown, ChevronUp, Zap, Tag, RotateCcw, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useQuestion, useCompletedQuestions, completeQuestion } from "@/lib/hooks";
import { getPracticeUrl, getPlatformInfo } from "@/lib/constants";
import { mutate as globalMutate } from "swr";

// ── Platform badge colours ────────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, { bg: string; text: string; abbr: string }> = {
  LeetCode:    { bg: "bg-orange-100", text: "text-orange-700", abbr: "LC" },
  Codeforces:  { bg: "bg-blue-100",   text: "text-blue-700",   abbr: "CF" },
  HackerRank:  { bg: "bg-green-100",  text: "text-green-700",  abbr: "HR" },
  CodeChef:    { bg: "bg-amber-100",  text: "text-amber-700",  abbr: "CC" },
  GeeksforGeeks: { bg: "bg-lime-100", text: "text-lime-700",   abbr: "GFG" },
  InterviewBit: { bg: "bg-purple-100", text: "text-purple-700", abbr: "IB" },
};

const DIFF_COLORS: Record<string, string> = {
  Easy:   "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-blue-100  text-blue-700  border-blue-200",
  Hard:   "bg-red-100   text-red-700   border-red-200",
};

// ── Collapsible section ───────────────────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 font-semibold text-sm text-gray-800">
          <Icon className="w-4 h-4 text-gray-500" />
          {title}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-white border-t border-gray-100 text-sm text-gray-700 leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: question, isLoading, error } = useQuestion(id);
  const { completedSet, mutate: mutateCompleted } = useCompletedQuestions();
  const [completing, setCompleting] = useState(false);
  const [undoing, setUndoing] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm">{error?.message ?? "Question not found."}</p>
        <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const qId = (question._id ?? question.id ?? id).toString();
  const isSolved = completedSet.has(qId);

  const title       = question.problemSummary ?? question.title ?? "Untitled";
  const difficulty  = question.difficulty ?? question.diff ?? "Medium";
  const roundType   = question.roundType as string | undefined;
  const topics      = (question.topics as string[] | undefined) ?? [];
  const hints       = (question.hints as string[] | undefined) ?? [];
  const keyPoints   = (question.keyPoints as string[] | undefined) ?? [];
  const followUps   = (question.followUpQuestions as string[] | undefined) ?? [];
  const sampleAns   = question.sampleAnswer as string | undefined;
  const explanation = question.explanation as string | undefined;
  const xp = difficulty === "Hard" ? 50 : difficulty === "Medium" ? 25 : 10;

  const practiceUrl = getPracticeUrl(question);
  const platformName = practiceUrl ? getPlatformInfo(practiceUrl).name : null;
  const platformStyle = platformName ? (PLATFORM_COLORS[platformName] ?? { bg: "bg-gray-100", text: "text-gray-700", abbr: platformName.slice(0, 2).toUpperCase() }) : null;

  const handleMarkDone = async () => {
    if (isSolved) return;
    setCompleting(true);
    try {
      await completeQuestion(qId);
      await mutateCompleted();
      await Promise.all([
        globalMutate("/api/dashboard"),
        globalMutate("/api/progress"),
        globalMutate("/api/user/me/roadmap"),
        globalMutate("/api/user/me"),
      ]);
      toast.success(`+${xp} XP earned!`);
    } catch (err: any) {
      const msg = err?.message ?? "Failed to mark done.";
      if (msg.includes("Link your") || msg.includes("platform profile") || msg.includes("handle")) {
        toast.error(msg, { duration: 6000 });
      } else if (msg.includes("Solve it first") || msg.includes("not found") || msg.includes("submission")) {
        toast.error(msg, { duration: 6000 });
      } else {
        toast.error(msg);
      }
    } finally {
      setCompleting(false);
    }
  };

  const handleUndo = async () => {
    if (!isSolved) return;
    setUndoing(true);
    try {
      await fetch(`/api/questions/${qId}/complete`, { method: "DELETE", credentials: "include" });
      await mutateCompleted();
      await Promise.all([
        globalMutate("/api/dashboard"),
        globalMutate("/api/progress"),
        globalMutate("/api/user/me/roadmap"),
        globalMutate("/api/user/me"),
      ]);
      toast(`-${xp} XP removed`);
    } catch {
      toast.error("Failed to undo.");
    } finally {
      setUndoing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {isSolved ? (
            <button
              onClick={handleUndo}
              disabled={undoing}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              {undoing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Undo
            </button>
          ) : null}

          <button
            onClick={handleMarkDone}
            disabled={completing || isSolved}
            className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-60 ${
              isSolved
                ? "bg-green-100 text-green-700 border border-green-200 cursor-default"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {completing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isSolved ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : null}
            {isSolved ? "Solved" : "Mark Done"}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Header card ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
            {/* Difficulty */}
            <span className={`font-bold px-2.5 py-1 rounded-full border ${DIFF_COLORS[difficulty] ?? DIFF_COLORS.Medium}`}>
              {difficulty}
            </span>

            {/* Round type */}
            {roundType && (
              <span className="font-medium px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600">
                {roundType}
              </span>
            )}

            {/* Platform badge */}
            {platformStyle && (
              <span className={`font-bold px-2.5 py-1 rounded-full ${platformStyle.bg} ${platformStyle.text}`}>
                {platformStyle.abbr}
              </span>
            )}

            {/* XP */}
            <span className="flex items-center gap-1 ml-auto font-semibold text-yellow-600">
              <Zap className="w-3.5 h-3.5" />
              {xp} XP
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug mb-4">
            {title}
          </h1>

          {/* Topics */}
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topics.map((t) => (
                <span key={t} className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  <Tag className="w-2.5 h-2.5" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Platform CTA ── */}
        {practiceUrl && (
          <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${platformStyle?.bg ?? "bg-gray-50"} border-opacity-60 border-gray-200`}>
            <div>
              <p className="text-sm font-semibold text-gray-800">Solve on {platformName ?? "the platform"}</p>
              <p className="text-xs text-gray-500 mt-0.5">Come back and click "Mark Done" once you&apos;ve submitted your solution.</p>
            </div>
            <a
              href={practiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 shrink-0 text-sm font-semibold px-4 py-2 rounded-xl ${platformStyle?.text ?? "text-blue-700"} ${platformStyle?.bg ?? "bg-blue-100"} hover:brightness-95 transition`}
            >
              Open
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* ── Hints ── */}
        {hints.length > 0 && (
          <Section title={`Hints (${hints.length})`} icon={Lightbulb}>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
              {hints.map((h, i) => <li key={i}>{h}</li>)}
            </ol>
          </Section>
        )}

        {/* ── Key Points ── */}
        {keyPoints.length > 0 && (
          <Section title="Key Points" icon={CheckCircle} defaultOpen>
            <ul className="space-y-1.5">
              {keyPoints.map((kp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {kp}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ── Sample Answer ── */}
        {sampleAns && (
          <Section title="Sample Answer" icon={CheckCircle} defaultOpen>
            <p className="whitespace-pre-wrap text-gray-700">{sampleAns}</p>
          </Section>
        )}

        {/* ── Explanation ── */}
        {explanation && (
          <Section title="Explanation" icon={Lightbulb} defaultOpen>
            <p className="whitespace-pre-wrap text-gray-700">{explanation}</p>
          </Section>
        )}

        {/* ── Follow-up Questions ── */}
        {followUps.length > 0 && (
          <Section title={`Follow-up Questions (${followUps.length})`} icon={Tag}>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
              {followUps.map((f, i) => <li key={i}>{f}</li>)}
            </ol>
          </Section>
        )}

        {/* Bottom mark-done CTA for mobile convenience */}
        {!isSolved && (
          <div className="pt-2 pb-6">
            <button
              onClick={handleMarkDone}
              disabled={completing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {completing && <Loader2 className="w-4 h-4 animate-spin" />}
              Mark as Done — Earn {xp} XP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
