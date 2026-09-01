"use client";

import { useState, useEffect } from "react";
import { Search, Star, ChevronLeft, ChevronRight, Users, Activity, Target, UserX } from "lucide-react";
import { useFaculty } from "@/lib/hooks";

// Deterministic avatar gradient from name
const GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-indigo-500 to-indigo-700",
  "from-violet-500 to-violet-700",
  "from-cyan-500 to-cyan-700",
  "from-sky-500 to-sky-700",
  "from-blue-600 to-indigo-600",
];
function avatarGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}
function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

// Filled star row component
function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
      <span className="ml-1 text-sm font-bold text-gray-700">{value.toFixed(1)}</span>
    </div>
  );
}

// Mini bar showing response rate
function RateBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? "bg-blue-500" : pct >= 50 ? "bg-indigo-400" : "bg-slate-300"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-500 w-7 text-right">{pct}%</span>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:           "bg-blue-50 text-blue-700 border border-blue-100",
  INACTIVE:         "bg-slate-100 text-slate-500",
  PENDING:          "bg-amber-50 text-amber-700 border border-amber-100",
  "INVITE PENDING": "bg-amber-50 text-amber-700 border border-amber-100",
};

export default function FacultyPage() {
  const [searchInput, setSearchInput]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage]         = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const h = setTimeout(() => { setDebouncedSearch(searchInput); setCurrentPage(1); }, 400);
    return () => clearTimeout(h);
  }, [searchInput]);

  const { faculty, total, isLoading } = useFaculty(currentPage, itemsPerPage, debouncedSearch);
  const totalPages = Math.ceil(total / itemsPerPage);

  // Summary stats derived from real API data
  const totalSessions = faculty.reduce((s: number, f: any) => s + (f.acceptCount ?? 0) + (f.declineCount ?? 0), 0);
  const avgSat = faculty.length > 0
    ? (faculty.reduce((s: number, f: any) => s + (f.satisfactionAvg ?? 0), 0) / faculty.length).toFixed(1)
    : '0.0';
  const avgResp = faculty.length > 0
    ? Math.round(faculty.reduce((s: number, f: any) => s + (f.responseRate ?? 0), 0) / faculty.length)
    : 0;
  const activeCount = faculty.filter((f: any) => f.status === 'ACTIVE').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty</h1>
          <p className="text-sm text-gray-500 mt-0.5">Performance analytics across {total} faculty members.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search faculty…"
            className="pl-8 pr-3 py-2 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400 w-52"
          />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          { icon: Users,    label: "Total Faculty",     value: total,       color: "blue" },
          { icon: Activity, label: "Active Now",         value: activeCount, color: "indigo" },
          { icon: Star,     label: "Avg Satisfaction",  value: avgSat,      color: "cyan" },
          { icon: Target,   label: "Avg Response Rate", value: `${avgResp}%`, color: "blue" },
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

      {/* Faculty table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/40 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500">{total} members found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[780px]">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                {["Faculty Member", "Subject", "Accepted / Declined", "Satisfaction", "Response Rate", "Status"].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Skeleton rows — mirrors: avatar | subject | accepted/declined | stars | rate bar | status
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-28 bg-gray-200 rounded" />
                          <div className="h-3 w-14 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3"><div className="h-5 w-20 bg-indigo-100 rounded" /></td>
                    <td className="px-6 py-3"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                    <td className="px-6 py-3"><div className="h-4 w-20 bg-amber-100 rounded" /></td>
                    <td className="px-6 py-3"><div className="h-2 w-28 bg-gray-200 rounded-full" /></td>
                    <td className="px-6 py-3"><div className="h-5 w-16 bg-gray-100 rounded-full" /></td>
                  </tr>
                ))
              ) : faculty.length > 0 ? faculty.map((f) => (
                <tr
                  key={f.id}
                  className={`border-b border-gray-50 hover:bg-blue-50/20 transition-colors ${f.status === "INACTIVE" ? "opacity-50" : ""}`}
                >
                  {/* Avatar + name */}
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-5">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(f.name)} text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-sm`}>
                        {initials(f.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{f.name}</p>
                        <p className="text-xs text-gray-400">ID #{f.id.toString().padStart(3, "0")}</p>
                      </div>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700">
                      {f.subject}
                    </span>
                  </td>

                  {/* Accepted / Declined */}
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-600">{f.accepted}</span>
                      <span className="text-gray-200">/</span>
                      <span className="text-sm font-bold text-slate-400">{f.declined}</span>
                      {/* mini ratio bar */}
                      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(f.accepted / (f.accepted + f.declined || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Star rating */}
                  <td className="px-6 py-3">
                    <StarRating value={f.satisfaction} />
                  </td>

                  {/* Response rate bar */}
                  <td className="px-6 py-3 w-36">
                    <RateBar pct={f.responseRate} />
                  </td>

                  {/* Status badge */}
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[f.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {f.status === "ACTIVE" && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                      {f.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <UserX className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-400">No faculty members found.</p>
                    <p className="text-xs text-gray-300 mt-1">Try adjusting your search.</p>
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
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
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
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
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
