"use client";

import { useEngagementData } from "@/lib/hooks";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import HourlyHeatmap from "@/components/charts/HourlyHeatmap";
import { Users, GraduationCap, Wifi, TrendingUp } from "lucide-react";

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-64 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-52 bg-gray-200 rounded-xl" />
        <div className="h-52 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function EngagementPage() {
  const { data, isLoading } = useEngagementData("30d");

  if (isLoading) return <Skeleton />;
  if (!data) return null;

  const kpis = [
    { label: "Students Online Now", value: data?.currentOnline?.students ?? 0, icon: GraduationCap, color: "blue",   sub: "live" },
    { label: "Faculty Online Now",  value: data?.currentOnline?.faculty ?? 0,  icon: Users,         color: "indigo", sub: "live" },
    { label: "DAU — Students",      value: data.dailyActive.at(-1)?.students ?? 0, icon: TrendingUp, color: "blue",  sub: "today" },
    { label: "DAU — Faculty",       value: data.dailyActive.at(-1)?.faculty ?? 0,  icon: Wifi,      color: "amber", sub: "today" },
  ];

  const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
    blue:   { bg: "bg-blue-50",   text: "text-blue-600",   dot: "bg-blue-500" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", dot: "bg-indigo-500" },
    amber:  { bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-500" },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Engagement Analytics</h1>
        <p className="text-xs text-gray-500 mt-0.5">Platform-wide user activity — auto-refreshes every 30 seconds</p>
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
              <p className={`text-2xl font-bold ${c.text}`}>{k.value.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
                <span className="text-[10px] text-gray-400">{k.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Active Users */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Daily Active Users — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.dailyActive} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
                labelFormatter={(v) => `Date: ${v}`}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="students" name="Students" stroke="#2563eb" strokeWidth={1.5} fill="url(#gradS)" dot={false} />
              <Area type="monotone" dataKey="faculty" name="Faculty" stroke="#6366f1" strokeWidth={1.5} fill="url(#gradF)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Active Users */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Monthly Active Users — By Month</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.monthlyActive} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="students" name="Students" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="faculty" name="Faculty" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Heatmap */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Activity Heatmap — Time of Day</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">When are students most active on the platform each week?</p>
          </div>
        </div>
        <HourlyHeatmap data={data.hourlyHeatmap} label="Users" />
      </div>
    </div>
  );
}
