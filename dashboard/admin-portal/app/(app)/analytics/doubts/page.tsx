"use client";

import { useState } from "react";
import { useDoubtsData } from "@/lib/hooks";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import HourlyHeatmap from "@/components/charts/HourlyHeatmap";
import { MessageCircle, CheckCircle2, Percent, Clock } from "lucide-react";

const RANGES = ["Daily", "Weekly", "Monthly", "Yearly"] as const;
type Range = typeof RANGES[number];

const SUBJECT_COLORS = ["#2563eb", "#6366f1", "#0891b2", "#7c3aed", "#06b6d4", "#64748b"];

// Dot sparkline for resolution rate
function ResolutionDots({ rate }: { rate: number }) {
  const total = 10;
  const filled = Math.round((rate / 100) * total);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < filled ? "bg-blue-500" : "bg-gray-100"}`} />
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-56 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-52 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  );
}

export default function DoubtsIntelPage() {
  const [range, setRange] = useState<Range>("Monthly");
  const { data, isLoading } = useDoubtsData(range.toLowerCase());

  if (isLoading) return <Skeleton />;
  if (!data) return null;

  const kpis = [
    { label: "Total Raised",          value: data.summary.totalRaised.toLocaleString(),    icon: MessageCircle, color: "blue" },
    { label: "Total Resolved",         value: data.summary.totalResolved.toLocaleString(),  icon: CheckCircle2,  color: "indigo" },
    { label: "Resolution Rate",        value: `${data.summary.resolutionRate}%`,            icon: Percent,       color: "amber" },
    { label: "Avg Resolution Time",    value: `${data.summary.avgResolutionHours}h`,        icon: Clock,         color: "blue" },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    blue:   { bg: "bg-blue-50",   text: "text-blue-600" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
    amber:  { bg: "bg-amber-50",  text: "text-amber-600" },
  };

  return (
    <div className="space-y-5">
      {/* Header + range toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Doubts Intelligence</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track doubt patterns, resolution rates, and peak times</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                range === r ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
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
              <p className={`text-2xl font-bold ${c.text}`}>{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Raised vs Resolved over time */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Raised vs Resolved — {range}</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.timeline} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="period" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="raised"   name="Raised"   stroke="#2563eb" strokeWidth={1.5} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#6366f1" strokeWidth={1.5} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject-wise (Donut) */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Subject-wise Doubt Split</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={data.bySubject}
                  dataKey="count"
                  nameKey="subject"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={2}
                >
                  {(data.bySubject as { subject: string; count: number }[]).map((_: { subject: string; count: number }, i: number) => (
                    <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {(data.bySubject as { subject: string; count: number }[]).map((s: { subject: string; count: number }, i: number) => (
                <div key={s.subject} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }} />
                  <span className="text-[11px] text-gray-700 flex-1">{s.subject}</span>
                  <span className="text-[11px] font-semibold text-gray-900">{s.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Batch-wise */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Batch-wise Doubt Solving Rate</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.byBatch} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="batch" tick={{ fontSize: 10 }} width={40} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="raised"   name="Raised"   fill="#2563eb" radius={[0, 3, 3, 0]} maxBarSize={10} />
              <Bar dataKey="resolved" name="Resolved" fill="#6366f1" radius={[0, 3, 3, 0]} maxBarSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Faculty-wise */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Faculty-wise Resolution</h2>
          <div className="space-y-2.5 overflow-y-auto max-h-[180px] pr-1">
            {(data.byFaculty as { facultyId: string; name: string; rate: number }[]).map((f: { facultyId: string; name: string; rate: number }, i: number) => (
              <div key={f.facultyId} className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">#{i + 1}</span>
                <span className="text-xs font-medium text-gray-700 truncate flex-1">{f.name}</span>
                <ResolutionDots rate={f.rate} />
                <span className="text-[10px] font-bold text-blue-600 shrink-0 w-8 text-right">{f.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly heatmap */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-800">Doubt Heatmap — When Students Ask</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Faculty should be available at peak hours (typically 8–11 PM)</p>
        </div>
        <HourlyHeatmap data={data.hourlyPattern} label="Doubts" />
      </div>
    </div>
  );
}
