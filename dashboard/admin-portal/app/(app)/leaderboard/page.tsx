"use client";

import { useState } from "react";
import { useLeaderboard } from "@/lib/hooks";
import type { LeaderboardEntry } from "@/lib/types";
import { Trophy, Zap } from "lucide-react";

const BATCHES = ["All", "2023", "2024", "2025", "2026"];
const PERIODS = ["All Time", "This Month", "This Week"];

const RANK_CONFIG: Record<number, { border: string; bg: string; badge: string; label: string }> = {
  1: { border: "border-amber-400", bg: "bg-amber-50", badge: "bg-amber-400", label: "🥇" },
  2: { border: "border-gray-400", bg: "bg-gray-50", badge: "bg-gray-400", label: "🥈" },
  3: { border: "border-orange-400", bg: "bg-orange-50", badge: "bg-orange-400", label: "🥉" },
};

function PodiumCard({ entry }: { entry: LeaderboardEntry }) {
  const cfg = RANK_CONFIG[entry.rank] ?? {};
  return (
    <div className={`relative bg-white border-2 ${cfg.border} rounded-xl p-4 shadow-sm flex flex-col items-center text-center`}>
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full ${cfg.badge} text-white text-[10px] font-bold`}>
        {cfg.label} #{entry.rank}
      </div>
      <div className={`w-12 h-12 rounded-full ${cfg.bg} border-2 ${cfg.border} flex items-center justify-center text-base font-bold text-gray-700 mt-2`}>
        {entry.initials}
      </div>
      <p className="mt-2 text-sm font-bold text-gray-900 truncate w-full">{entry.name}</p>
      <p className="text-[10px] text-gray-400">Batch {entry.batch}</p>
      <div className="mt-3 flex items-center gap-1">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-sm font-bold text-amber-600">{entry.xp.toLocaleString()} XP</span>
      </div>
      <p className="text-[10px] text-gray-400 mt-1">{entry.tasksCompleted} tasks done</p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
  );
}

export default function LeaderboardPage() {
  const [batch, setBatch] = useState("All");
  const [period, setPeriod] = useState("This Month");
  const { leaderboard, isLoading } = useLeaderboard(batch.toLowerCase(), period.toLowerCase().replace(" ", "-"));

  const entries = leaderboard as LeaderboardEntry[];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-gray-900">Student Leaderboard</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Top 10 students by XP — tasks, assignments, and practice</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Batch filter */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {BATCHES.map((b) => (
              <button
                key={b}
                onClick={() => setBatch(b)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                  batch === b ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          {/* Period filter */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                  period === p ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Podium (rank 1-3) */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {podium.map((entry) => <PodiumCard key={entry.rank} entry={entry} />)}
        </div>
      )}

      {/* Ranks 4-10 */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_80px_80px_80px] gap-0 px-4 py-2 border-b border-gray-100">
          <span className="text-[10px] font-semibold text-gray-400 uppercase">#</span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase">Student</span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">XP</span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Tasks</span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Doubts</span>
        </div>
        <div className="divide-y divide-gray-50">
          {isLoading
            ? [...Array(7)].map((_, i) => (
                <div key={i} className="px-4 py-2">
                  <SkeletonRow />
                </div>
              ))
            : rest.map((entry) => (
                <div
                  key={entry.rank}
                  className="grid grid-cols-[32px_1fr_80px_80px_80px] gap-0 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs font-bold text-gray-400 self-center">{entry.rank}</span>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0">
                      {entry.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{entry.name}</p>
                      <p className="text-[10px] text-gray-400">Batch {entry.batch}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 self-center">
                    <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-amber-600">{entry.xp.toLocaleString()}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-700 self-center text-right">{entry.tasksCompleted}</span>
                  <span className="text-xs font-medium text-gray-500 self-center text-right">{entry.doubtsRaised}</span>
                </div>
              ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-gray-400">
        <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> XP = Experience Points earned from tasks, practice &amp; sessions</div>
      </div>
    </div>
  );
}
