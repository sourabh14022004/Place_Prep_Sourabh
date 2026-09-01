"use client";

import { usePracticeData } from "@/lib/hooks";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Dumbbell, Users, BookOpen, TrendingUp } from "lucide-react";

const DOMAINS = ["DSA", "DBMS", "OS", "System Design", "CN", "Aptitude"];
const DOMAIN_COLORS: Record<string, string> = {
  DSA: "#2563eb", DBMS: "#6366f1", OS: "#0891b2",
  "System Design": "#7c3aed", CN: "#06b6d4", Aptitude: "#64748b",
};

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-56 bg-gray-200 rounded" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-52 bg-gray-200 rounded-xl" />
      <div className="h-72 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default function PracticeZonePage() {
  const { data, isLoading } = usePracticeData("30d");

  if (isLoading) return <Skeleton />;
  if (!data) return null;

  const kpis = [
    { label: "Total Questions Solved", value: data.summary.totalSolved.toLocaleString(), icon: BookOpen, color: "blue" },
    { label: "Active Solvers Today", value: data.summary.activeSolversToday.toLocaleString(), icon: Users, color: "emerald" },
    { label: "Top Domain", value: data.summary.topDomain, icon: TrendingUp, color: "amber" },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
  };

  // Build batch × domain data for the table
  const domainData = data.byDomain as { domain: string; questionsSolved: number; uniqueStudents: number }[];
  const totalByDomain = domainData.reduce((acc: Record<string, number>, d) => {
    acc[d.domain] = d.questionsSolved;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Practice Zone Analytics</h1>
        <p className="text-xs text-gray-500 mt-0.5">Track which students are solving practice questions and from which domain</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kpis.map((k) => {
          const c = colorMap[k.color];
          return (
            <div key={k.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{k.label}</span>
                <div className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center`}>
                  <k.icon className={`w-3.5 h-3.5 ${c.text}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${c.text}`}>{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Domain-wise bar chart */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Questions Solved — By Domain</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.byDomain} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="domain" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
              formatter={(v: any, name: string) => [v.toLocaleString(), name]}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="questionsSolved" name="Questions Solved" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {(data.byDomain as { domain: string; questionsSolved: number; uniqueStudents: number }[]).map((entry) => (
                <rect key={entry.domain} fill={DOMAIN_COLORS[entry.domain] || "#2563eb"} />
              ))}
            </Bar>
            <Bar dataKey="uniqueStudents" name="Unique Students" fill="#a5b4fc" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily solvers trend */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Daily Unique Solvers — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data.dailySolvers} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            <Line type="monotone" dataKey="uniqueSolvers" name="Unique Solvers" stroke="#2563eb" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Batch × Domain matrix */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Batch × Domain Question Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[520px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-2 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Batch</th>
                {DOMAINS.map((d) => (
                  <th key={d} className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: DOMAIN_COLORS[d] }}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data.batchDomainMatrix as { batch: string; domains: Record<string, number> }[]).map((row) => (
                <tr key={row.batch} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3 text-xs font-semibold text-gray-900">Batch {row.batch}</td>
                  {DOMAINS.map((d) => {
                    const val = row.domains[d] ?? 0;
                    const pct = totalByDomain[d] ? (val / totalByDomain[d]) * 100 : 0;
                    return (
                      <td key={d} className="py-2.5 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-gray-800">{val.toLocaleString()}</span>
                          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: DOMAIN_COLORS[d] }} />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
