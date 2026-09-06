"use client";

/**
 * Custom roadmaps index — shared by both staff portals.
 * Faculty see what they authored; admins see everything (the API decides).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, CalendarRange, Layers, Loader2, Plus, Users,
} from "lucide-react";
import { listRoadmaps, type RoadmapStatus, type RoadmapSummary } from "@/lib/staff/customRoadmaps";

const STATUS_STYLE: Record<RoadmapStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  published: "bg-green-50 text-green-700",
  retired: "bg-amber-50 text-amber-700",
};
const STATUS_LABEL: Record<RoadmapStatus, string> = {
  draft: "Draft",
  published: "Published",
  retired: "Hidden",
};

export default function RoadmapList({ basePath }: { basePath: string }) {
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRoadmaps().then(setRoadmaps).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Custom Roadmaps</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Build a multi-company prep plan and publish it for students to follow.
          </p>
        </div>
        <Link
          href={`${basePath}/custom-roadmaps/new`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New roadmap
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {!roadmaps && !error && (
        <div className="flex items-center gap-2 py-16 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {roadmaps?.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <Layers className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">No custom roadmaps yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
            Pick a few companies, choose the questions worth practising, arrange them into weeks,
            and publish.
          </p>
          <Link
            href={`${basePath}/custom-roadmaps/new`}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Create the first one
          </Link>
        </div>
      )}

      <div className="space-y-2.5">
        {roadmaps?.map((r) => (
          <Link
            key={r.id}
            href={`${basePath}/custom-roadmaps/${r.id}`}
            className="block rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 hover:bg-gray-50/60"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-gray-900">{r.title}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  {/* Admins see every roadmap, so the author matters here. */}
                  {!r.isMine && (
                    <span className="text-[11px] text-gray-400">by {r.createdByName}</span>
                  )}
                </div>
                {r.description && (
                  <p className="mt-1 line-clamp-1 text-sm text-gray-500">{r.description}</p>
                )}
              </div>

              {r.followerCount > 0 && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                  <Users className="h-3 w-3" />
                  {r.followerCount} following
                </span>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <CalendarRange className="h-3.5 w-3.5 text-gray-400" />
                {r.weekCount} week{r.weekCount === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-gray-400" />
                {r.questionCount} question{r.questionCount === 1 ? "" : "s"}
              </span>
              {r.companyNames.length > 0 && (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">{r.companyNames.join(", ")}</span>
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
