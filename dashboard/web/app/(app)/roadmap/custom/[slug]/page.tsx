"use client";

/**
 * Student view of one faculty-authored roadmap.
 *
 * Mirrors the company curriculum view on /roadmap: same hero header, the same
 * expandable week cards, and the same question rows — so moving between a
 * company roadmap and a custom one feels like the same product. Read-only
 * apart from follow/unfollow; questions link to /practice/[id] exactly as the
 * company curriculum does, keeping completion and XP in one place.
 */

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, CheckCircle, ChevronDown, ExternalLink, Globe,
  Info, Loader2, Play, Route, Users,
} from "lucide-react";
import {
  followRoadmap, unfollowRoadmap, useCustomRoadmap,
} from "@/lib/customRoadmaps";

export default function CustomRoadmapDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { data: roadmap, error, isLoading, mutate } = useCustomRoadmap(slug);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  // Open the first week that still has work left, so the page lands on
  // something actionable instead of a wall of collapsed rows.
  const defaultOpenWeek = useMemo(() => {
    if (!roadmap) return null;
    const next = roadmap.progress.weeks.find((w) => w.done < w.total);
    return next?.weekNumber ?? roadmap.weeks[0]?.weekNumber ?? null;
  }, [roadmap]);

  const openWeek = expandedWeek ?? defaultOpenWeek;

  async function toggleFollow() {
    if (!roadmap) return;
    setBusy(true);
    setActionError(null);
    try {
      if (roadmap.isFollowing) await unfollowRoadmap(slug);
      else await followRoadmap(slug);
      await mutate();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded-lg w-48 animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="text-center py-16">
        <div className="flex justify-center mb-3 text-gray-300">
          <Info className="w-12 h-12" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">This roadmap isn&apos;t available</h2>
        <p className="text-gray-500 text-sm mb-6">
          It may have been unpublished, or the link may be wrong.
        </p>
        <Link
          href="/roadmap"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Back to My Roadmaps
        </Link>
      </div>
    );
  }

  const p = roadmap.progress;
  const done = new Set(roadmap.completedQuestionIds);

  return (
    <div className="pb-12">
      <Link
        href="/roadmap"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> My Roadmaps
      </Link>

      {/* ── Hero Header (mirrors the company curriculum hero) ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
            <Route className="w-6 h-6 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{roadmap.title}</h1>
            <p className="text-gray-500 text-sm">
              by {roadmap.createdByName} · {roadmap.weeks.length}-week plan
            </p>
            {roadmap.description && (
              <p className="text-gray-500 text-sm mt-1">{roadmap.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-end md:items-center gap-6 w-full md:w-auto">
          {/* Only meaningful once following — otherwise it always reads 0%. */}
          {roadmap.isFollowing && (
            <div className="w-full md:w-64">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-2xl font-bold text-gray-900 leading-none">{p.pctComplete}%</span>
                <span className="text-xs text-gray-500 font-medium">
                  {p.doneQuestions}/{p.totalQuestions} solved
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${p.pctComplete}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 shrink-0">
            <button
              onClick={toggleFollow}
              disabled={busy || (!roadmap.isFollowing && roadmap.isRetired)}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50 ${
                roadmap.isFollowing
                  ? "bg-white hover:bg-gray-50 border border-gray-200 text-gray-700"
                  : "bg-gray-900 hover:bg-gray-800 text-white"
              }`}
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {roadmap.isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* ── Meta strip ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-6">
        {roadmap.companyNames.length > 0 && (
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{roadmap.companyNames.join(", ")}</span>
          </span>
        )}
        {roadmap.followerCount > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            {roadmap.followerCount} following
          </span>
        )}
      </div>

      {roadmap.isRetired && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <div className="bg-amber-100 text-amber-600 rounded-full p-1 mt-0.5 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-amber-800 font-bold text-sm">No longer offered to new students</h3>
            <p className="text-amber-700 text-xs mt-1 font-medium">
              You can keep following this and your progress is safe. If you unfollow, you won&apos;t
              be able to rejoin.
            </p>
          </div>
        </div>
      )}

      {/* ── Weeks ── */}
      <div className="space-y-4">
        {roadmap.weeks.map((week) => {
          const wp = p.weeks.find((x) => x.weekNumber === week.weekNumber);
          const total = wp?.total ?? week.questions.length;
          const doneCount = wp?.done ?? 0;
          const pct = wp?.pct ?? 0;
          const isComplete = total > 0 && doneCount === total;
          const isExpanded = openWeek === week.weekNumber;

          return (
            <div
              key={week.weekNumber}
              className={`border rounded-xl bg-white overflow-hidden transition-all ${
                isExpanded ? "border-blue-200 shadow-sm" : "border-gray-200"
              }`}
            >
              <div
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedWeek(isExpanded ? -1 : week.weekNumber)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {isComplete ? (
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                  ) : (
                    <Play className="w-6 h-6 text-blue-600 fill-blue-50 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isComplete ? "text-gray-500" : "text-blue-600"}`}>
                        WEEK {week.weekNumber}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-gray-900 truncate">{week.label}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right w-28 hidden sm:block">
                    <div className="text-xs font-bold text-gray-700 mb-1">
                      {doneCount}/{total}
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{pct}% done</span>
                      <div className="w-12 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${isComplete ? "bg-green-500" : "bg-blue-600"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-3">
                  {week.questions.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-3">No questions in this week.</p>
                  )}
                  {week.questions.map((q) => {
                    const isDone = done.has(q.id);
                    // Derived from difficulty, not q.xp: xpValue is stale in many
                    // records, and the rest of the app derives it the same way —
                    // otherwise a Hard question reads +10 here and +50 elsewhere.
                    const xp = q.difficulty === "Hard" ? 50 : q.difficulty === "Medium" ? 25 : 10;
                    return (
                      <div
                        key={q.id}
                        onClick={() => router.push(`/practice/${q.id}`)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors cursor-pointer group gap-2 sm:gap-4"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${isDone ? "bg-green-500 border-green-500" : "border-gray-300 bg-white"}`}>
                            {isDone && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={`font-semibold text-sm truncate ${isDone ? "text-gray-400 line-through" : "text-gray-700 group-hover:text-blue-600"}`}>
                            {q.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-8 sm:ml-0">
                          {q.isExternal ? (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                              <Globe className="w-3 h-3" /> External
                            </span>
                          ) : q.companyName ? (
                            <span className="hidden sm:inline text-[10px] text-gray-400 font-medium">{q.companyName}</span>
                          ) : null}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            q.difficulty === "Easy" ? "bg-green-50 text-green-700 border-green-200"
                            : q.difficulty === "Medium" ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-red-50 text-red-700 border-red-200"
                          }`}>
                            {q.difficulty}
                          </span>
                          <span className="text-xs font-bold text-orange-500 flex items-center gap-0.5">
                            +{xp} XP
                          </span>
                          {q.practiceUrl && (
                            <a
                              href={q.practiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Open ${q.title} in a new tab`}
                              className="text-blue-500 hover:text-blue-700 p-1 rounded-xl hover:bg-blue-50 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
