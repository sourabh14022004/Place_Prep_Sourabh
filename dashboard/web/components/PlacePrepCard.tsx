"use client";

import { Flame, Trophy, Zap, Target } from "lucide-react";
import { ProgressRing } from "./Stats";

interface PlacePrepCardProps {
  name: string;
  initials: string;
  batch?: string;
  branch?: string;
  solved: number;
  currentStreak: number;
  bestStreak: number;
  xp: number;
  batchRank?: number | null;
  prepScore: number;
}

/**
 * The "PlacePrep Card" — our Codolio-Card equivalent.
 * A dense, gradient, screenshot-friendly summary of a student's real numbers.
 * Rendered on the Profile page; users screenshot & share it on LinkedIn.
 */
export default function PlacePrepCard({
  name,
  initials,
  batch,
  branch,
  solved,
  currentStreak,
  bestStreak,
  xp,
  batchRank,
  prepScore,
}: PlacePrepCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-[1.5px] shadow-xl">
      <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white">
        {/* decorative glows */}
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-indigo-400/20 blur-2xl" />

        {/* header */}
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-lg font-black backdrop-blur-sm">
              {initials}
            </div>
            <div>
              <h3 className="text-lg font-black leading-tight tracking-tight">{name}</h3>
              <p className="text-xs text-blue-100">
                {batch ?? "Student"}
                {branch ? ` · ${branch}` : ""} · NST
              </p>
            </div>
          </div>
          <ProgressRing pct={prepScore} size={64} stroke={7} color="#ffffff" trackColor="rgba(255,255,255,0.25)">
            <span className="text-sm font-black">{prepScore}%</span>
          </ProgressRing>
        </div>

        {/* stats grid */}
        <div className="relative mt-5 grid grid-cols-2 gap-2.5">
          {[
            { icon: Target, label: "Solved", value: solved.toLocaleString() },
            { icon: Flame, label: "Streak", value: `${currentStreak}d`, sub: `best ${bestStreak}d` },
            { icon: Zap, label: "Total XP", value: xp.toLocaleString() },
            {
              icon: Trophy,
              label: "Batch Rank",
              value: batchRank ? `#${batchRank}` : "—",
            },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="rounded-xl bg-white/10 px-3.5 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-100">
                <Icon className="h-3 w-3" /> {label}
              </div>
              <div className="mt-0.5 text-xl font-black leading-tight">
                {value}
                {sub && <span className="ml-1.5 text-[10px] font-semibold text-blue-200">{sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* footer brand */}
        <div className="relative mt-4 flex items-center justify-between border-t border-white/15 pt-3">
          <div className="flex items-center gap-2">
            <div className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-black">NST</div>
            <span className="text-xs font-bold">PlacePrep</span>
          </div>
          <span className="text-[10px] text-blue-200">Interview Intelligence Portal</span>
        </div>
      </div>
    </div>
  );
}
