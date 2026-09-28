"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Loader2, CheckCircle, Lightbulb,
  ChevronDown, ChevronUp, Zap, Tag, RotateCcw, AlertCircle,
  ShieldCheck, ShieldAlert, Sparkles, AlertTriangle, X, Link2,
} from "lucide-react";
import { toast } from "sonner";
import { useQuestion, useCompletedQuestions, completeQuestion, usePlatformProfiles } from "@/lib/hooks";
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
  const { data: profileData } = usePlatformProfiles();
  const [completing, setCompleting] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

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
  const platformInfo = practiceUrl ? getPlatformInfo(practiceUrl) : null;
  const platformName = platformInfo?.name;
  const isSupportedPlatform = platformName === "LeetCode" || platformName === "Codeforces";

  const handles = profileData?.handles ?? {};
  const userHandle =
    platformName === "LeetCode"
      ? handles.leetcode
      : platformName === "Codeforces"
      ? handles.codeforces
      : null;
  const isConnected = isSupportedPlatform && Boolean(userHandle?.trim());
  const platformStyle = platformName ? (PLATFORM_COLORS[platformName] ?? { bg: "bg-gray-100", text: "text-gray-700", abbr: platformName.slice(0, 2).toUpperCase() }) : null;

  const handleActionClick = () => {
    if (isSolved) return;
    if (isSupportedPlatform && !isConnected) {
      setShowWarningModal(true);
      return;
    }
    handleMarkDone();
  };

  const handleMarkDone = async (bypassWarning = false) => {
    if (isSolved) return;
    if (bypassWarning) setShowWarningModal(false);
    setCompleting(true);
    try {
      const result: any = await completeQuestion(qId);
      await mutateCompleted();
      await Promise.all([
        globalMutate("/api/dashboard"),
        globalMutate("/api/progress"),
        globalMutate("/api/user/me/roadmap"),
        globalMutate("/api/user/me"),
      ]);
      if (result?.unlinkedPlatform) {
        toast.warning(`+${xp} XP earned (Self-marked — unverified)`, {
          description: `Connect your ${result.unlinkedPlatform} account in Profile settings to auto-verify your solves and showcase your profile for placement prep!`,
          action: {
            label: "Connect Profile",
            onClick: () => router.push("/profile"),
          },
          duration: 6000,
        });
      } else if (result?.verifiedViaPlatform) {
        toast.success(`🎉 Solved & Verified via ${result.platformName || platformName || 'platform'}!`, {
          description: `+${xp} XP awarded. Your accepted submission for @${userHandle} was verified!`,
          duration: 5000,
        });
      } else {
        toast.success(`+${xp} XP earned! Problem marked as completed.`);
      }
    } catch (err: any) {
      const msg = err?.message ?? "Failed to mark done.";
      if (msg.includes("No accepted") || msg.includes("Solve it") || msg.includes("not found")) {
        toast.error(msg, {
          description: userHandle
            ? `Make sure your submission was Accepted on ${platformName} under handle @${userHandle}.`
            : undefined,
          duration: 7000,
        });
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

          {isSolved ? (
            <div className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-semibold bg-green-100 text-green-700 border border-green-200 cursor-default">
              <CheckCircle className="w-3.5 h-3.5" />
              Solved
            </div>
          ) : isConnected ? (
            <button
              onClick={handleActionClick}
              disabled={completing}
              className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-60"
            >
              {completing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Verify Submission
            </button>
          ) : (
            <button
              onClick={handleActionClick}
              disabled={completing}
              className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 shadow-sm"
            >
              {completing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              Mark Done
            </button>
          )}
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
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isConnected
                ? "bg-emerald-50/70 border-emerald-200 shadow-sm"
                : isSupportedPlatform
                ? "bg-amber-50/60 border-amber-200 shadow-sm"
                : `${platformStyle?.bg ?? "bg-gray-50"} border-gray-200`
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-900">
                    Solve on {platformName ?? "the platform"}
                  </span>
                  {isSupportedPlatform && (
                    isConnected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        @{userHandle} connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Profile not connected
                      </span>
                    )
                  )}
                </div>

                <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
                  {isConnected ? (
                    <>
                      1. Click <strong>&quot;Open on {platformName}&quot;</strong> to solve and submit your code on {platformName}.<br />
                      2. Return here and click <strong>&quot;Verify Submission&quot;</strong> to auto-verify your solution and earn <strong>{xp} XP</strong>!
                    </>
                  ) : isSupportedPlatform ? (
                    <>
                      Submit your solution on {platformName}. Connect your {platformName} profile in settings to <strong>auto-verify solves</strong> and keep your placement preparation genuine.
                    </>
                  ) : (
                    <>Come back and click &quot;Mark Done&quot; once you&apos;ve submitted your solution.</>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isSupportedPlatform && !isConnected && (
                  <button
                    onClick={() => router.push("/profile")}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 transition shadow-sm"
                  >
                    <Link2 className="w-3.5 h-3.5 text-amber-600" />
                    Connect Profile
                  </button>
                )}
                <a
                  href={practiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl transition ${
                    isConnected
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      : isSupportedPlatform
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                      : `${platformStyle?.text ?? "text-blue-700"} ${platformStyle?.bg ?? "bg-blue-100"} hover:brightness-95`
                  }`}
                >
                  Open on {platformName ?? "Platform"}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
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

        {/* Bottom CTA */}
        {!isSolved && (
          <div className="pt-2 pb-6 space-y-2">
            {isConnected ? (
              <>
                <button
                  onClick={handleActionClick}
                  disabled={completing}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {completing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Verify Submission — Earn {xp} XP
                </button>
                <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Verifying accepted solve for @{userHandle} on {platformName}
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={handleActionClick}
                  disabled={completing}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
                >
                  {completing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Mark as Done — Earn {xp} XP
                </button>
                {isSupportedPlatform && (
                  <p className="text-center text-xs text-amber-700 flex items-center justify-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Unverified — connect your {platformName} profile to verify progress
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Unverified Submission Warning Modal ── */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setShowWarningModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 leading-snug">
              Unverified Submission Warning
            </h3>

            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              You are marking this <span className="font-semibold text-gray-900">{platformName}</span> question as done <strong>without platform verification</strong>.
            </p>

            <div className="my-4 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Make your progress genuine & valid
              </div>
              <p className="text-amber-800">
                Connecting your {platformName} profile allows PlacePrep to automatically confirm that you solved this problem on {platformName}. This ensures your placement prep progress is authentic and builds an impressive public profile for recruiters.
              </p>
            </div>

            <div className="space-y-2 mt-5">
              <button
                onClick={() => router.push("/profile")}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Link2 className="w-4 h-4" />
                Connect {platformName} Profile
              </button>

              <button
                onClick={() => handleMarkDone(true)}
                disabled={completing}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Mark Done Anyway (Unverified)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
