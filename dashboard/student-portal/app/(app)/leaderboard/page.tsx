"use client";
import { FeatureGate } from "@/lib/features";
import { useState, useEffect } from "react";
import { TrendingUp, Zap, Medal, ChevronDown, Search, Trophy } from "lucide-react";
import Link from "next/link";
import { useLeaderboard } from "@/lib/hooks";
import ErrorState from "@/components/ErrorState";
import { usePageTitle } from "@/lib/use-page-title";

interface LeaderEntry {
  rank: number | string;
  studentId: string;
  name: string;
  initials: string;
  xp: number;
  /** Questions solved within the active window (monthly/weekly) — null on all-time */
  windowScore: number | null;
  batch?: string;
  time: string;
  isYou: boolean;
}

function LeaderboardPageInner() {
  usePageTitle("Leaderboard");
  // Server-side search (debounced): with 10k students the API top-100 list is
  // only a slice — client filtering alone made ~99% of students unfindable.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);
  const [period, setPeriod] = useState<"alltime" | "monthly">("alltime");
  const [showAll, setShowAll] = useState(false);
  const VISIBLE_LIMIT = 20;

  // BUG-E FIX: Use SWR hook instead of raw fetch + useEffect
  const { data: rawData, isLoading, error, mutate } = useLeaderboard({ period, search });

  function batchOf(u: LeaderEntry): string {
    return u.batch || "";
  }
  function getInitialsLocal(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  const leaders: LeaderEntry[] = Array.isArray(rawData)
    ? rawData.map((u: any, i: number) => ({
        rank:     u.rank    ?? u.leaderboardRank ?? i + 1,
        studentId: u.studentId ?? `row-${i}`,
        name:     u.studentName ?? u.name    ?? u.fullName        ?? "Student",
        initials: u.initials ?? getInitialsLocal(u.studentName ?? u.name ?? u.fullName ?? "ST"),
        xp:       u.xp     ?? u.xpTotal         ?? 0,
        windowScore: typeof u.windowScore === 'number' ? u.windowScore : null,
        batch:    u.batch ?? '',
        time:     u.lastActivity
          ? new Date(u.lastActivity).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
          : "—",
        isYou:    u.isCurrentUser ?? u.isYou ?? false,
      }))
    : [];

  // Instant client-side refinement on top of the debounced server search
  const filtered = leaders.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const me = leaders.find((u) => u.isYou);
  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const visibleRest = showAll ? rest : rest.slice(0, VISIBLE_LIMIT);

  const podiumColors = [
    { bg: "bg-indigo-600", border: "border-indigo-200", badge: "bg-indigo-700", medal: "text-indigo-500" },
    { bg: "bg-blue-300",   border: "border-blue-200",   badge: "bg-blue-600",   medal: "text-blue-400"   },
    { bg: "bg-sky-400",    border: "border-sky-100",    badge: "bg-sky-500",    medal: "text-sky-500"    },
  ];

  return (
    <div>
      {/* Hero Banner */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)" }}>
        <div className="p-8 text-center">
          <div className="inline-block border border-white/30 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4 bg-white">
            LIVE RANKINGS
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PlacePrep Leaderboard</h1>
          <p className="text-blue-200 text-sm max-w-lg mx-auto">
            Compete with your peers, climb the ranks, and secure your position at the top.
            Consistent practice yields the highest rewards.
          </p>
        </div>
      </div>

      {/* My Standing */}
      {me && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="text-indigo-700 text-xs font-bold uppercase tracking-wide shrink-0">Your Rank</div>
            <div className="w-px h-6 bg-indigo-200 shrink-0 hidden sm:block" />
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {me.initials}
            </div>
            <div className="flex-1 sm:hidden flex flex-col items-end">
              <div className="text-2xl font-bold text-indigo-700 leading-none">#{me.rank}</div>
              <div className="text-[10px] text-gray-500 mt-1">{period === "monthly" ? `${me.windowScore ?? 0} solved this month` : "All-time XP rank"}</div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm">{me.name} <span className="text-indigo-600 font-bold text-xs ml-1">(You)</span></div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
              {period === "monthly"
                ? `${me.windowScore ?? 0} solved this month`
                : `${me.xp.toLocaleString()} XP`} &nbsp;·&nbsp; {me.time}
            </div>
          </div>
          <div className="hidden sm:block text-right shrink-0">
            <div className="text-2xl font-bold text-indigo-700 leading-none">#{me.rank}</div>
            <div className="text-xs text-gray-500 mt-1">{period === "monthly" ? `${me.windowScore ?? 0} solved this month` : "All-time XP rank"}</div>
          </div>
          <Link href="/practice" className="w-full sm:w-auto bg-indigo-600 text-white text-center text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shrink-0">
            Improve Rank
          </Link>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod("alltime")}
            className={`text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors ${period === "alltime" ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50:bg-slate-800/60"}`}
          >All Time</button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors ${period === "monthly" ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50:bg-slate-800/60"}`}
          >Monthly</button>
        </div>
        <div className="relative w-full sm:w-auto">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search a student..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full sm:w-56"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {leaders.length === 0 ? (
        error ? (
          <ErrorState error={error} title="Couldn't load the leaderboard" onRetry={() => mutate()} />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
            <div className="text-gray-400 text-sm">Loading leaderboard...</div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 text-sm">No data yet. Be the first to top the board!</div>
        )
      ) : (
        <div className="relative">
          {/* Non-blocking refresh indicator. This used to be an `absolute inset-0`
              overlay with a backdrop blur, so every background revalidation (and
              every period switch) covered the table the user was already reading
              and swallowed their clicks. Now it floats out of the way. */}
          {isLoading && (
            <div className="sticky top-16 z-10 flex justify-center pointer-events-none">
              <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-md border border-gray-100">
                <div className="w-3.5 h-3.5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-xs font-semibold text-gray-600">Updating...</span>
              </div>
            </div>
          )}
          {/* Podium */}
          {top3.length >= 3 && (
            <div className="flex justify-center items-end gap-2 sm:gap-8 mb-8">
              {[top3[1], top3[0], top3[2]].map((u, pos) => {
                const order = pos === 0 ? 1 : pos === 1 ? 0 : 2;
                const c = podiumColors[order];
                return (
                  <div key={u.studentId} className={`text-center flex flex-col items-center ${order === 0 ? "mb-4" : "pb-4"}`}>
                    <Medal className={`w-5 h-5 sm:w-7 sm:h-7 ${c.medal} mb-2`} />
                    <div className={`${order === 0 ? "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl" : "w-12 h-12 sm:w-16 sm:h-16 text-lg sm:text-xl"} rounded-full ${c.bg} flex items-center justify-center text-white font-bold border-4 ${c.border}`}>
                      {u.initials}
                    </div>
                    <div className={`${c.badge} text-white text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center -mt-3 ml-8 sm:ml-10`}>{u.rank}</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900 mt-2 truncate max-w-[80px] sm:max-w-none">{u.name}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
                      <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-blue-500 text-blue-500" /> {u.xp.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <div className="bg-blue-600 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">Your Rank: {me ? `#${me.rank}` : "—"}</div>
                <div className="text-blue-200 text-xs mt-0.5">Increase your XP by completing practice modules and daily challenges.</div>
              </div>
            </div>
            <Link href="/practice" className="bg-white text-blue-900 text-center text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors shrink-0">
              Go to Practice
            </Link>
          </div>

          {/* Full Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[80px_110px_1fr_150px_120px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
                {["RANK", period === "monthly" ? "SOLVED (30D)" : "BATCH", "NAME", "XP", "LAST ACTIVE"].map((h) => (
                  <div key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</div>
                ))}
              </div>
              {visibleRest.map((u) => (
                <div
                  key={u.studentId}
                  className={`grid grid-cols-[80px_110px_1fr_150px_120px] gap-4 px-5 py-4 border-b border-gray-100 last:border-0 ${u.isYou ? "bg-indigo-50/50 border-indigo-100" : "hover:bg-gray-50:bg-slate-800/60"} transition-colors`}
                >
                  <div className="font-bold text-gray-900">#{u.rank}</div>
                  <div className="text-sm font-medium text-gray-700 truncate">
                    {period === "monthly"
                      ? `${u.windowScore ?? 0} solved`
                      : (batchOf(u) || "—")}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.isYou ? "bg-blue-600" : "bg-gray-400"}`}>
                      {u.initials}
                    </div>
                    <span className={`text-sm ${u.isYou ? "font-bold text-gray-900" : "text-gray-700"}`}>
                      {u.name}{u.isYou && <span className="text-blue-600 font-bold text-xs ml-1">(You)</span>}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{u.xp.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{u.time}</div>
                </div>
              ))}
            </div>
            {rest.length > VISIBLE_LIMIT && (
              <div className="flex justify-center py-4 border-t border-gray-100">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50:bg-slate-800/60"
                >
                  {showAll ? "Show Less" : "View All"} <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Admin feature-toggle gate (Feature Controls → student.leaderboard)
export default function LeaderboardPageGate() {
  return (
    <FeatureGate feature="student.leaderboard" title="Leaderboard">
      <LeaderboardPageInner  />
    </FeatureGate>
  );
}
