"use client";

/**
 * Student view of one faculty-authored roadmap.
 *
 * Read-only apart from follow/unfollow. Questions link to /practice/[id], the
 * same as the company roadmap curriculum does, so completion and XP stay in
 * one place rather than being reimplemented here.
 */

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, CheckCircle, ExternalLink, Globe, Info,
  Loader2, Users,
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
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="mx-auto max-w-4xl py-16 text-center">
        <Info className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <h1 className="text-lg font-bold text-gray-900">This roadmap isn&apos;t available</h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
          It may have been unpublished, or the link may be wrong.
        </p>
        <Link
          href="/roadmap"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to roadmaps
        </Link>
      </div>
    );
  }

  const p = roadmap.progress;
  const done = new Set(roadmap.completedQuestionIds);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/roadmap"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" /> My Roadmaps
      </Link>

      {/* ── header ── */}
      <header className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{roadmap.title}</h1>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                Custom
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">by {roadmap.createdByName}</p>
            {roadmap.description && (
              <p className="mt-2 max-w-2xl text-sm text-gray-600">{roadmap.description}</p>
            )}
          </div>

          <button
            onClick={toggleFollow}
            disabled={busy || (!roadmap.isFollowing && roadmap.isRetired)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
              roadmap.isFollowing
                ? "border border-gray-200 text-gray-700 hover:bg-gray-50"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {roadmap.isFollowing ? "Following" : "Follow this roadmap"}
          </button>
        </div>

        {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          {roadmap.companyNames.length > 0 && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{roadmap.companyNames.join(", ")}</span>
            </span>
          )}
          {roadmap.followerCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              {roadmap.followerCount} following
            </span>
          )}
        </div>

        {/* Only meaningful once you're following — otherwise it always reads 0%. */}
        {roadmap.isFollowing && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-600">
                {p.doneQuestions} of {p.totalQuestions} solved
              </span>
              <span className="font-bold text-indigo-700">{p.pctComplete}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${p.pctComplete}%` }} />
            </div>
          </div>
        )}
      </header>

      {roadmap.isRetired && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Your faculty has stopped offering this roadmap to new students. You can keep following
            it and your progress is safe — but if you unfollow, you won&apos;t be able to rejoin.
          </span>
        </div>
      )}

      {/* ── weeks ── */}
      <div className="mt-6 space-y-5">
        {roadmap.weeks.map((week) => {
          const wp = p.weeks.find((x) => x.weekNumber === week.weekNumber);
          return (
            <section key={week.weekNumber}>
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-900 text-[11px] font-bold text-white">
                  {week.weekNumber}
                </span>
                <h2 className="text-base font-semibold text-gray-900">{week.label}</h2>
                {wp && (
                  <span className="text-xs text-gray-500">
                    {wp.done}/{wp.total}
                    {wp.total > 0 && roadmap.isFollowing && (
                      <span className="ml-1 font-semibold text-indigo-600">{wp.pct}%</span>
                    )}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {week.questions.map((q) => {
                  const isDone = done.has(q.id);
                  // XP derived from difficulty, not q.xp: xpValue is stale in
                  // many DB records, which is why the rest of the app derives
                  // it too. Keeping the same rule avoids a roadmap showing +10
                  // for a Hard question the dashboard shows as +50.
                  const xp = q.difficulty === "Hard" ? 50 : q.difficulty === "Medium" ? 25 : 10;
                  return (
                    <div
                      key={q.id}
                      onClick={() => router.push(`/practice/${q.id}`)}
                      className="group flex cursor-pointer flex-col justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors hover:border-blue-300 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="flex min-w-0 items-start gap-3 sm:items-center">
                        <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border sm:mt-0 ${isDone ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"}`}>
                          {isDone && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <span className={`truncate text-sm font-semibold ${isDone ? "text-gray-400 line-through" : "text-gray-700 group-hover:text-blue-600"}`}>
                          {q.title}
                        </span>
                      </div>

                      <div className="ml-8 flex shrink-0 items-center gap-2.5 sm:ml-0">
                        {q.isExternal ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                            <Globe className="h-3 w-3" /> External
                          </span>
                        ) : q.companyName ? (
                          <span className="hidden text-[11px] text-gray-400 sm:inline">{q.companyName}</span>
                        ) : null}
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          q.difficulty === "Easy" ? "border-green-200 bg-green-50 text-green-700"
                          : q.difficulty === "Medium" ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-red-200 bg-red-50 text-red-700"
                        }`}>
                          {q.difficulty}
                        </span>
                        <span className="text-xs font-bold text-orange-500">+{xp} XP</span>
                        {q.practiceUrl && (
                          <a
                            href={q.practiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Open ${q.title} in a new tab`}
                            className="rounded-xl p-1 text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
