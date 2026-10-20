"use client";

import Link from "next/link";
import { useState, useEffect, Fragment } from "react";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Users,
  TrendingUp,
  Briefcase,
  GraduationCap,
  UserX,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Flame,
  Calendar,
} from "lucide-react";
import { useStudents, useStudentStats, useStudent } from "@/lib/admin/hooks";
import { CompanyLogo, PlatformLogo } from "@/components/ui";
import type { Student } from "@/lib/admin/types";

// Avatar color palette — deterministic from name
const AVATAR_COLORS = [
  "from-blue-500 to-blue-700",
  "from-indigo-500 to-indigo-700",
  "from-violet-500 to-violet-700",
  "from-cyan-500 to-cyan-700",
  "from-sky-500 to-sky-700",
  "from-blue-600 to-indigo-600",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

const STATUS_STYLES: Record<string, { badge: string; dot: string; bar: string }> = {
  PLACED:        { badge: "bg-blue-50 text-blue-700 border border-blue-100",   dot: "bg-blue-500",   bar: "bg-blue-500" },
  "IN PROGRESS": { badge: "bg-indigo-50 text-indigo-700 border border-indigo-100", dot: "bg-indigo-400", bar: "bg-indigo-400" },
  INACTIVE:      { badge: "bg-slate-100 text-slate-500",                        dot: "bg-slate-400",  bar: "bg-slate-300" },
};

function ProgressBar({ pct, bar }: { pct: number; bar: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-500 w-7 shrink-0 text-right">{pct}%</span>
    </div>
  );
}

// ── Expandable Student Stats Dropdown ──────────────────────────────
function StudentStatsDropdown({ student }: { student: Student }) {
  const { student: detail, isLoading } = useStudent(student.id?.toString() ?? null);

  const roadmaps = detail?.roadmaps ?? [];
  const roadmapsCount = detail?.totalRoadmaps ?? roadmaps.length ?? student.roadmapsCount ?? 0;
  const problemsSolved = detail?.problemsSolved ?? 0;
  const xp = detail?.xpTotal ?? student.xpTotal ?? 0;
  const streak = detail?.currentStreakDays ?? student.currentStreakDays ?? 0;
  const doubts = detail?.totalDoubts ?? student.doubts ?? 0;
  const sessions = detail?.totalSessions ?? student.sessions ?? 0;
  const targetCompanies: string[] = detail?.targetCompanySlugs ?? student.targetCompanySlugs ?? [];
  const platformHandles = detail?.platformHandles ?? student.platformHandles ?? {};

  return (
    <div className="bg-gradient-to-b from-blue-50/50 via-slate-50/30 to-white p-5 sm:p-6 border-b border-blue-100/70 space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200/70">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            📊
          </span>
          <h4 className="text-sm font-bold text-gray-900">
            {student.fullName ?? student.name}&apos;s Live Analytics & Roadmap Intel
          </h4>
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-100">
            Batch {student.batch}
          </span>
          {student.email && (
            <span className="text-xs text-gray-400 font-normal">
              • {student.email}
            </span>
          )}
        </div>
      </div>

      {/* KPI metric strip (Overall stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Roadmaps */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-1.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Roadmaps</span>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{roadmapsCount}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Enrolled pathways</p>
        </div>

        {/* Problems Solved */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Solved</span>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{problemsSolved}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Verified problems</p>
        </div>

        {/* Total XP */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Total XP</span>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{xp.toLocaleString()} XP</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Platform points</p>
        </div>

        {/* Streak */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Streak</span>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{streak} Days</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Daily practice</p>
        </div>

        {/* Doubts & Mentorship */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Doubts / 1:1</span>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{doubts} / {sessions}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Doubts / Sessions</p>
        </div>
      </div>

      {/* Followed Roadmaps section */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Followed Roadmaps ({roadmapsCount})
            </h5>
            <span className="text-[11px] text-gray-400">
              Target companies and curriculum progress
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1].map(i => (
              <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl p-4 animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-2 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            ))}
          </div>
        ) : roadmaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {roadmaps.map((r: any) => (
              <div
                key={r._id || r.companySlug}
                className="bg-white border border-gray-200/90 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <CompanyLogo name={r.companySlug || r.companyName} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-gray-900 truncate">
                      {r.companyName || r.title}
                    </div>
                    <div className="text-[11px] font-medium text-gray-500 truncate">
                      {r.targetRole || "Software Engineering"} • {r.totalWeeks} Weeks
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize border border-blue-100 shrink-0">
                    {r.status || "Active"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 text-[11px]">Curriculum Progress</span>
                    <span className="font-bold text-gray-900 text-[11px]">{r.progressPct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(r.progressPct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 pt-0.5">
                    <span>{r.doneQuestions} of {r.totalQuestions} questions completed</span>
                    {r.lastActive && (
                      <span>Active {new Date(r.lastActive).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-5 text-center">
            <BookOpen className="w-5 h-5 text-gray-300 mx-auto mb-1" />
            <p className="text-xs font-semibold text-gray-600">No active roadmaps followed</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Student has not started any company preparation roadmaps yet.</p>
          </div>
        )}
      </div>

      {/* Target Companies & Coding Profiles Footer Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200/70 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          {/* Target Companies */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wide">Target Companies:</span>
            {targetCompanies.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {targetCompanies.map((slug: string) => (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700 text-[11px] font-medium shadow-2xs"
                  >
                    <CompanyLogo name={slug} size={16} />
                    <span className="capitalize">{slug}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 text-[11px]">None selected</span>
            )}
          </div>

          {/* Coding Profiles */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wide">Profiles:</span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium shadow-2xs ${
              platformHandles.leetcode
                ? "bg-orange-50/70 border-orange-200 text-orange-700"
                : "bg-gray-50 border-gray-200 text-gray-400"
            }`}>
              <PlatformLogo platform="leetcode" size={16} />
              {platformHandles.leetcode ? `@${platformHandles.leetcode}` : "Not connected"}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium shadow-2xs ${
              platformHandles.codeforces
                ? "bg-blue-50/70 border-blue-200 text-blue-700"
                : "bg-gray-50 border-gray-200 text-gray-400"
            }`}>
              <PlatformLogo platform="codeforces" size={16} />
              {platformHandles.codeforces ? `@${platformHandles.codeforces}` : "Not connected"}
            </span>
          </div>
        </div>

        <Link
          href={`/admin/students/${student.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs"
        >
          View Full Placement Journey <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [searchInput, setSearchInput]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBatch, setSelectedBatch]     = useState("All");
  const [currentPage, setCurrentPage]         = useState(1);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const itemsPerPage = 8;

  useEffect(() => {
    const h = setTimeout(() => { setDebouncedSearch(searchInput); setCurrentPage(1); }, 400);
    return () => clearTimeout(h);
  }, [searchInput]);

  const { students, total, isLoading } = useStudents(currentPage, itemsPerPage, debouncedSearch, selectedBatch);
  const totalPages = Math.ceil(total / itemsPerPage);

  // Summary stats — use server-side `total` for the real student count.
  const totalCount  = total;
  const { data: statsData } = useStudentStats();
  const placedCount = statsData?.placedCount   ?? students.filter((s: any) => s.status === 'PLACED').length;
  const avgProg     = statsData?.avgProgress   ?? 0;
  const batches     = statsData?.batchCount    ?? new Set(students.map((s: any) => s.batch ?? s.year)).size;

  const BATCH_OPTIONS = ["All", "2023", "2024", "2025", "2026"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalCount} enrolled · {batches} active batches</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              className="pl-8 pr-3 py-2 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400 w-52"
              placeholder="Search name or batch…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          {/* Batch pills — desktop */}
          <div className="hidden sm:flex items-center gap-1">
            {BATCH_OPTIONS.map(b => (
              <button
                key={b}
                onClick={() => { setSelectedBatch(b); setCurrentPage(1); }}
                className={`px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  selectedBatch === b
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          {/* Batch select — mobile */}
          <select
            className="sm:hidden px-2.5 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 border-0 focus:ring-2 focus:ring-blue-500/20"
            value={selectedBatch}
            onChange={e => { setSelectedBatch(e.target.value); setCurrentPage(1); }}
          >
            {BATCH_OPTIONS.map(b => <option key={b} value={b}>{b === 'All' ? 'All Batches' : `Batch ${b}`}</option>)}
          </select>
          {(searchInput || selectedBatch !== "All") && (
            <button
              onClick={() => { setSearchInput(""); setSelectedBatch("All"); setCurrentPage(1); }}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          { icon: Users,        label: "Total Students", value: totalCount, color: "blue" },
          { icon: Briefcase,    label: "Placed",          value: placedCount, color: "indigo" },
          { icon: TrendingUp,   label: "Avg Progress",   value: `${avgProg}%`, color: "cyan" },
          { icon: GraduationCap,label: "Active Batches", value: batches, color: "blue" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-5">
            <div className={`w-10 h-10 rounded-lg bg-${k.color}-50 text-${k.color}-600 flex items-center justify-center shrink-0`}>
              <k.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">{k.label}</p>
              <p className="text-2xl font-black text-gray-900 leading-tight">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/40">
          <span className="text-sm font-semibold text-gray-500">{total} students found</span>
          <span className="text-xs text-gray-400">Click any student to view roadmap &amp; performance stats</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                {["Student", "Batch", "Progress", "Doubts", "Sessions", "Status", ""].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-28 bg-gray-200 rounded" />
                          <div className="h-3 w-16 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3"><div className="h-5 w-12 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-3"><div className="h-2 w-28 bg-gray-200 rounded-full" /></td>
                    <td className="px-6 py-3 text-center"><div className="h-4 w-4 bg-gray-200 rounded mx-auto" /></td>
                    <td className="px-6 py-3 text-center"><div className="h-4 w-4 bg-gray-200 rounded mx-auto" /></td>
                    <td className="px-6 py-3"><div className="h-5 w-20 bg-gray-100 rounded-full" /></td>
                    <td className="px-6 py-3" />
                  </tr>
                ))
              ) : students.length > 0 ? students.map((s) => {
                const st = STATUS_STYLES[s.status] ?? STATUS_STYLES["IN PROGRESS"];
                const isExpanded = expandedStudentId === s.id.toString();
                return (
                  <Fragment key={s.id}>
                    <tr
                      onClick={() => setExpandedStudentId(prev => prev === s.id.toString() ? null : s.id.toString())}
                      className={`border-b border-gray-50 transition-colors cursor-pointer group ${
                        isExpanded ? "bg-blue-50/40" : "hover:bg-blue-50/20"
                      }`}
                    >
                      {/* Name + avatar */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(s.fullName ?? s.name ?? '')} text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-sm`}>
                            {initials(s.fullName ?? s.name ?? '?')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                              {s.fullName ?? s.name}
                            </p>
                            <p className="text-xs text-gray-400">ID #{s.id.toString().padStart(4, "0")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">
                          {s.batch}
                        </span>
                      </td>
                      <td className="px-6 py-3 w-36">
                        <ProgressBar pct={s.progress} bar={st.bar} />
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-sm font-bold text-gray-700">{s.doubts}</span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-sm font-bold text-gray-700">{s.sessions}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${st.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/students/${s.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Profile <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                          <div
                            className={`p-1.5 rounded-lg transition-transform text-gray-400 group-hover:text-gray-600 ${
                              isExpanded ? "rotate-180 text-blue-600" : ""
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded details dropdown row */}
                    {isExpanded && (
                      <tr className="border-b border-gray-100">
                        <td colSpan={7} className="p-0">
                          <StudentStatsDropdown student={s} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <UserX className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-400">No students found.</p>
                    <p className="text-xs text-gray-300 mt-1">Try clearing your search or filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50/40">
            <span className="text-sm text-gray-400 font-medium">Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                    currentPage === p ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
