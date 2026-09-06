"use client";

import type { HeatmapEntry } from "@/lib/admin/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? "12a" : i < 12 ? `${i}a` : i === 12 ? "12p" : `${i - 12}p`
);

function getIntensityClass(count: number, max: number): string {
  if (max === 0 || count === 0) return "bg-slate-50";
  const ratio = count / max;
  if (ratio < 0.1)  return "bg-blue-50";
  if (ratio < 0.25) return "bg-indigo-100";
  if (ratio < 0.4)  return "bg-indigo-200";
  if (ratio < 0.55) return "bg-indigo-400";
  if (ratio < 0.7)  return "bg-indigo-500";
  if (ratio < 0.85) return "bg-indigo-600";
  return "bg-indigo-700";
}

interface HourlyHeatmapProps {
  data: HeatmapEntry[];
  label?: string;
}

export default function HourlyHeatmap({ data, label = "Activity" }: HourlyHeatmapProps) {
  const max = Math.max(...data.map((d) => d.count), 1);

  // Build lookup: day × hour → count
  const lookup: Record<string, number> = {};
  data.forEach(({ day, hour, count }) => {
    lookup[`${day}-${hour}`] = count;
  });

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Hour labels */}
        <div className="flex items-center mb-1 ml-10">
          {HOURS.map((h, i) => (
            <div key={i} className="flex-1 text-center text-[9px] text-gray-400 font-medium">
              {i % 3 === 0 ? h : ""}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <span className="w-9 text-right text-[10px] text-gray-400 font-medium pr-1 shrink-0">
              {day}
            </span>
            {HOURS.map((_, hourIdx) => {
              const count = lookup[`${dayIdx}-${hourIdx}`] ?? 0;
              return (
                <div
                  key={hourIdx}
                  className={`flex-1 h-4 rounded-sm ${getIntensityClass(count, max)} transition-opacity hover:opacity-80 cursor-default`}
                  title={`${day} ${HOURS[hourIdx]}: ${count} ${label.toLowerCase()}`}
                />
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-gray-400">Less</span>
          {["bg-slate-50", "bg-blue-50", "bg-indigo-100", "bg-indigo-200", "bg-indigo-400", "bg-indigo-600", "bg-indigo-700"].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-sm ${c} border border-slate-100`} />
          ))}
          <span className="text-[10px] text-gray-400">More</span>
        </div>
      </div>
    </div>
  );
}
