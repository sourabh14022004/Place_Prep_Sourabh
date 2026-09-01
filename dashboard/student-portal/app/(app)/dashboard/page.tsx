"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, Trophy, ExternalLink,
  Clock, ChevronRight, Zap, Flame, Target, Minus, Plus, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import useSWR, { mutate as globalMutate } from "swr";

import { useDashboard, completeQuestion, fetcher, updateProfile } from "@/lib/hooks";
import { getPracticeUrl, getPlatformInfo } from "@/lib/constants";
import { CompanyLogo } from "@/components/ui";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import { StatTile, ProgressRing, DifficultyDonut } from "@/components/Stats";

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [goalSaving, setGoalSaving] = useState(false);

  // Primary dashboard data
  const { data: apiData, isLoading, error, mutate: mutateDashboard } = useDashboard();
  const { data: expData } = useSWR('/api/experiences?limit=3', fetcher);
  const { data: completedData, mutate: mutateCompleted } = useSWR('/api/user/me/completed-questions', fetcher);

  useEffect(() => {
    const completedIds: string[] = completedData?.completedQuestions?.map((q: any) => q.questionId) ?? [];
    if (completedIds.length > 0) {
      setChecked((prev) => {
        const next = { ...prev };
        completedIds.forEach((id) => { next[id] = true; });
        return next;
      });
    }
  }, [completedData]);

  useEffect(() => {
    if (error && apiData) {
      toast.error("Couldn't refresh dashboard — showing your last loaded data.");
    }
  }, [error, apiData]);

  const stats = apiData?.stats ?? {};
  const solved    = stats.problemsSolved ?? 0;
  const assigned  = stats.totalAssigned ?? 0;
  const streak    = stats.currentStreakDays ?? 0;
  const bestStreak = stats.bestStreakDays ?? 0;
  const xp        = stats.xpTotal ?? 0;
  const prepScore = stats.prepScore ?? 0;
  const todaySolved = stats.todaySolved ?? 0;
  const dailyGoal   = stats.dailyGoal ?? 5;
  const batchRank   = stats.batchRank;
  const studentName = apiData?.student?.fullName ?? "Student";
  const firstName = studentName.split(" ")[0];
  const recentExperiences = (Array.isArray(expData) ? expData : (expData?.experiences ?? expData?.data ?? [])).slice(0, 3);
  const latestActivity = stats.latestActivity;

  /** Codolio-style goal stepper — optimistic + server persist */
  const adjustGoal = async (delta: number) => {
    const next = Math.max(1, Math.min(50, dailyGoal + delta));
    if (next === dailyGoal || goalSaving) return;
    setGoalSaving(true);
    try {
      await updateProfile({ dailyGoal: next });
      await mutateDashboard(); // re-derives todaySolved/dailyGoalPct
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update goal");
    } finally {
      setGoalSaving(false);
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const targetCompanies = (apiData?.roadmaps || []).map((r: any) => ({
    name: r.companyName,
    role: r.roleName,
    readiness: r.pctComplete,
    slug: r.companySlug,
  }));

  const tasks     = apiData?.roadmaps ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-gray-100" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (<div key={i} className="h-24 rounded-2xl bg-gray-100" />))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="h-40 rounded-2xl bg-gray-100" />
            <div className="h-72 rounded-2xl bg-gray-100" />
          </div>
          <div className="space-y-5">
            <div className="h-56 rounded-2xl bg-gray-100" />
            <div className="h-40 rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Greeting header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {greeting}, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">{dateStr}
            {latestActivity ? ` · last solve ${timeAgo(latestActivity.completedAt)}` : " · start your first task today!"}
          </p>
        </div>
        {/* Prep Score chip */}
        <Link
          href="/progress"
          className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        >
          <ProgressRing pct={prepScore} size={44} stroke={5}>
            <span className="text-xs font-black text-gray-900">{prepScore}</span>
          </ProgressRing>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Prep Score</div>
            <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:underline">
              View breakdown <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </Link>
      </div>

      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={Target} value={solved.toLocaleString()} label="Problems Solved"
          sub={assigned ? `${Math.round((solved / assigned) * 100)}% of roadmap` : undefined}
          href="/progress" />
        <StatTile icon={Flame} value={`${streak}d`} label="Current Streak"
          sub={`best ${bestStreak}d`} iconClasses="bg-orange-50 text-orange-500" />
        <StatTile icon={Zap} value={xp.toLocaleString()} label="Total XP"
          sub="+10–50 per difficulty" iconClasses="bg-amber-50 text-amber-500" href="/leaderboard" />
        <StatTile icon={Trophy} value={batchRank ? `#${batchRank}` : "—"} label="Batch Rank"
          sub={batchRank && batchRank <= 10 ? "top 10 🔥" : "keep climbing"}
          iconClasses="bg-violet-50 text-violet-600" href="/leaderboard" />
      </div>

      {/* ── Main two-column zone ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5 min-w-0">

          {/* Company platform-cards (Codolio platform-card aesthetic) */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-gray-900">Company Progress</h2>
              <Link href="/companies" className="text-xs font-semibold text-blue-600 hover:underline">Add company</Link>
            </div>
            {targetCompanies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                <Target className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">No target companies yet</p>
                <p className="mb-4 mt-0.5 text-xs text-gray-400">Pick a company to generate your first roadmap.</p>
                <button onClick={() => router.push("/companies")} className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800">
                  Browse companies
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {targetCompanies.map((co: any) => (
                  <Link
                    key={co.slug}
                    href={`/roadmap?company=${co.slug}`}
                    className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-blue-50 blur-xl transition-opacity group-hover:opacity-80" />
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="min-w-0">
<CompanyLogo name={co.slug} size={32} />
                        <div className="truncate font-bold text-gray-900">{co.name}</div>
                        <div className="truncate text-[11px] text-gray-400">{co.role}</div>
                      </div>
                      <ProgressRing pct={co.readiness} size={52} stroke={6}
                        color={co.readiness >= 75 ? "#10b981" : co.readiness >= 40 ? "#2563eb" : "#f59e0b"}>
                        <span className="text-[11px] font-black text-gray-900">{co.readiness}%</span>
                      </ProgressRing>
                    </div>
                    <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                        style={{ width: `${co.readiness}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Today's Tasks */}
          {tasks.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold tracking-tight text-gray-900">Today&apos;s Tasks</h2>
                <span className="text-xs text-gray-400">tap to mark done · earn XP instantly</span>
              </div>
              <div className="space-y-4">
                {tasks.map((co: any, index: number) => (
                  <div key={co.companySlug || `task-${index}`} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3">
                      <div className="flex items-center gap-2.5">
<CompanyLogo name={co.companySlug} size={28} />
                        <span className="text-sm font-bold text-gray-900">{co.companyName}</span>
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          Week {co.currentWeek}, Day {co.currentDay ?? 1}
                        </span>
                        {co.tasksSource === 'extra' && (
                          <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            Extra practice
                          </span>
                        )}
                      </div>
                      <Link href={`/roadmap?company=${co.companySlug}`} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                        Roadmap <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div className="divide-y divide-gray-50">
                      {(co.questions || []).length === 0 ? (
                        <div className="px-5 py-4 text-center text-sm text-gray-400">
                          No questions available for this week&apos;s topic yet.
                        </div>
                      ) : (co.questions || []).slice(0, tasks.length === 1 ? 5 : 3).map((q: any) => (
                        <div
                          key={q.id}
                          className="flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-blue-50/30"
                          onClick={async () => {
                            const wasChecked = !!checked[q.id];
                            setChecked((c) => ({ ...c, [q.id]: true }));
                            try {
                              if (!wasChecked) {
                                const result: any = await completeQuestion(q.id, co._id);
                                await mutateCompleted();
                                if (!result?.alreadyCompleted) {
                                  toast.success(`+${q.xp} XP earned!`, { duration: 2000 });
                                }
                              } else {
                                const res = await fetch(`/api/questions/${q.id}/complete`, {
                                  method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                                });
                                if (!res.ok) throw new Error('Failed to unmark');
                                setChecked((c) => ({ ...c, [q.id]: false }));
                                await mutateCompleted();
                                await globalMutate('/api/user/me');
                                toast(`-${q.xp} XP removed`, { duration: 2000 });
                              }
                            } catch (err: any) {
                              if (!err.message?.includes('already')) {
                                setChecked((c) => ({ ...c, [q.id]: wasChecked }));
                                toast.error(err.message ?? 'Failed to update question');
                              }
                            }
                          }}
                        >
                          <CheckCircle2 className={`h-5 w-5 shrink-0 ${checked[q.id] ? "fill-emerald-50 text-emerald-500" : "text-gray-200"}`} />
                          <span className={`flex-1 truncate text-sm font-medium ${checked[q.id] ? "text-gray-400 line-through" : "text-gray-800"}`}>
                            {q.title}
                          </span>
                          <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${
                            q.difficulty === "Easy" ? "bg-green-50 text-green-700" :
                            q.difficulty === "Medium" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600"
                          }`}>{q.difficulty}</span>
                          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-amber-600">
                            <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />{q.xp}
                          </span>
                          {(() => {
                            const practiceUrl = getPracticeUrl(q);
                            return practiceUrl ? (
                              <a
                                href={practiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={`Solve on ${getPlatformInfo(practiceUrl).name}`}
                                aria-label={`Open ${q.title} on ${getPlatformInfo(practiceUrl).name}`}
                                className="p-1 text-gray-300 hover:text-blue-500 rounded transition-colors shrink-0"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-100" />
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Right rail ── */}
        <aside className="space-y-5 min-w-0">
          {/* Daily Goal ring — Codolio signature */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-400">Daily Goal</h3>
            <div className="flex items-center gap-5">
              <ProgressRing pct={stats.dailyGoalPct ?? 0} size={104} stroke={11}
                color={(stats.dailyGoalPct ?? 0) >= 100 ? "#10b981" : "#2563eb"}>
                <span className="text-xl font-black text-gray-900">{todaySolved}</span>
                <span className="text-[10px] font-medium text-gray-400">of {dailyGoal}</span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">
                  {(stats.dailyGoalPct ?? 0) >= 100 ? "Goal smashed! 🎉" : `${Math.max(dailyGoal - todaySolved, 0)} more to go`}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-400">
                  {(stats.dailyGoalPct ?? 0) >= 100 ? "Streak is safe for today." : "Solve any practice question to count."}
                </p>
                <div className="mt-3 inline-flex items-center rounded-lg border border-gray-200">
                  <button onClick={() => adjustGoal(-1)} disabled={goalSaving || dailyGoal <= 1}
                    className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Decrease goal"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="min-w-[2.5rem] border-x border-gray-100 px-2 py-1 text-center text-xs font-bold tabular-nums">{dailyGoal}/day</span>
                  <button onClick={() => adjustGoal(1)} disabled={goalSaving || dailyGoal >= 50}
                    className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Increase goal"><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty split */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-400">Difficulty Split</h3>
            <DifficultyDonut
              easy={stats.easySolved ?? 0}
              medium={stats.mediumSolved ?? 0}
              hard={stats.hardSolved ?? 0}
              size={112}
            />
          </div>

          {/* Activity heatmap compact */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Activity</h3>
              <Link href="/progress" className="text-[10px] font-medium text-blue-600 hover:underline">Full year →</Link>
            </div>
            <ActivityHeatmap data={stats.weeklyActivity ?? []} days={35} compact />
          </div>

          {/* Streak highlight */}
          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-5 ring-1 ring-orange-100">
            <Flame className="h-9 w-9 text-orange-500" />
            <div className="min-w-0 flex-1">
              <div className="text-2xl font-black leading-none text-gray-900">{streak}<span className="text-sm font-bold text-gray-400">d</span></div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">current streak · best {bestStreak}d</div>
            </div>
            {(stats.dailyGoalPct ?? 0) < 100 && streak > 0 && (
              <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-700">at risk!</span>
            )}
          </div>

        </aside>
      </div>

      {/* Recent interview reports strip */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-gray-900">Recent Interview Reports</h2>
          <Link href="/submit" className="text-xs font-semibold text-blue-600 hover:underline">Browse all</Link>
        </div>
        {recentExperiences.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
            No reports yet. <Link href="/submit" className="font-medium text-blue-600 hover:underline">Be the first to share yours.</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recentExperiences.map((r: any) => (
              <Link key={r._id} href={`/submit?expand=${r._id}`}
                className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-gray-200 hover:shadow-md">
                <div className="mb-2 flex items-center gap-2">
                  <CompanyLogo name={r.companySlug} size={28} className="rounded-lg" />
                  <span className="text-sm font-bold capitalize text-gray-900">{r.companySlug}</span>
                  <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{r.roundsCount} rounds</span>
                </div>
                <p className="truncate text-xs text-gray-500">{r.role || "Software Engineer"}</p>
                <div className="mt-2 flex gap-1">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">{r.outcome}</span>
                  {r.overallDifficulty && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">{r.overallDifficulty}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
