"use client";
import { useState, useEffect } from "react";
import { TrendingUp, Zap, Medal, ChevronDown, Search, Trophy } from "lucide-react";
import Link from "next/link";
import { fetchLeaderboard } from "@/lib/api";

const defaultFallback = [
  { rank: 1, initials: "SS", name: "Sourabh Sarkar", xp: 2450, change: "—", batch: "B.Tech CS 2026", isYou: true, time: "Just now" },
  { rank: 2, initials: "MC", name: "Michael Chen",   xp: 1890, change: "—", batch: "B.Tech CS 2026", isYou: false, time: "2 hrs ago" },
  { rank: 3, initials: "SJ", name: "Sarah Jenkins",  xp: 1425, change: "—", batch: "B.Tech CS 2026", isYou: false, time: "1 day ago" },
  { rank: 4, initials: "ED", name: "Emily Davis",    xp: 1380, change: "↑ 2", batch: "B.Tech CS 2026", isYou: false, time: "2 hrs ago" },
  { rank: 5, initials: "DK", name: "David Kim",      xp: 1245, change: "—", batch: "B.Tech CS 2026", isYou: false, time: "5 mins ago" },
];

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>(defaultFallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLiveLeaderboard() {
      try {
        const data = await fetchLeaderboard();
        if (data && data.length > 0) {
          const formatted = data.map((u: any, idx: number) => ({
            rank: u.rank || idx + 1,
            name: u.name || "Student",
            initials: u.name ? u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "ST",
            xp: u.xp || 0,
            change: u.change || "—",
            time: u.time || "Recently",
            batch: u.batch || "B.Tech CS 2026",
            isYou: u.name === "Sourabh Sarkar" || idx === 0,
          }));

          // Merge default fallback if less than 3 students exist
          while (formatted.length < 3) {
            const nextIdx = formatted.length;
            formatted.push({
              ...defaultFallback[nextIdx],
              rank: nextIdx + 1,
            });
          }
          setLeaders(formatted);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to fetch live leaderboard:", err);
      }
      setLeaders(defaultFallback);
      setLoading(false);
    }
    loadLiveLeaderboard();
  }, []);

  const me = leaders.find((u) => u.isYou || u.name === "Sourabh Sarkar") || leaders[0] || defaultFallback[0];
  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  return (
    <div>
      {/* Hero Banner */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)" }}>
        <div className="p-8 text-center">
          <div className="inline-block border border-white/30 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4 bg-white/10">
            JUNE 2026 CONTEST
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PlacePrep Leaderboard</h1>
          <p className="text-blue-200 text-sm max-w-lg mx-auto">
            Compete with your peers, climb the ranks, and secure your position at the top.
            Consistent practice yields the highest rewards.
          </p>
        </div>
      </div>

      {/* My Standing — always visible at top */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        
        {/* Top row on mobile / Left section on desktop */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="text-indigo-700 text-xs font-bold uppercase tracking-wide shrink-0">Your Rank</div>
          <div className="w-px h-6 bg-indigo-200 shrink-0 hidden sm:block" />
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {me.initials}
          </div>
          {/* Rank shows here on mobile so it's top right */}
          <div className="flex-1 sm:hidden flex flex-col items-end">
            <div className="text-2xl font-bold text-indigo-700 leading-none">#{me.rank}</div>
            <div className="text-[10px] text-gray-500 mt-1">{me.change}</div>
          </div>
        </div>

        {/* Center section */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm">{me.name} <span className="text-indigo-600 font-bold text-xs ml-1">(You)</span></div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
            {me.xp.toLocaleString()} XP &nbsp;·&nbsp; {me.time}
          </div>
        </div>

        {/* Right section on desktop */}
        <div className="hidden sm:block text-right shrink-0">
          <div className="text-2xl font-bold text-indigo-700 leading-none">#{me.rank}</div>
          <div className="text-xs text-gray-500 mt-1">{me.change}</div>
        </div>

        <Link href="/practice" className="w-full sm:w-auto bg-indigo-600 text-white text-center text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shrink-0">
          Improve Rank
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button className="bg-gray-900 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-lg">All Time</button>
          <button className="border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-50">Monthly</button>
        </div>
        <div className="relative w-full sm:w-auto">
          <input
            placeholder="Search a student..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full sm:w-56"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Podium */}
      <div className="flex justify-center items-end gap-2 sm:gap-8 mb-8">
        {/* 2nd */}
        <div className="text-center flex flex-col items-center pb-4">
          <Medal className="w-5 h-5 sm:w-7 sm:h-7 text-blue-400 mb-2" />
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-300 flex items-center justify-center text-white text-lg sm:text-xl font-bold border-4 border-blue-200">
            {top3[1]?.initials || "ST"}
          </div>
          <div className="bg-blue-600 text-white text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center -mt-3 ml-8 sm:ml-10">2</div>
          <div className="text-xs sm:text-sm font-medium text-gray-900 mt-2 truncate max-w-[80px] sm:max-w-none">{top3[1]?.name || "Student"}</div>
          <div className="text-[10px] sm:text-xs text-gray-500 flex items-center justify-center gap-1 mt-1"><Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-blue-500 text-blue-500" /> {(top3[1]?.xp || 0).toLocaleString()}</div>
        </div>
        {/* 1st */}
        <div className="text-center flex flex-col items-center mb-4">
          <Medal className="w-7 h-7 sm:w-9 sm:h-9 text-indigo-500 mb-2" />
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold border-4 border-indigo-200">
            {top3[0]?.initials || "ST"}
          </div>
          <div className="bg-indigo-700 text-white text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center -mt-3 ml-10 sm:ml-12">1</div>
          <div className="text-sm sm:text-base font-bold text-gray-900 mt-3 truncate max-w-[90px] sm:max-w-none">{top3[0]?.name || "Student"}</div>
          <div className="text-[10px] sm:text-sm text-indigo-600 font-semibold flex items-center justify-center gap-1 mt-1"><Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-indigo-500 text-indigo-500" /> {(top3[0]?.xp || 0).toLocaleString()}</div>
        </div>
        {/* 3rd */}
        <div className="text-center flex flex-col items-center pb-4">
          <Medal className="w-5 h-5 sm:w-7 sm:h-7 text-sky-500 mb-2" />
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-sky-400 flex items-center justify-center text-white text-lg sm:text-xl font-bold border-4 border-sky-100">
            {top3[2]?.initials || "ST"}
          </div>
          <div className="bg-sky-500 text-white text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center -mt-3 ml-8 sm:ml-10">3</div>
          <div className="text-xs sm:text-sm font-medium text-gray-900 mt-2 truncate max-w-[80px] sm:max-w-none">{top3[2]?.name || "Student"}</div>
          <div className="text-[10px] sm:text-xs text-gray-500 flex items-center justify-center gap-1 mt-1"><Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-sky-500 text-sky-500" /> {(top3[2]?.xp || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-600 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">Your Rank: #5</div>
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
          <div className="grid grid-cols-[80px_100px_1fr_150px_150px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
            {["RANK", "CHANGE", "NAME", "XP THIS MONTH", "LATEST SUBMISSION"].map((h) => (
              <div key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</div>
            ))}
          </div>
        {rest.map((u) => (
          <div
            key={u.rank}
            className={`grid grid-cols-[80px_100px_1fr_150px_150px] gap-4 px-5 py-4 border-b border-gray-100 last:border-0 ${
              u.isYou ? "bg-indigo-50/50 border-indigo-100" : "hover:bg-gray-50"
            } transition-colors`}
          >
            <div className="font-bold text-gray-900">#{u.rank}</div>
            <div className={`text-sm font-medium ${
              u.change.startsWith("↑") ? "text-green-600" :
              u.change.startsWith("↓") ? "text-red-500" : "text-gray-400"
            }`}>{u.change}</div>
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
        <div className="flex justify-center py-4 border-t border-gray-100">
          <button className="border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50">
            View Top 100 <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
