"use client";
import { CompanyLogo } from "@/components/ui";
import React, { useMemo, useState } from "react";
import Link from "next/link"; // clickable company name links
import { useRouter } from "next/navigation";
import {
  TrendingUp, Flame, Trophy, Zap, AlertCircle, Target, Dumbbell,
  BarChart3, Map as MapIcon, ChevronRight, Activity, Link2,
} from "lucide-react";
import { useProgress, useDashboard, useRoadmap, useCompanyTopics, usePracticeMyStats, useProfile } from "@/lib/hooks";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import { ConnectedProfileCards } from "@/components/CodingProfiles";
import ErrorState from "@/components/ErrorState";
import { FeatureGate } from "@/lib/features";
import { StatTilesSkeleton, CardSkeleton } from "@/components/Skeletons";
import { PageHeader } from "@/components/ui";
import { usePageTitle } from "@/lib/use-page-title";

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}


function ProgressProfileSidebar({
  user,
  kpis,
}: {
  user: any;
  kpis: any;
}) {
  const name = user?.name || "—";
  const initials =
    user?.initials ||
    (user?.name
      ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
      : "?");
  const role = user?.targetRole || user?.branch || "—";
  const rankCohort = kpis?.batchRank ? `#${kpis.batchRank} Cohort` : "—";
  const points = (kpis?.xpTotal ?? user?.xp) != null ? (kpis?.xpTotal ?? user?.xp).toLocaleString() : "—";
  const prepScore = kpis?.prepScore ?? user?.prepScore;
  const trustScore = prepScore != null ? `${prepScore} / 100` : "—";

  return (
    <div className="space-y-4">
      {/* ── Your Profile Card ─────────────────────────────── */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Your Profile</h3>

        {/* Avatar + Info Row */}
        <div className="flex items-center gap-3 mb-3.5">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-base shadow-inner overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {/* Active green status dot */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-gray-900 text-sm leading-snug truncate">{name}</h4>
            <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{role}</p>
          </div>
        </div>

        {/* 3-Stat Inner Box */}
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-2.5 grid grid-cols-3 divide-x divide-gray-200/80 text-center">
          <div className="px-1">
            <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Rank</div>
            <div className="text-xs font-bold text-gray-900 mt-0.5">{rankCohort}</div>
          </div>
          <div className="px-1">
            <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Points</div>
            <div className="text-xs font-bold text-gray-900 mt-0.5">{points}</div>
          </div>
          <div className="px-1">
            <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Trust Score</div>
            <div className="text-xs font-bold text-gray-900 mt-0.5">{trustScore}</div>
          </div>
        </div>
      </div>

      {/* ── Coding Profiles Section (only what the user connected) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-gray-900">Coding Profiles</h3>
          <Link href="/profile" className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">
            View All →
          </Link>
        </div>

        <ConnectedProfileCards />

        {/* Manage Connections Button */}
        <Link
          href="/profile"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-200/90 bg-orange-50/40 hover:bg-orange-50 text-xs font-semibold text-orange-600 transition-all active:scale-[0.99] shadow-sm"
        >
          <Link2 className="w-3.5 h-3.5 text-orange-500" /> Manage Connections
        </Link>
      </div>
    </div>
  );
}

type TrackTab = "roadmap" | "practice";

function ProgressPageInner() {
  usePageTitle("My Progress");
  const router = useRouter();
  const [track, setTrack] = useState<TrackTab>("roadmap");
  // Captured once per mount — avoids calling Date.now() during render (react-hooks/purity)
  const [nowTs] = useState(() => Date.now());

  const { data: dashboardData, isLoading: loadingDash, error: errorDash, mutate: retryDash } = useDashboard();
  const { data: roadmapsData, isLoading: loadingRoadmaps, error: errorRoadmaps, mutate: retryRoadmaps } = useRoadmap();
  const { data: progressData, isLoading: loadingProgress, error: errorProgress, mutate: retryProgress } = useProgress();
  const { data: practiceStatsData, isLoading: loadingPractice, error: practiceStatsError, mutate: retryPracticeStats } = usePracticeMyStats();
  const { data: profileData } = useProfile();

  const user = profileData?.user ?? profileData ?? {};
  const kpis = dashboardData?.stats || {};
  const roadmaps = Array.isArray(roadmapsData) ? roadmapsData : (roadmapsData?.data || []);
  const topicProgress = Array.isArray(progressData) ? progressData : (progressData?.data || []);
  const pstats = practiceStatsData ?? null;

  // ── Real Focus Areas: high-frequency topics from the student's FIRST target
  // company crossed with their ACTUAL completion percentage. Replaces the old
  // broken lookup that read `.topicFrequency` off a field it never had.
  const firstRoadmap = roadmaps[0];
  const { data: companyTopics } = useCompanyTopics(
    firstRoadmap?.companySlug ?? null,
    firstRoadmap?.roleName ?? undefined
  );

  const focusAreas = useMemo(() => {
    type FocusArea = { topic: string; pct: number; frequencyPct: number; score: number };
    const completionByTopic = new Map<string, { completed: number; total: number; percentage: number }>();
    (topicProgress as { topic: string; completed: number; total: number; percentage: number }[]).forEach(t =>
      completionByTopic.set(t.topic, t)
    );
    const topicsArr = (Array.isArray(companyTopics) ? companyTopics : (companyTopics as any)?.data ?? []) as
      { topicSlug: string; topicName: string; frequencyPct: number }[];
    if (!topicsArr.length) return [] as FocusArea[];

    return topicsArr
      .slice(0, 12)
      .map(t => {
        const comp = completionByTopic.get(t.topicName);
        const pct = comp?.percentage ?? 0;
        // priority = how much the company tests it × how un-mastered it is
        return {
          topic: t.topicName,
          pct,
          frequencyPct: Math.round(t.frequencyPct ?? 0),
          score: (t.frequencyPct ?? 0) * (100 - pct),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [topicProgress, companyTopics]);

  const bgColors = ["bg-blue-50 border-blue-200", "bg-indigo-50 border-indigo-200", "bg-violet-50 border-violet-200"];
  const textColorsCls = ["text-blue-600", "text-indigo-600", "text-violet-600"];

  const companyReadiness = roadmaps.map((rm: any) => {
    const done = rm.weeks?.reduce((acc: number, w: any) => acc + (w.doneQuestions || 0), 0) || 0;
    const total = rm.weeks?.reduce((acc: number, w: any) => acc + (w.totalQuestions || 0), 0) || 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return {
      name: rm.companyName || rm.companySlug,
      slug: rm.companySlug,
      role: rm.roleName || 'SDE-1',
      pct: pct,
      done: done,
      total: total,
      last: rm.lastActive ? timeAgo(rm.lastActive) : "Just now",
      trend: pct === 100 ? "Ready" : "In Progress",
      trendColor: pct === 100 ? "text-green-600" : "text-blue-600"
    };
  });

  const colors = ["bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-cyan-500", "bg-sky-500", "bg-fuchsia-500"];
  const textColors = ["text-blue-600", "text-indigo-600", "text-violet-600", "text-cyan-600", "text-sky-600", "text-fuchsia-600"];

  const topics = (topicProgress as { topic: string; completed: number; total: number; percentage: number }[]).map((tp, idx) => ({
    name: tp.topic,
    done: tp.completed,
    total: tp.total,
    pct: tp.percentage,
    color: colors[idx % colors.length],
    textColor: textColors[idx % textColors.length]
  }));

  // Heatmap — real full-year activity via the shared GitHub-style component
  const yearActivityData = kpis.yearlyActivity || kpis.weeklyActivity || [];

  // Practice tab helpers
  const byTypeMax = Math.max(1, ...(pstats?.byQuestionType ?? []).map((t: { count: number }) => t.count));
  const thisWeekSolved = (pstats?.trend ?? [])
    .filter((d: { date: string }) => nowTs - new Date(d.date).getTime() <= 7 * 86400000)
    .reduce((acc: number, d: { count: number }) => acc + d.count, 0);

  // Error branch — a failed fetch on any core hook shows a recoverable state.
  const firstError = track === "roadmap"
    ? (errorDash ?? errorRoadmaps ?? errorProgress)
    : (errorDash ?? errorProgress);

  if (firstError) {
    return (
      <ErrorState
        error={firstError}
        title="Couldn't load your progress"
        onRetry={() => {
          if (errorDash) retryDash();
          if (errorRoadmaps) retryRoadmaps();
          if (errorProgress) retryProgress();
        }}
      />
    );
  }

  if (loadingDash || loadingRoadmaps || loadingProgress || (track === "practice" && loadingPractice && !pstats)) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="My Progress" subtitle="Loading your analytics…" />
        <StatTilesSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} lines={3} />)}
        </div>
        <CardSkeleton lines={6} />
      </div>
    );
  }

  const difficultyRows = [
    { label: "Easy",   count: pstats?.easySolved   ?? kpis.easySolved   ?? 0, color: "bg-green-500" },
    { label: "Medium", count: pstats?.mediumSolved ?? kpis.mediumSolved ?? 0, color: "bg-amber-500" },
    { label: "Hard",   count: pstats?.hardSolved   ?? kpis.hardSolved   ?? 0, color: "bg-red-500" },
  ];
  const diffTotal = difficultyRows.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ── Main Content Column ────────────────────────── */}
        <div className="xl:col-span-8 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">My Progress</h1>
        {/* Roadmap ↔ Practice tracking toggle */}
        <div className="inline-flex bg-gray-100 rounded-lg p-1" role="tablist" aria-label="Progress tracking mode">
          {([
            { id: "roadmap", label: "Roadmap", icon: MapIcon },
            { id: "practice", label: "Practice", icon: Dumbbell },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={track === id}
              onClick={() => setTrack(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                track === id ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats — shared across both tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: TrendingUp, color: "text-blue-600",   bg: "bg-blue-50",   val: kpis.problemsSolved || 0,                             label: "Problems Solved" },
          { icon: Flame,      color: "text-indigo-600", bg: "bg-indigo-50", val: kpis.currentStreakDays || 0,                          label: "Day Streak" },
          { icon: Trophy,     color: "text-violet-600", bg: "bg-violet-50", val: kpis.bestStreakDays || kpis.currentStreakDays || 0,   label: "Best Streak" },
          { icon: Zap,        color: "text-cyan-600",   bg: "bg-cyan-50",   val: (kpis.xpTotal || 0).toLocaleString(),                 label: "XP Earned" },
        ].map(({ icon: Icon, color, bg, val, label }) => (
          <div key={label} className={`flex items-center gap-4 px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-sm`}>
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 leading-tight">{val}</div>
              <div className="text-xs text-gray-500 font-medium">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Focus Areas — real frequencies × real completion */}
      {focusAreas.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Focus Areas</h2>
          <p className="-mt-3 mb-4 text-xs text-gray-400">Most-tested topics you haven&apos;t mastered yet — from your active roadmap company</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {focusAreas.map((w, idx) => (
              <div key={w.topic} className={`border rounded-xl p-5 ${bgColors[idx % bgColors.length]}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`w-5 h-5 ${textColorsCls[idx % textColorsCls.length]}`} />
                    <span className="font-semibold text-gray-900 text-sm">{w.topic}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 bg-white border border-current/10 px-1.5 py-0.5 rounded-full">
                    {w.pct}% done
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  Tested in <strong>{w.frequencyPct}%</strong> of {firstRoadmap?.companyName ?? "target"} interviews.{" "}
                  {w.pct < 40 ? "Priority gap — start here." : w.pct < 75 ? "Almost there — keep pushing." : "Nearly mastered."}
                </p>
                <button
                  onClick={() =>
                    router.push(`/practice?topic=${encodeURIComponent(w.topic)}`)
                  }
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border ${textColorsCls[idx % textColorsCls.length]} border-current hover:bg-white transition-colors w-full`}
                >
                  Practice Now
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════ ROADMAP TRACK ═══════════ */}
      {track === "roadmap" && (
        <>
          {/* Company Readiness */}
          <section className="mb-8">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Company Readiness</h2>
            {companyReadiness.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
                <MapIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-1 font-medium">No roadmap yet</p>
                <p className="text-xs text-gray-400 mb-4">Add a target company to start tracking readiness.</p>
                <Link href="/companies" className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                  Browse Companies <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {["Company", "Role", "Readiness", "Problems Done", "Last Practiced", "Trend"].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {companyReadiness.map((co: { name: string; slug: string; role: string; pct: number; done: number; total: number; last: string; trend: string; trendColor: string }) => (
                      <tr key={co.name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50:bg-slate-800/60">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
<CompanyLogo name={co.name.toLowerCase()} size={32} />
                            <Link
                              href={`/companies/${co.slug}/practice`}
                              className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                            >
                              {co.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-500">{co.role}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full">
                              <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${co.pct}%` }} />
                            </div>
                            <span className="text-xs font-medium text-gray-700 w-8">{co.pct}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{co.done}/{co.total.toLocaleString()}</td>
                        <td className="px-5 py-4 text-gray-500">{co.last}</td>
                        <td className={`px-5 py-4 font-medium ${co.trendColor}`}>{co.trend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Topic Mastery */}
          <section className="mb-8">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Topic Mastery</h2>
            {topics.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-sm text-gray-400">
                Complete questions from your roadmap to build topic mastery stats.
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                {topics.map((t: { name: string; done: number; total: number; pct: number; color: string; textColor: string }) => (
                  <div key={t.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">{t.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{t.done}/{t.total}</span>
                        <span className={`text-xs font-semibold ${t.textColor} w-10 text-right`}>{t.pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 ${t.color} rounded-full transition-all`} style={{ width: `${t.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ═══════════ PRACTICE TRACK ═══════════ */}
      {track === "practice" && (
        <>
          {practiceStatsError && !pstats ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-10 text-center">
              <Dumbbell className="w-10 h-10 text-red-300 mx-auto mb-3" />
              <p className="text-sm text-red-700 font-medium mb-3">Couldn&apos;t load your practice analytics</p>
              <button onClick={() => retryPracticeStats()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                Try again
              </button>
            </div>
          ) : !pstats ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
              <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium mb-1">No practice activity yet</p>
              <p className="text-xs text-gray-400 mb-4">Solve questions in the Practice Zone and your analytics will appear here.</p>
              <Link href="/practice" className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                Start Practicing <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                {/* Difficulty split */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" /> Difficulty Split
                  </h3>
                  <div className="space-y-3">
                    {difficultyRows.map(d => (
                      <div key={d.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600">{d.label}</span>
                          <span className="text-xs font-bold text-gray-800">{d.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-2 ${d.color} rounded-full`} style={{ width: `${Math.round((d.count / diffTotal) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Question-type breakdown */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" /> By Question Type
                  </h3>
                  {(pstats.byQuestionType ?? []).length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">No data yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {(pstats.byQuestionType as { type: string; count: number }[]).map((t, idx) => (
                        <div key={t.type}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-gray-600 capitalize">{t.type.replace(/_/g, " ")}</span>
                            <span className="text-xs font-bold text-gray-800">{t.count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-1.5 ${colors[idx % colors.length]} rounded-full`} style={{ width: `${Math.round((t.count / byTypeMax) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Momentum */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" /> Last 30 Days
                  </h3>
                  <div className="text-3xl font-black text-gray-900 leading-none mb-1">{thisWeekSolved}</div>
                  <p className="text-[11px] text-gray-400 mb-4">solved in the last 7 days</p>
                  <div className="flex items-end gap-[3px] h-16">
                    {(() => {
                      const trend = pstats.trend ?? [];
                      const maxCount = Math.max(1, ...trend.map((d: { count: number }) => d.count));
                      const byDate = new Map<string, number>(trend.map((d: { date: string; count: number }) => [d.date, d.count] as [string, number]));
                      const bars: React.ReactNode[] = [];
                      for (let i = 29; i >= 0; i--) {
                        const dt = new Date(nowTs - i * 86400000);
                        const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
                        const key = local.toISOString().split("T")[0];
                        const c = byDate.get(key) ?? 0;
                        bars.push(
                          <div
                            key={key}
                            title={`${key}: ${c} solved`}
                            className={`flex-1 rounded-t-sm min-h-[3px] ${c > 0 ? "bg-emerald-500" : "bg-gray-100"}`}
                            style={{ height: `${Math.max(6, (c / maxCount) * 100)}%` }}
                          />
                        );
                      }
                      return bars;
                    })()}
                  </div>
                </div>
              </div>

              {/* Recent completions */}
              <section className="mb-8">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Completions</h2>
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                  {(pstats.recent ?? []).map((r: { _id: string; summary: string; difficulty: string; questionType: string; completedAt: string; xpEarned: number; companySlug?: string }) => (
                    <div key={r._id} className="flex items-start gap-3 px-5 py-3.5">
                      <span className={`mt-0.5 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${
                        r.difficulty === "Easy" ? "bg-green-50 text-green-700" :
                        r.difficulty === "Medium" ? "bg-amber-50 text-amber-700" :
                        "bg-red-50 text-red-600"
                      }`}>{r.difficulty}</span>
                      <p className="flex-1 text-sm text-gray-700 line-clamp-1">{r.summary || "(question summary unavailable)"}</p>
                      <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(r.completedAt)}</span>
                    </div>
                  ))}
                  {(pstats.recent ?? []).length === 0 && (
                    <p className="px-5 py-6 text-sm text-gray-400 text-center">Nothing completed yet.</p>
                  )}
                </div>
              </section>
            </>
          )}
        </>
      )}

      {/* Activity Heatmap — GitHub-style, exact per-day counts on hover */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-semibold text-gray-900">Activity — Past Year</h2>
          <span className="text-xs text-gray-400">Hover any day for your exact solve count</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <ActivityHeatmap data={yearActivityData} days={364} />
        </div>
      </section>
    </div>

    {/* ── Right Sidebar Column (Exact Profile & Coding Profiles match) ── */}
    <div className="xl:col-span-4 sticky top-20">
      <ProgressProfileSidebar user={user} kpis={kpis} />
    </div>
  </div>
</div>
  );
}


// Admin feature-toggle gate (Feature Controls → student.progress)
export default function ProgressPageGate() {
  return (
    <FeatureGate feature="student.progress" title="Progress tracking">
      <ProgressPageInner />
    </FeatureGate>
  );
}
