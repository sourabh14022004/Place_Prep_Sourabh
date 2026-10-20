"use client";

import { useRouter } from "next/navigation";
import {
  TrendingUp, MessageCircle, CalendarDays, CheckCircle2, Star,
  ArrowUp, MoreVertical, Download, Activity,
  GraduationCap, Users, Wifi, UserX,
} from "lucide-react";
import { useOverviewData } from "@/lib/admin/hooks";

export default function OverviewPage() {
  const router = useRouter();
  const { data, isLoading } = useOverviewData();
  const stats = data?.stats;
  const weeklySessions = data?.weeklySessions || [];
  const sessions = data?.sessions || [];
  const maxCount = Math.max(...weeklySessions.map((w: any) => w.count), 1);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-72" />
        <div className="h-4 bg-gray-200 rounded w-96" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!stats) return null;

  // ─── Hero Row: Platform Totals ───────────────────────────────
  const heroCards = [
    {
      label: "Total Students", value: stats.totalStudents,
      sub: `${stats.activeStudents} active · ${stats.inactiveStudents} inactive`,
      icon: GraduationCap, color: "blue",
    },
    {
      label: "Total Faculty", value: stats.totalFaculty,
      sub: `${stats.activeFaculty} active · ${stats.inactiveFaculty} inactive`,
      icon: Users, color: "emerald",
    },
    {
      label: "Students Online Now", value: stats.currentOnlineStudents,
      sub: `DAU: ${stats.dauStudents} · MAU: ${stats.mauStudents}`,
      icon: Wifi, color: "blue",
      live: true,
    },
    {
      label: "Faculty Online Now", value: stats.currentOnlineFaculty,
      sub: `DAU: ${stats.dauFaculty} · MAU: ${stats.mauFaculty}`,
      icon: Activity, color: "amber",
      live: true,
    },
  ];

  // ─── KPI Row ─────────────────────────────────────────────────
  const kpiCards = [
    { label: "Students on Roadmap", value: stats.studentsOnRoadmap, change: stats.studentsOnRoadmapChange, icon: TrendingUp, color: "blue" },
    { label: "Doubts Raised", value: stats.doubtsRaised, icon: MessageCircle, color: "emerald" },
    { label: "Sessions Booked", value: stats.sessionsBooked, icon: CalendarDays, color: "blue" },
    { label: "Sessions Completed", value: stats.sessionsCompleted, icon: CheckCircle2, color: "amber" },
    { label: "Avg Satisfaction", value: stats.avgSatisfaction, suffix: "/ 5", icon: Star, color: "emerald" },
  ];

  const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
        {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })()}, Admin.
      </h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform overview — {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {/* Hero Row — Platform Totals (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {heroCards.map((card) => {
          const c = colorMap[card.color];
          return (
            <div
              key={card.label}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight">{card.label}</span>
                <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${c.text}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${c.text}`}>{card.value}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {(card as any).live && (
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse shrink-0`} />
                )}
                <span className="text-xs text-gray-400">{card.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        {kpiCards.map((card) => {
          const c = colorMap[card.color];
          return (
            <div
              key={card.label}
              className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight">
                  {card.label}
                </span>
                <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${c.text}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${c.text}`}>{card.value}</span>
                {(card as any).suffix && <span className="text-sm text-gray-400">{(card as any).suffix}</span>}
                {(card as any).change && (
                  <span className="text-sm font-medium text-blue-600 flex items-center gap-0.5">
                    <ArrowUp className="w-3 h-3" /> {(card as any).change}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sessions Chart + Placement Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Sessions per Week</h3>
            <button
              onClick={async () => {
                try {
                  // Must use fetch with credentials:'include' — window.open() is a plain
                  // navigation that never sends HTTP-only cookies, causing 401 on requireAdmin().
                  const res = await fetch(
                    `/api/admin/reports?type=system-utilization&format=csv`,
                    { credentials: 'include' }
                  );
                  if (!res.ok) throw new Error('Export failed');
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `system_utilization_${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  alert('CSV export failed. Please try again.');
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
          <div className="flex items-end gap-2 h-48 bg-gradient-to-b from-blue-50/30 to-white rounded-lg border border-gray-100 p-5">
            {weeklySessions.map((w: any) => (
              <div key={w.week} className="flex-1 flex flex-col justify-end items-center group h-full">
                <span className="text-xs font-bold text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                  {w.count}
                </span>
                <div
                  className="w-full rounded-t-md transition-all hover:opacity-90"
                  style={{
                    height: `${(w.count / maxCount) * 100}%`,
                    background: "linear-gradient(180deg, #2563eb 0%, #6366f1 100%)",
                    boxShadow: "0 -2px 8px rgba(99,102,241,0.25)",
                  }}
                />
                <div className="text-[10px] font-semibold text-gray-400 mt-1.5 uppercase">{w.week}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Placement Rate */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="mb-4 pb-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Placement Rate</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div
              className="relative w-36 h-36 rounded-full flex items-center justify-center mb-4"
              style={{ background: `conic-gradient(#2563eb 0% ${stats.placementRate}%, #6366f1 ${stats.placementRate}% 88%, #cbd5e1 88% 100%)` }}
            >
              <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                <span className="text-2xl font-bold text-gray-900">{stats.placementRate}%</span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Placed</span>
              </div>
            </div>
            <div className="w-full space-y-2">
              {[
                { label: "Placed",      pct: `${stats.totalStudents > 0 ? Math.round((stats.placedStudents / stats.totalStudents) * 100) : 0}%`, color: "bg-blue-600" },
                { label: "In Progress", pct: `${stats.totalStudents > 0 ? Math.round((stats.inProgressStudents / stats.totalStudents) * 100) : 0}%`, color: "bg-indigo-400" },
                { label: "Not Started", pct: `${stats.totalStudents > 0 ? Math.max(0, 100 - Math.round((stats.placedStudents / stats.totalStudents) * 100) - Math.round((stats.inProgressStudents / stats.totalStudents) * 100)) : 0}%`, color: "bg-slate-300" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-gray-600">{item.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Upcoming Sessions</h3>
          <button
            onClick={() => router.push('/admin/bookings')}
            className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
          >View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mentor</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Topic</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date / Time</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-gray-400">
                    No upcoming sessions scheduled
                  </td>
                </tr>
              ) : (
                sessions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                        {s.mentorInitials}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{s.mentorName}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{s.topic}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{s.dateTime}</td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-gray-300 hover:text-gray-500 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
