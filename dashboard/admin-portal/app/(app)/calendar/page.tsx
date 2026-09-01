"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Users, BookOpen } from "lucide-react";
import { useBookingsData } from "@/lib/hooks";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { day: number; curr: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, curr: false });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, curr: true });
  while (cells.length % 7 !== 0)
    cells.push({ day: cells.length - daysInMonth - firstDay + 1, curr: false });
  return cells;
}

// Dynamic generation of session days happens inside the component based on dailyTrend.

const STATUS_BADGE: Record<string, string> = {
  upcoming:  "bg-indigo-50 text-indigo-700 border border-indigo-200",
  completed: "bg-blue-600 text-white",
  cancelled: "bg-slate-100 text-slate-500",
  mixed:     "bg-cyan-50 text-cyan-700 border border-cyan-200",
};

const DOT_COLOR: Record<string, string> = {
  upcoming:  "bg-indigo-400",
  completed: "bg-blue-500",
  mixed:     "bg-cyan-400",
};

export default function CalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const cells = buildCalendarGrid(viewYear, viewMonth);
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  const { data: bookingsData, isLoading } = useBookingsData();

  // ── Skeleton ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="h-7 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-72 bg-gray-100 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-28 bg-indigo-100 rounded-full" />
            <div className="h-8 w-28 bg-blue-100 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar skeleton */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
              <div className="h-5 w-36 bg-gray-200 rounded" />
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            </div>
            <div className="grid grid-cols-7 border-b border-gray-100">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="py-2 flex justify-center">
                  <div className="h-3 w-6 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="min-h-[64px] p-2 border-b border-r border-gray-50">
                  <div className="h-4 w-5 bg-gray-100 rounded ml-auto mb-1" />
                </div>
              ))}
            </div>
          </div>
          {/* Side panel skeleton */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-16 bg-gray-100 rounded-lg" />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                    <div className="h-4 w-10 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sessionDays: Record<number, { count: number; type: "upcoming" | "completed" | "mixed" }> = {};
  bookingsData?.dailyTrend?.forEach((d: any) => {
    const date = new Date(d.date);
    if (date.getFullYear() === viewYear && date.getMonth() === viewMonth && d.count > 0) {
      sessionDays[date.getDate()] = {
        count: d.count,
        type: d.count > 2 ? "mixed" : d.count > 1 ? "completed" : "upcoming"
      };
    }
  });

  // Derive totals from byBatch aggregated data (sessions list is not returned by bookings API)
  const byBatch: { batch: string; upcoming: number; completed: number; cancelled: number }[] =
    bookingsData?.byBatch ?? [];
  const upcoming  = byBatch.reduce((sum, b) => sum + (b.upcoming ?? 0), 0);
  const completed = byBatch.reduce((sum, b) => sum + (b.completed ?? 0), 0);
  const selectedSessions = selectedDay ? sessionDays[selectedDay] : null;


  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track all mentorship sessions across the platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-sm font-semibold text-indigo-700">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            {upcoming} upcoming
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-sm font-semibold text-blue-600">
            {completed} completed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button
              onClick={prevMonth}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold text-gray-900 tracking-wide">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <button
              onClick={nextMonth}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_LABELS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              const isToday = isCurrentMonth && cell.curr && cell.day === today.getDate();
              const isSelected = cell.curr && cell.day === selectedDay;
              const hasSession = cell.curr && sessionDays[cell.day];
              const sessionInfo = hasSession ? sessionDays[cell.day] : null;

              return (
                <button
                  key={idx}
                  onClick={() => cell.curr && setSelectedDay(cell.day)}
                  className={`relative min-h-[64px] p-2 border-b border-r border-gray-50 flex flex-col transition-all ${
                    !cell.curr ? "bg-gray-50/50 cursor-default" :
                    isSelected ? "bg-blue-600" :
                    isToday ? "bg-indigo-50" :
                    "hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  <span className={`text-sm font-bold self-end leading-none mb-1 ${
                    !cell.curr ? "text-gray-300" :
                    isSelected ? "text-white" :
                    isToday ? "text-indigo-700" :
                    "text-gray-700"
                  }`}>
                    {cell.day}
                  </span>
                  {sessionInfo && (
                    <div className="flex-1 flex flex-col justify-end gap-0.5">
                      <div className={`w-full rounded text-[10px] font-bold px-1 py-0.5 text-center truncate ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : DOT_COLOR[sessionInfo.type].replace("bg-", "bg-").replace("400", "50") + " " +
                            (sessionInfo.type === "completed" ? "text-blue-700" :
                             sessionInfo.type === "upcoming" ? "text-indigo-700" : "text-cyan-700")
                      }`}>
                        {sessionInfo.count} session{sessionInfo.count > 1 ? "s" : ""}
                      </div>
                      <div className="flex gap-0.5 justify-center">
                        {Array.from({ length: Math.min(sessionInfo.count, 4) }, (_, i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/60" : DOT_COLOR[sessionInfo.type]}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            {[
              { label: "Upcoming", dot: "bg-indigo-400" },
              { label: "Completed", dot: "bg-blue-500" },
              { label: "Mixed", dot: "bg-cyan-400" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${l.dot}`} />
                <span className="text-xs font-semibold text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Selected day panel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            {selectedDay ? (
              <>
                <div className="flex items-center gap-5 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center shadow-sm">
                    <span className="text-xs font-bold leading-none uppercase">
                      {MONTH_NAMES[viewMonth].slice(0, 3)}
                    </span>
                    <span className="text-2xl font-black leading-none">{selectedDay}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {DAY_LABELS[new Date(viewYear, viewMonth, selectedDay).getDay()]},{" "}
                      {MONTH_NAMES[viewMonth]} {selectedDay}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedSessions ? `${selectedSessions.count} session${selectedSessions.count > 1 ? "s" : ""}` : "No sessions"}
                    </p>
                  </div>
                </div>

                {selectedSessions ? (
                  <div className="space-y-3">
                    {/* Count summary */}
                    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                      selectedSessions.type === "completed" ? "bg-blue-50 border-blue-100" :
                      selectedSessions.type === "upcoming"  ? "bg-indigo-50 border-indigo-100" :
                      "bg-cyan-50 border-cyan-100"
                    }`}>
                      <div className={`w-1.5 rounded-full self-stretch ${DOT_COLOR[selectedSessions.type]}`} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">
                          {selectedSessions.count} Session{selectedSessions.count > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Status: <span className="font-semibold capitalize">{selectedSessions.type}</span>
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_BADGE[selectedSessions.type]}`}>
                        {selectedSessions.type}
                      </span>
                    </div>
                    {/* Guidance to Bookings section */}
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                      <BookOpen className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Individual session details are available in the{" "}
                        <a href="/bookings" className="text-blue-600 font-semibold hover:underline">
                          Bookings section
                        </a>
                        , including mentor name, topic, and time slot.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No sessions on this day</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">Select a date to see sessions</p>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">This Month</h3>
            {[
              { icon: Clock,   label: "Total Sessions", value: `${bookingsData?.summary?.thisMonth || 0}`, color: "text-blue-600 bg-blue-50" },
              { icon: Users,   label: "Active Batches", value: `${bookingsData?.byBatch?.length || 0}`, color: "text-indigo-600 bg-indigo-50" },
              { icon: BookOpen,label: "Avg per Day",     value: `${bookingsData?.summary?.thisMonth ? (bookingsData.summary.thisMonth / 30).toFixed(1) : "0"}`, color: "text-cyan-600 bg-cyan-50" },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 font-semibold uppercase">{stat.label}</p>
                  <p className="text-sm font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
