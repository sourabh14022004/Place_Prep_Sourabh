"use client";

/**
 * Custom roadmaps on the student /roadmap page.
 *
 * These sit apart from the per-company cards above them because they are a
 * different kind of thing: one plan authored by faculty that can span several
 * companies, rather than a plan generated for you from one company's topic
 * frequencies. Renders nothing at all when none exist, so the page is unchanged
 * for students whose faculty have not published any.
 */

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, Building2, CalendarRange, CheckCircle2, Layers, Loader2, Users,
} from "lucide-react";
import {
  followRoadmap, useCustomRoadmaps, type CustomRoadmapCard,
} from "@/lib/customRoadmaps";

export default function CustomRoadmapSection() {
  const { data: roadmaps, isLoading, mutate } = useCustomRoadmaps();

  if (isLoading) {
    return (
      <section className="mt-12">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">Custom Roadmaps</h2>
        <div className="flex gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 min-w-[300px] flex-1 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </section>
    );
  }

  // Nothing published yet — stay out of the way rather than showing an empty shell.
  if (!roadmaps || roadmaps.length === 0) return null;

  const following = roadmaps.filter((r) => r.isFollowing);
  const available = roadmaps.filter((r) => !r.isFollowing);

  return (
    <section className="mt-12">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">Custom Roadmaps</h2>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
          from your faculty
        </span>
      </div>
      <p className="mb-5 text-sm text-gray-500">
        Curated plans that can cover several companies at once. Following one is optional — your
        own company roadmaps above are unaffected.
      </p>

      {following.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {following.map((r) => (
            <RoadmapCard key={r.id} roadmap={r} onChanged={() => mutate()} />
          ))}
        </div>
      )}

      {available.length > 0 && (
        <>
          {following.length > 0 && (
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Available to follow
            </h3>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {available.map((r) => (
              <RoadmapCard key={r.id} roadmap={r} onChanged={() => mutate()} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function RoadmapCard({
  roadmap: r,
  onChanged,
}: {
  roadmap: CustomRoadmapCard;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function follow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    setError(null);
    try {
      await followRoadmap(r.slug);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not follow.");
      setBusy(false);
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        r.isFollowing ? "border-indigo-200 bg-indigo-50/40" : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-gray-900">{r.title}</h3>
          <p className="mt-0.5 text-xs text-gray-500">by {r.createdByName}</p>
        </div>
        {r.isRetired && (
          // Retired means closed to new followers. Only someone already
          // following can see this card at all, so explain why it looks odd.
          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            No longer offered
          </span>
        )}
      </div>

      {r.description && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{r.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <CalendarRange className="h-3.5 w-3.5 text-gray-400" />
          {r.weekCount} week{r.weekCount === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-gray-400" />
          {r.questionCount} question{r.questionCount === 1 ? "" : "s"}
        </span>
        {r.followerCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            {r.followerCount}
          </span>
        )}
      </div>

      {r.companyNames.length > 0 && (
        <div className="mt-2 flex min-w-0 items-center gap-1 text-xs text-gray-500">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="truncate">{r.companyNames.join(", ")}</span>
        </div>
      )}

      {r.isFollowing && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-gray-600">
              {r.doneQuestions} of {r.questionCount} solved
            </span>
            <span className="font-bold text-indigo-700">{r.pctComplete}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-indigo-600 transition-all"
              style={{ width: `${r.pctComplete}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3.5 flex items-center gap-2">
        <Link
          href={`/roadmap/custom/${r.slug}`}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            r.isFollowing
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {r.isFollowing ? "Continue" : "View plan"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        {!r.isFollowing && !r.isRetired && (
          <button
            onClick={follow}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Follow
          </button>
        )}
      </div>
    </div>
  );
}
