"use client";

import { useBookingsData } from "@/lib/hooks";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { BookCopy, CalendarCheck, CalendarDays, Users } from "lucide-react";

// Dot sparkline — shows relative demand as filled/unfilled dots
function DemandDots({ pct }: { pct: number }) {
  const total = 8;
  const filled = Math.round((pct / 100) * total);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < filled ? "bg-blue-500" : "bg-gray-100"}`} />
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-56 bg-gray-200 rounded" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-52 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const { data, isLoading } = useBookingsData("30d");

  if (isLoading) return <Skeleton />;
  if (!data) return null;

  const kpis = [
    { label: "Booked Today", value: data.summary.today,    icon: CalendarDays,  color: "blue" },
    { label: "This Week",    value: data.summary.thisWeek,  icon: CalendarCheck, color: "indigo" },
    { label: "This Month",  value: data.summary.thisMonth, icon: BookCopy,      color: "cyan" },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    blue:   { bg: "bg-blue-50",   text: "text-blue-600" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
    cyan:   { bg: "bg-cyan-50",   text: "text-cyan-600" },
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Slot Bookings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Track session bookings by batch, trend over time, and top faculty demand</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Batch-wise booking breakdown */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Batch-wise Bookings</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.byBatch} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="batch" tick={{ fontSize: 10 }} tickFormatter={(v) => `B${v}`} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="upcoming"  name="Upcoming"  fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Bar dataKey="cancelled" name="Cancelled" fill="#0891b2" radius={[3, 3, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking trend area chart */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Daily Booking Trend — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.dailyTrend} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBooking" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 9 }} allowDecimals={false} domain={[0, 'auto']} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Area type="monotone" dataKey="count" name="Bookings" stroke="#6366f1" strokeWidth={1.5} fill="url(#gradBooking)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top faculty by demand */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-800">Top Faculty by Booking Demand</h2>
        </div>
        <div className="space-y-3">
          {(data.topFaculty as { facultyId: string; name: string; bookings: number }[]).map((f, i) => {
            const maxBookings = data.topFaculty[0]?.bookings ?? 1;
            const pct = (f.bookings / maxBookings) * 100;
            const rankColors = ["text-blue-600 bg-blue-50", "text-indigo-600 bg-indigo-50", "text-cyan-600 bg-cyan-50"];
            const rankCls = rankColors[i] ?? "text-gray-500 bg-gray-50";
            return (
              <div key={f.facultyId} className="flex items-center gap-3">
                <span className={`text-[10px] font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${rankCls}`}>#{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0">
                  {f.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <span className="text-xs font-semibold text-gray-800 flex-1 min-w-0 truncate">{f.name}</span>
                <DemandDots pct={pct} />
                <span className="text-xs font-bold text-blue-600 shrink-0 w-20 text-right">{f.bookings} bookings</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
