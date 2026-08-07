"use client";
import { useRouter } from "next/navigation";
import { TrendingUp, Flame, Trophy, Zap, AlertCircle } from "lucide-react";
import CompanyLogo from "@/components/ui/CompanyLogo";
import { getUserRoadmapCompanies } from "@/lib/mock-data";

const companyReadiness = [
  { co: "G", name: "Google",   color: "bg-blue-600",   role: "SDE-1", pct: 34, done: 15, total: 2274, last: "2 days ago", trend: "↑ +5%",  trendColor: "text-green-600" },
  { co: "A", name: "Amazon",   color: "bg-green-500",  role: "SDE-1", pct: 21, done: 8,  total: 1957, last: "5 days ago", trend: "—",       trendColor: "text-gray-400"  },
  { co: "F", name: "Flipkart", color: "bg-blue-500",   role: "SDE-1", pct: 45, done: 22, total: 892,  last: "Today",     trend: "↑ +12%", trendColor: "text-green-600" },
];

const topics = [
  { name: "Arrays & Strings",      done: 12, total: 20, pct: 60, color: "bg-blue-500",    textColor: "text-blue-600"    },
  { name: "Binary Search",         done: 6,  total: 12, pct: 50, color: "bg-indigo-500",  textColor: "text-indigo-600"  },
  { name: "DP",   done: 3,  total: 15, pct: 20, color: "bg-violet-500",  textColor: "text-violet-600"  },
  { name: "Trees",                 done: 5,  total: 18, pct: 28, color: "bg-cyan-500",    textColor: "text-cyan-600"    },
  { name: "Graphs",                done: 2,  total: 16, pct: 13, color: "bg-sky-500",     textColor: "text-sky-600"     },
  { name: "System Design",         done: 1,  total: 10, pct: 10, color: "bg-fuchsia-500", textColor: "text-fuchsia-600" },
];

const weakAreas = [
  { topic: "DP", pct: 10, companies: "Google",   companyPct: 72, color: "text-indigo-600", bgColor: "bg-indigo-50 border-indigo-200" },
  { topic: "Graphs",              pct: 13, companies: "Amazon",   companyPct: 70, color: "text-violet-600", bgColor: "bg-violet-50 border-violet-200" },
  { topic: "System Design",       pct: 10, companies: "Flipkart", companyPct: 65, color: "text-cyan-600",   bgColor: "bg-cyan-50 border-cyan-200"     },
];

// Build a proper GitHub-style 52-week heatmap
// Using current date to calculate which month each cell belongs to
function buildHeatmap() {
  const today = new Date();
  const year = today.getFullYear();
  const start = new Date(today);
  start.setDate(today.getDate() - 363); // 52 weeks back
  // Align to Sunday of that week
  start.setDate(start.getDate() - start.getDay());

  const cells: { date: Date; level: number }[] = [];
  const activeDays = new Set([
    350, 351, 352, 353, 354, 356, 357, 358, 359, 360, 361, 363,
    330, 331, 333, 334, 335, 315, 316, 317, 310,
    280, 281, 282, 285, 290, 291,
  ]);
  for (let i = 0; i < 364; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    let level = 0;
    if (activeDays.has(i)) level = 3;
    else if (i % 11 === 0 && i > 150) level = 2;
    else if (i % 7 === 3 && i > 100) level = 1;
    cells.push({ date: d, level });
  }
  return { cells, startDate: start };
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getHeatColor(level: number) {
  if (level === 0) return "bg-gray-100";
  if (level === 1) return "bg-green-300";
  if (level === 2) return "bg-green-500";
  return "bg-green-700";
}

export default function ProgressPage() {
  const router = useRouter();
  const { cells, startDate } = buildHeatmap();

  // Group into 52 weeks
  const weeks: typeof cells[] = [];
  for (let w = 0; w < 52; w++) {
    weeks.push(cells.slice(w * 7, w * 7 + 7));
  }

  // Month label positions (which week index each month starts)
  const monthPositions: { label: string; weekIdx: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const m = week[0].date.getMonth();
    if (m !== lastMonth) {
      monthPositions.push({ label: MONTH_LABELS[m], weekIdx: wi });
      lastMonth = m;
    }
  });

  const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Progress</h1>

      {/* KPI Stats — compact horizontal pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: TrendingUp, color: "text-blue-600",   bg: "bg-blue-50",   val: "45",    label: "Problems Solved"  },
          { icon: Flame,      color: "text-indigo-600", bg: "bg-indigo-50", val: "12",    label: "Day Streak"       },
          { icon: Trophy,     color: "text-violet-600", bg: "bg-violet-50", val: "18",    label: "Best Streak"      },
          { icon: Zap,        color: "text-cyan-600",   bg: "bg-cyan-50",   val: "2,450", label: "XP Earned"        },
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

      {/* Focus Areas — shown right after KPIs */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Focus Areas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {weakAreas.map((w) => (
            <div key={w.topic} className={`border rounded-xl p-5 ${w.bgColor}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className={`w-5 h-5 ${w.color}`} />
                <span className="font-semibold text-gray-900 text-sm">{w.topic}</span>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                Only {w.pct}% mastered. {w.companies} tests this in {w.companyPct}% of interviews.
              </p>
              <button
                onClick={() => {
                  const targetSlug = w.companies.toLowerCase();
                  router.push(`/companies/${targetSlug}/practice?topic=${encodeURIComponent(w.topic)}`);
                }}
                className={`text-xs font-semibold px-3 py-2 rounded-lg border ${w.color} border-current hover:bg-white/50 transition-colors w-full`}
              >
                Practice Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Company Readiness */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Company Readiness</h2>
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
              {companyReadiness.map((co) => (
                <tr key={co.name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <CompanyLogo
                        name={co.name}
                        className="w-7 h-7 rounded shrink-0"
                      />
                      <span className="font-medium text-gray-900">{co.name}</span>
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
      </section>

      {/* Topic Mastery */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Topic Mastery</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          {topics.map((t) => (
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
      </section>

      {/* GitHub-style Activity Heatmap — exactly 52 weeks × 7 days */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Activity — Past Year</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
            <div className="min-w-[700px] relative">
              {/* Month labels */}
              <div className="flex mb-1 pl-8 relative h-4">
                {monthPositions.map(({ label, weekIdx }) => (
                  <div
                    key={label + weekIdx}
                    className="text-[10px] text-gray-400 absolute top-0"
                    style={{ left: `calc(2rem + ${weekIdx * (12 + 2)}px)` }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex gap-0.5 mt-2">
                {/* Day labels */}
                <div className="flex flex-col gap-0.5 mr-1">
                  {DAY_LABELS.map((d, i) => (
                    <div key={i} className="text-[9px] text-gray-400 h-3 flex items-center w-6 justify-end pr-1">{d}</div>
                  ))}
                </div>
                {/* Weeks */}
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((cell, di) => (
                      <div
                        key={di}
                        title={`${cell.date.toDateString()} — ${cell.level === 0 ? "No activity" : cell.level === 1 ? "Light" : cell.level === 2 ? "Moderate" : "Active"}`}
                        className={`w-3 h-3 rounded-sm cursor-default ${getHeatColor(cell.level)}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-gray-400">
            <span>Less</span>
            {["bg-gray-100", "bg-green-300", "bg-green-500", "bg-green-700"].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </section>
    </div>
  );
}
