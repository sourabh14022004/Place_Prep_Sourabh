"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Activity, Trophy, CheckSquare, Square, ExternalLink,
  Clock, TrendingUp, ChevronRight, Zap
} from "lucide-react";

import {
  dashboardRecentReports,
  getUserRoadmapCompanies,
  userPrepStats,
} from "@/lib/mock-data";
import { useUser } from "@clerk/nextjs";
import { fetchStudentProfile } from "@/lib/api";
import CompanyLogo from "@/components/ui/CompanyLogo";

// Prep Score — calculated from real product features only:
// 1. Practice consistency: problems solved vs. assigned (45%)
// 2. Day streak score: current streak / 30 × 100 (30%)
// 3. XP progress: xpEarned / maxXpForLevel × 100 (25%)
function calcPrepScore(stats: { problemsSolved: number; totalAssigned: number; dayStreak: number; xpEarned: number; maxXpForLevel: number }): number {
  const practiceScore = Math.min((stats.problemsSolved / stats.totalAssigned) * 100, 100) * 0.45;
  const streakScore = Math.min((stats.dayStreak / 30) * 100, 100) * 0.30;
  const xpScore = Math.min((stats.xpEarned / stats.maxXpForLevel) * 100, 100) * 0.25;
  return Math.round(practiceScore + streakScore + xpScore);
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const [checked, setChecked] = useState<Record<number, boolean>>({
    1: true, 10: true, 11: true,
  });

  const [targetCompanies, setTargetCompanies] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Check onboarding status first
    try {
      const sessionOnboarded = sessionStorage.getItem("has_onboarded") === "true";
      const cookieOnboarded = document.cookie.split("; ").some(c => c.startsWith("has_onboarded=true"));
      if (!sessionOnboarded && !cookieOnboarded) {
        router.push("/onboarding/step1");
        return;
      }
      if (cookieOnboarded && !sessionOnboarded) {
        sessionStorage.setItem("has_onboarded", "true");
      }
    } catch { /* ignore */ }

    async function loadLiveUserData() {
      if (user?.id || user?.primaryEmailAddress?.emailAddress) {
        const profile = await fetchStudentProfile(user.id, user.primaryEmailAddress?.emailAddress);
        if (profile) {
          setUserProfile(profile);
          if (profile.roadmap?.companies && profile.roadmap.companies.length > 0) {
            const mapped = profile.roadmap.companies.map((c: any) => ({
              initial: c.name ? c.name[0].toUpperCase() : "C",
              name: c.name,
              role: c.role || "SDE-1",
              readiness: 45,
              color: "bg-blue-600",
              slug: c.slug,
            }));
            setTargetCompanies(mapped);
          }
        }
      }
    }
    loadLiveUserData();

    const roadmaps = getUserRoadmapCompanies();
    if (targetCompanies.length === 0) {
      const mappedCompanies = roadmaps.map(r => ({
        initial: r.initial,
        name: r.name,
        role: r.role,
        readiness: r.pctComplete > 0 ? r.pctComplete : Math.round((r.currentWeek / r.totalWeeks) * 100) || 0,
        color: r.color,
        slug: r.slug
      }));
      setTargetCompanies(mappedCompanies);
    }

    const mappedTasks = roadmaps.map(r => {
      const activeWeek = r.weeks.find(w => w.status === "active") || r.weeks[0];
      if (!activeWeek) return null;
      return {
        company: r.name,
        slug: r.slug,
        week: activeWeek.weekNumber,
        day: 1, // mock
        questions: activeWeek.questions || []
      };
    }).filter(Boolean);
    setTasks(mappedTasks);
  }, []);

  const prepScore = calcPrepScore(userPrepStats);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0">
        {/* Activity bar */}
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Latest Activity: Completed &quot;Two Sum&quot; 2 hours ago</span>
        </div>

        {/* Target Companies */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Your Target Companies</h2>
            <Link href="/roadmap" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
          </div>
          {targetCompanies.length === 0 ? (
            <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
              You haven&apos;t added any company roadmaps yet. Go to <Link href="/companies" className="text-blue-600 font-medium hover:underline">Companies</Link> to add one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {targetCompanies.map((co) => {
                return (
                  <div key={co.name} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow flex flex-col">
                    <div className="flex items-center justify-between mb-3 flex-1">
                      <div className="flex items-center gap-3">
                        <CompanyLogo
                          slug={co.slug}
                          name={co.name}
                          className="w-10 h-10 rounded-lg"
                        />
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{co.name}</div>
                          <div className="text-xs text-gray-500">{co.role}</div>
                        </div>
                      </div>
                      {/* Circular readiness */}
                      <div className="relative w-12 h-12 shrink-0">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r="20" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                          <circle
                            cx="24" cy="24" r="20"
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="4"
                            strokeDasharray={`${co.readiness * 1.257} 125.7`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">
                          {co.readiness}%
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <Link
                        href={`/companies/${co.slug}`}
                        className="flex-1 text-center text-xs font-medium border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View Intel
                      </Link>
                      <Link
                        href={`/roadmap?company=${co.slug}`}
                        className="flex-1 text-center text-xs font-medium bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Roadmap
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Today's Tasks — per company, smart question count */}
        {tasks.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Today&apos;s Tasks</h2>
            </div>
            <div className="space-y-4">
              {(() => {
                // If user targets only 1 company → show 5 questions, otherwise show 3
                const maxQPerCompany = tasks.length === 1 ? 5 : 3;
                return tasks.map((co) => (
                <div key={co.slug} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Company header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://www.google.com/s2/favicons?sz=32&domain=${co.slug}.com`}
                        alt={co.company}
                        className="w-5 h-5 rounded shrink-0 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className="font-semibold text-gray-900 text-sm">{co.company}</span>
                      <span className="text-xs text-gray-500 bg-gray-200 rounded px-2 py-0.5 font-medium">
                        Week {co.week}, Day {co.day}
                      </span>
                    </div>
                    <Link
                      href={`/roadmap?company=${co.slug}`}
                      className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
                    >
                      View Full Roadmap <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Questions — capped to maxQPerCompany */}
                  <div className="divide-y divide-gray-50">
                    {co.questions.slice(0, maxQPerCompany).map((q: any) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setChecked((c) => ({ ...c, [q.id]: !c[q.id] }))}
                    >
                      <button className="shrink-0" aria-label={checked[q.id] ? "Mark incomplete" : "Mark complete"}>
                        {checked[q.id] ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                      <span className={`flex-1 text-sm ${checked[q.id] ? "line-through text-gray-400" : "text-gray-900 font-medium"}`}>
                        {q.title}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-medium shrink-0">
                        <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        {q.xp} XP
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${
                        q.difficulty === "Easy" ? "bg-green-50 text-green-700" :
                        q.difficulty === "Medium" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600"
                      }`}>
                        {q.difficulty}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </div>
                  ))}
                </div>

              </div>
            ));
            })()}
          </div>
        </section>
        )}

        {/* Recent Reports */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Interview Reports</h2>
            <Link href="/submit" className="text-sm text-blue-600 font-medium hover:underline">Browse All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardRecentReports.map((r) => (
              <Link
                key={r.name}
                href={`/submit?expand=${r.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CompanyLogo
                    name={r.name}
                    className="w-8 h-8 rounded-lg"
                  />
                  <span className="font-semibold text-gray-900 text-sm">{r.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{r.time}</span>
                  <span className="bg-gray-100 text-gray-600 text-xs rounded px-2 py-0.5">{r.rounds} Rounds</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{r.role}</p>
                <div className="flex flex-wrap gap-1">
                  {r.tags.map((t) => (
                    <span key={t} className="bg-gray-100 text-gray-600 text-xs rounded px-2 py-0.5">{t}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ── Right Panel ── */}
      <aside className="hidden xl:block w-64 shrink-0 space-y-4">
        {/* Prep Score */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-900 mb-1 uppercase tracking-wide">Prep Score</h3>
          <p className="text-[10px] text-gray-400 mb-4">Based on practice, streak &amp; XP progress</p>
          <div className="flex justify-center mb-3">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                <circle cx="48" cy="48" r="40" fill="none"
                  stroke={prepScore >= 70 ? "#10B981" : prepScore >= 40 ? "#3B82F6" : "#F59E0B"}
                  strokeWidth="8"
                  strokeDasharray={`${(prepScore / 100) * 251} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{prepScore}%</span>
              </div>
            </div>
          </div>
          {/* Score breakdown */}
          <div className="space-y-2">
            {[
              { label: "Practice", val: Math.round(Math.min((userPrepStats.problemsSolved / userPrepStats.totalAssigned) * 100, 100)), color: "bg-blue-500" },
              { label: "Streak", val: Math.round(Math.min((userPrepStats.dayStreak / 30) * 100, 100)), color: "bg-indigo-500" },
              { label: "XP Progress", val: Math.round(Math.min((userPrepStats.xpEarned / userPrepStats.maxXpForLevel) * 100, 100)), color: "bg-violet-500" },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{label}</span><span className="font-medium text-gray-700">{val}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className={`h-1.5 ${color} rounded-full`} style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{userProfile?.streakDays ?? userPrepStats.dayStreak}</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Day Streak</div>
        </div>

        {/* XP Badge */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{(userProfile?.xp ?? userPrepStats.xpEarned).toLocaleString()}</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">XP Earned</div>
        </div>

        {/* Activity Map */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Activity Map</h3>
            <span className="text-xs text-gray-400">June 2026</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-[10px] text-gray-400 text-center">{d}</div>
            ))}
            {Array.from({ length: 30 }).map((_, i) => {
              const actives = [2, 3, 5, 6, 7, 9, 12, 13, 14, 18, 19, 20, 25, 26, 27];
              const dark = [25, 26, 27];
              const mid = [12, 13, 14, 18, 19, 20];
              return (
                <div
                  key={i}
                  className={`h-3 w-full rounded-sm ${
                    dark.includes(i) ? "bg-green-700" :
                    mid.includes(i) ? "bg-green-500" :
                    actives.includes(i) ? "bg-green-300" : "bg-gray-100"
                  }`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400">
            <span>Less</span>
            {["bg-gray-100", "bg-green-300", "bg-green-500", "bg-green-700"].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Problems Solved</h3>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold text-gray-900">{userProfile?.solvedQuestions?.length ?? userPrepStats.problemsSolved}</span>
              <span className="text-sm text-gray-400 ml-1">/ {userPrepStats.totalAssigned}</span>
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full mt-3">
            <div
              className="h-1.5 bg-green-500 rounded-full"
              style={{ width: `${Math.min(((userProfile?.solvedQuestions?.length ?? userPrepStats.problemsSolved) / userPrepStats.totalAssigned) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">Assigned roadmap problems</p>
        </div>
      </aside>
    </div>
  );
}
