"use client";

/**
 * Custom roadmaps on the student /roadmap page.
 *
 * Deliberately styled as a third strip alongside "My Roadmaps" and "Explore
 * More Roadmaps" — same horizontal scroller, same card shell (h-9 tile, blue
 * accents, [10px] meta type), so it reads as part of the page rather than a
 * bolted-on feature. The only visual difference is the tile icon, since a plan
 * spanning several companies has no single logo to show.
 *
 * Renders nothing when no custom roadmaps exist, leaving the page untouched
 * for students whose faculty have published none.
 */

import Link from "next/link";
import { useState } from "react";
import { Loader2, Route } from "lucide-react";
import { CompanyLogo, CompanyLogoStack } from "@/components/ui";
import {
  followRoadmap, useCustomRoadmaps, type CustomRoadmapCard,
} from "@/lib/customRoadmaps";

export default function CustomRoadmapSection() {
  const { data: roadmaps, isLoading, mutate } = useCustomRoadmaps();

  if (isLoading) {
    return (
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Custom Roadmaps</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="min-w-[300px] h-[74px] bg-gray-100 rounded-xl animate-pulse shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (!roadmaps || roadmaps.length === 0) return null;

  // Followed first — the ones they're working through matter more than the catalogue.
  const ordered = [...roadmaps].sort((a, b) => Number(b.isFollowing) - Number(a.isFollowing));

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">Custom Roadmaps</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1">
        {ordered.map((r) => (
          <CustomRoadmapCardView key={r.id} roadmap={r} onChanged={() => mutate()} />
        ))}
      </div>
    </section>
  );
}

function CustomRoadmapCardView({
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
      className={`flex items-center gap-4 px-4 py-3 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all shrink-0 ${
        r.isFollowing ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200 hover:border-blue-300"
      }`}
      style={{ minWidth: 320 }}
    >
      {/* One company reuses the exact tile the company cards use; several are
          stacked; none (an all-external plan) falls back to a neutral icon. */}
      {r.companyNames.length === 1 ? (
        <div className="w-9 h-9 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
          <CompanyLogo name={r.companyNames[0]} size={36} />
        </div>
      ) : r.companyNames.length > 1 ? (
        <CompanyLogoStack names={r.companyNames} size={30} max={3} />
      ) : (
        <div className="w-9 h-9 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
          <Route className="w-4 h-4 text-blue-600" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-gray-900 truncate">{r.title}</p>
          {r.isRetired && (
            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
              ENDED
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-500 truncate">
          by {r.createdByName} · {r.weekCount}w · {r.questionCount} questions
        </p>

        {r.isFollowing ? (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.pctComplete}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-gray-500 shrink-0">
              {r.doneQuestions}/{r.questionCount}
            </span>
          </div>
        ) : (
          <p className="text-[10px] text-blue-600 font-semibold mt-0.5 truncate">
            {r.companyNames.length > 0 ? r.companyNames.join(", ") : "Curated plan"}
          </p>
        )}

        {error && <p className="text-[10px] text-red-600 mt-0.5">{error}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!r.isFollowing && !r.isRetired && (
          <button
            onClick={follow}
            disabled={busy}
            className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 inline-flex items-center gap-1"
          >
            {busy && <Loader2 className="w-3 h-3 animate-spin" />}
            Follow
          </button>
        )}
        <Link
          href={`/roadmap/custom/${r.slug}`}
          onClick={(e) => e.stopPropagation()}
          className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
            r.isFollowing
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {r.isFollowing ? "Continue" : "View"}
        </Link>
      </div>
    </div>
  );
}
