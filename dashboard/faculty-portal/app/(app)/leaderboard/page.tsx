"use client";
import { FeatureGate } from "@/lib/use-features";

import { useState, useEffect } from "react";
import {
  Trophy,
  Star,
  MessageCircle,
  Users,
  Search,
  ChevronUp,
  ChevronDown,
  Minus,
  Medal,
  Clock,
  ArrowRight,
  BookOpen,
  Activity,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface FacultyLeaderboardEntry {
  id: string;
  rank: number;
  prevRank: number;
  name: string;
  initials: string;
  department: string;
  title: string;
  doubtsSolved: number;
  studentRating: number;
  menteeCount: number;
  totalScore: number;
  isCurrentUser: boolean;
}


// Consistent avatar gradient seeded by initials
const AVATAR_GRADIENTS = [
  "from-blue-600 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-sky-600",
];

function avatarGradient(initials: string) {
  return AVATAR_GRADIENTS[initials.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

function FacultyLeaderboardPageInner() {
  const [filterPeriod, setFilterPeriod] = useState<"All Time" | "Monthly">("All Time");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<FacultyLeaderboardEntry[]>([]);

  useEffect(() => {
    fetch("/api/faculty/leaderboard", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const raw: any[] = data?.data?.leaderboard ?? data?.leaderboard ?? data?.data ?? [];
        const mapped: FacultyLeaderboardEntry[] = raw.map((f: any, idx: number) => ({
          id: f._id ?? f.id ?? String(idx),
          rank: f.rank ?? idx + 1,
          prevRank: f.prevRank ?? f.rank ?? idx + 1,
          name: f.fullName ?? f.name ?? "Faculty",
          initials: (f.fullName ?? f.name ?? "F")
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          department: f.department ?? f.subject ?? "Computer Science",
          title: f.title ?? "Faculty",
          doubtsSolved: f.doubtsSolved ?? f.totalDoubts ?? 0,
          studentRating: f.studentRating ?? f.rating ?? 4.5,
          menteeCount: f.menteeCount ?? f.studentCount ?? 0,
          totalScore: f.totalScore ?? f.xpTotal ?? 0,
          isCurrentUser: f.isCurrentUser ?? false,
        }));
        setLeaderboard(mapped);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const currentUser = leaderboard.find((f) => f.isCurrentUser) ?? leaderboard[0] ?? null;

  const filteredLeaderboard = searchQuery.trim()
    ? leaderboard.filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.department.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leaderboard;

  const top3 = filteredLeaderboard.slice(0, 3);
  const rest = filteredLeaderboard.slice(3);

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {isLoading ? (
        <div className="space-y-6">
          <div className="h-44 bg-gray-100 animate-pulse rounded-2xl" />
          <div className="h-20 bg-gray-100 animate-pulse rounded-2xl" />
          <div className="h-12 bg-gray-100 animate-pulse rounded-xl" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* ── 3. Toolbar & Controls ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner w-fit">
              {(["All Time", "Monthly"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setFilterPeriod(period)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    filterPeriod === period
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search a faculty member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-semibold text-gray-900 placeholder:text-gray-400 transition-shadow shadow-sm"
              />
            </div>
          </div>

          {/* ── 4. Top 3 Floating Podium ── */}
          {top3.length >= 3 && (
            <div className="bg-gradient-to-br from-blue-700 via-blue-850 to-indigo-900 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-xl shadow-blue-500/10">
              {/* Decorative backgrounds */}
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-end justify-center gap-4 sm:gap-10 max-w-xl mx-auto w-full pt-4 pb-2 relative z-10">
                
                {/* 2nd Place: Left side */}
                <div className="flex flex-col items-center">
                  <div className="w-18 h-18 rounded-full border-4 border-white bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-black text-base shadow-lg shrink-0">
                    {top3[1].initials}
                  </div>
                  <p className="text-white font-bold text-sm mt-3 text-center leading-tight">
                    {top3[1].name}
                  </p>
                  <p className="text-blue-200/80 text-[11px] font-semibold mt-0.5 text-center">
                    {top3[1].doubtsSolved} Solved
                  </p>
                  
                  {/* 3D Block 2 */}
                  <div className="w-28 h-20 bg-gradient-to-b from-white/20 to-white/5 border border-white/10 rounded-t-2xl flex items-center justify-center shadow-lg mt-4">
                    <span className="text-3xl font-black text-white/90">2</span>
                  </div>
                </div>

                {/* 1st Place: Center */}
                <div className="flex flex-col items-center -mt-6">
                  <div className="w-22 h-22 w-[88px] h-[88px] rounded-full border-4 border-white bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-xl shrink-0 relative">
                    {top3[0].initials}
                    <div className="absolute -top-6.5 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                      👑
                    </div>
                  </div>
                  <p className="text-white font-black text-base mt-3 text-center leading-tight">
                    {top3[0].name}
                  </p>
                  <p className="text-amber-300 text-xs font-bold mt-0.5 text-center">
                    {top3[0].doubtsSolved} Solved
                  </p>
                  
                  {/* 3D Block 1 */}
                  <div className="w-32 h-28 bg-gradient-to-b from-white/35 to-white/10 border border-white/20 rounded-t-2xl flex items-center justify-center shadow-xl mt-4">
                    <span className="text-4xl font-black text-white">1</span>
                  </div>
                </div>

                {/* 3rd Place: Right side */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-4 border-white bg-gradient-to-br from-orange-350 to-orange-450 flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0">
                    {top3[2].initials}
                  </div>
                  <p className="text-white font-bold text-xs mt-3 text-center leading-tight">
                    {top3[2].name}
                  </p>
                  <p className="text-blue-200/80 text-[10px] font-semibold mt-0.5 text-center">
                    {top3[2].doubtsSolved} Solved
                  </p>
                  
                  {/* 3D Block 3 */}
                  <div className="w-28 h-14 bg-gradient-to-b from-white/15 to-white/5 border border-white/10 rounded-t-2xl flex items-center justify-center shadow-md mt-4">
                    <span className="text-2xl font-black text-white/80">3</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── 5. Sticky Call-To-Action Banner ── */}
          <div className="bg-blue-600 rounded-2xl text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-blue-500/10">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl border border-white/15">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-base leading-snug">Your Rank: #{currentUser?.rank ?? "—"}</p>
                <p className="text-xs text-blue-100 leading-normal mt-0.5">
                  Resolve unresolved student doubts and maintain positive student feedback ratings to claim the top spot.
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                window.location.href = "/requests";
              }}
              className="bg-white text-blue-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shrink-0 shadow-sm cursor-pointer"
            >
              Manage Mock Sessions
            </button>
          </div>

          {/* ── 6. Rankings Grid List ── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[50px_70px_1fr_120px_120px_100px] gap-x-4 px-5 py-4 bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <span>Rank</span>
              <span>Change</span>
              <span>Faculty Member</span>
              <span className="text-center">Doubts Solved</span>
              <span className="text-center">Student Rating</span>
              <span className="text-right">Active Mentees</span>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredLeaderboard.map((faculty, idx) => {
                const isTop3 = idx < 3;
                const rankDelta = faculty.prevRank - faculty.rank;

                return (
                  <div
                    key={faculty.id}
                    className={`grid grid-cols-[50px_70px_1fr_120px_120px_100px] gap-x-4 items-center px-5 py-4.5 transition-colors ${
                      faculty.isCurrentUser
                        ? "bg-blue-50/40 border-l-4 border-l-blue-600"
                        : "hover:bg-gray-50/50"
                    }`}
                  >
                    {/* Rank */}
                    <div className="font-black text-sm text-gray-800">
                      {isTop3 ? (
                        <span className={`text-base ${idx === 0 ? "text-amber-500" : idx === 1 ? "text-gray-400" : "text-orange-500"}`}>
                          #{idx + 1}
                        </span>
                      ) : (
                        <span>#{idx + 1}</span>
                      )}
                    </div>

                    {/* Change */}
                    <div>
                      {rankDelta > 0 ? (
                        <span className="text-xs text-green-600 font-bold flex items-center gap-0.5">
                          <ChevronUp className="w-3.5 h-3.5 shrink-0" /> {rankDelta}
                        </span>
                      ) : rankDelta < 0 ? (
                        <span className="text-xs text-red-500 font-bold flex items-center gap-0.5">
                          <ChevronDown className="w-3.5 h-3.5 shrink-0" /> {Math.abs(rankDelta)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium ml-1">— 0</span>
                      )}
                    </div>

                    {/* Profile */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(faculty.initials)} flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm`}>
                        {faculty.initials}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold text-sm leading-snug ${faculty.isCurrentUser ? "text-blue-700" : "text-gray-900"}`}>
                          {faculty.name}
                          {faculty.isCurrentUser && (
                            <span className="ml-1.5 text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded tracking-widest align-middle">YOU</span>
                          )}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">{faculty.title} · {faculty.department}</p>
                      </div>
                    </div>

                    {/* Doubts Solved */}
                    <div className="text-center">
                      <span className="font-bold text-gray-900">{faculty.doubtsSolved}</span>
                    </div>

                    {/* Rating */}
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        <span className="text-sm font-bold text-gray-900">{faculty.studentRating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Mentees */}
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{faculty.menteeCount}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}


// Admin feature-toggle gate (Feature Controls → faculty.leaderboard)
export default function FacultyLeaderboardPageGate() {
  return (
    <FeatureGate feature="faculty.leaderboard" title="Leaderboard">
      <FacultyLeaderboardPageInner />
    </FeatureGate>
  );
}
