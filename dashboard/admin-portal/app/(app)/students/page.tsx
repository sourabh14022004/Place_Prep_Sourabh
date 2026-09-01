"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, X, ChevronLeft, ChevronRight, ArrowUpRight, Users, TrendingUp, Briefcase, GraduationCap, UserX } from "lucide-react";
import { useStudents, useStudentStats } from "@/lib/hooks";

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

export default function StudentsPage() {
  const [searchInput, setSearchInput]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [currentPage, setCurrentPage]     = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const h = setTimeout(() => { setDebouncedSearch(searchInput); setCurrentPage(1); }, 400);
    return () => clearTimeout(h);
  }, [searchInput]);

  const { students, total, isLoading } = useStudents(currentPage, itemsPerPage, debouncedSearch, selectedBatch);
  const totalPages = Math.ceil(total / itemsPerPage);

  // Summary stats — use server-side `total` for the real student count.
  // placedCount and avgProg are fetched from a stats endpoint so they
  // reflect ALL students, not just the current page (previously a P1 bug).
  const totalCount  = total;
  // Fetch platform-wide stats (placed count, avg progress, batch count) from API.
  // These don't depend on current page/filter so they always reflect the full DB.
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
          {/* Batch select — mobile (replaces hidden pills so mobile users can filter too) */}
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
                // Skeleton rows — matches table columns: avatar | batch | progress bar | doubts | sessions | status | action
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
              ) : students.length > 0 ? students.map((s, idx) => {
                const st = STATUS_STYLES[s.status] ?? STATUS_STYLES["IN PROGRESS"];
                return (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors group"
                  >
                    {/* Name + avatar */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(s.fullName ?? s.name ?? '')} text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-sm`}>
                          {initials(s.fullName ?? s.name ?? '?')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 leading-tight">{s.fullName ?? s.name}</p>
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
                      <Link href={`/students/${s.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-all bg-blue-50 px-3 py-1.5 rounded-lg">
                        View Profile <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
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
