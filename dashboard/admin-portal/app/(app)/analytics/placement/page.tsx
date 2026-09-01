"use client";

import { usePlacementData } from "@/lib/hooks";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Legend,
} from "recharts";
import { Building2, GraduationCap, TrendingUp, CheckCircle2 } from "lucide-react";

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-56 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function PlacementPage() {
  const { data, isLoading } = usePlacementData();

  if (isLoading) return <Skeleton />;
  if (!data) return null;

  const placed2023 = data.batchPlacementRate.find((b: { batch: string; rate: number; placed: number; total: number }) => b.batch === "2023");

  const kpis = [
    { label: "Top Target Company", value: data.companyInterest[0]?.company ?? "—", icon: Building2, color: "blue" },
    { label: "2023 Placement Rate", value: `${placed2023?.rate ?? 0}%`, icon: CheckCircle2, color: "emerald" },
    { label: "Highest Interest", value: `${data.companyInterest[0]?.studentCount ?? 0} students`, icon: GraduationCap, color: "blue" },
    { label: "Latest Solve Rate", value: `${data.assignmentSolveRate.at(-1)?.rate ?? 0}%`, icon: TrendingUp, color: "amber" },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Placement Tracker</h1>
        <p className="text-xs text-gray-500 mt-0.5">Company interest, batch placement rates, and assignment completion</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              <p className={`text-xl font-bold ${c.text} truncate`}>{k.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Company interest leaderboard */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Company Interest Ranking</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data.companyInterest}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="company" tick={{ fontSize: 10 }} width={70} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
                formatter={(v: any) => [`${v} students`, "Interest"]}
              />
              <Bar dataKey="studentCount" name="Students" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Batch placement rate */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Batch-wise Placement Rate</h2>
          <div className="space-y-3 mt-2">
            {(data.batchPlacementRate as { batch: string; rate: number; placed: number; total: number }[]).map((b) => (
              <div key={b.batch}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">Batch {b.batch}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400">{b.placed}/{b.total} placed</span>
                    <span className={`text-xs font-bold ${b.rate >= 70 ? "text-blue-600" : b.rate >= 30 ? "text-indigo-500" : "text-slate-400"}`}>
                      {b.rate}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${b.rate >= 70 ? "bg-blue-600" : b.rate >= 30 ? "bg-indigo-400" : "bg-slate-300"}`}
                    style={{ width: `${b.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-4">* 2026 batch is in Year 1 — placement cycle not started</p>
        </div>
      </div>

      {/* Assignment solve rate trend */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Assignment Solve Rate — Weekly Trend</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">% of students completing assigned work on time</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data.assignmentSolveRate} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="period" tick={{ fontSize: 9 }} />
            <YAxis domain={[50, 100]} tick={{ fontSize: 9 }} unit="%" />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
              formatter={(v: any) => [`${v}%`, "Solve Rate"]}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="rate" name="Solve Rate %" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: "#2563eb" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
