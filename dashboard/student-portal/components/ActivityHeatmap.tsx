"use client";

import { useMemo, useState, useRef } from "react";

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityDay[];
  /** Total days to render, aligned so the grid ends today. Default 364. */
  days?: number;
  /** Compact mode for dashboard sidebars */
  compact?: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * GitHub-style activity heatmap.
 * - Exact per-day counts in a floating hover tooltip ("5 questions solved · Wed, Aug 12")
 * - Today outlined, month + weekday labels, Less→More legend
 * - Pure CSS/Tailwind — no chart library, no external requests.
 */
export default function ActivityHeatmap({ data, days = 364, compact = false }: ActivityHeatmapProps) {
  const [hover, setHover] = useState<{ x: number; y: number; count: number; date: Date } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cellSize = compact ? 11 : 13;
  const gap = compact ? 3 : 3;

  const { columns, monthTicks } = useMemo(() => {
    // Build lookup from API data
    const byDate = new Map(data.map((d) => [d.date, d.count]));

    const today = new Date();
    today.setHours(12, 0, 0, 0); // noon avoids DST edge cases
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    start.setDate(start.getDate() - start.getDay()); // align to Sunday

    const totalCells = Math.ceil((today.getTime() - start.getTime()) / 86_400_000) + 1;

    type Cell = { date: Date; key: string; count: number };
    const cols: Cell[][] = [];
    let week: Cell[] = Array.from({ length: start.getDay() }, () => null as unknown as Cell);

    for (let i = 0; i < totalCells; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const localKey = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];
      week.push({ date: d, key: localKey, count: byDate.get(localKey) ?? 0 });
      if (week.length === 7) {
        cols.push(week);
        week = [];
      }
    }
    if (week.length) cols.push(week);

    // Month ticks: first week index where the month changes
    const ticks: { label: string; col: number }[] = [];
    let lastMonth = -1;
    cols.forEach((w, ci) => {
      const m = w[0]?.date.getMonth();
      if (m != null && m !== lastMonth) {
        ticks.push({ label: MONTHS[m], col: ci });
        lastMonth = m;
      }
    });

    return { columns: cols, monthTicks: ticks };
  }, [data, days]);

  const levelOf = (count: number): 0 | 1 | 2 | 3 | 4 =>
    count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 7 ? 3 : 4;

  // GitHub's green ramp
  const colors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];

  const handleMove = (e: React.MouseEvent, count: number, date: Date) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, count, date });
  };

  const isToday = (d: Date) => {
    const t = new Date();
    return (
      d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
    );
  };

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });

  const activeDays = columns.flat().filter((c) => c?.count > 0).length;
  const totalSolved = data.reduce((s, d) => s + d.count, 0);

  return (
    <div ref={containerRef} className="relative">
      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: compact ? undefined : columns.length * (cellSize + gap) + 40 }}>
          {/* Month labels */}
          {!compact && (
            <div className="relative h-4 mb-1 ml-8">
              {monthTicks.map((t) => (
                <span
                  key={`${t.label}-${t.col}`}
                  className="absolute text-[10px] text-gray-400 select-none"
                  style={{ left: `${t.col * (cellSize + gap)}px` }}
                >
                  {t.label}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-[3px] items-start">
            {/* Weekday labels */}
            <div className={`flex flex-col ${compact ? "hidden" : ""}`} style={{ gap }}>
              {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <div
                  key={i}
                  className="text-[9px] text-gray-400 flex items-center justify-end pr-1 select-none"
                  style={{ height: cellSize, width: 26 }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex" style={{ gap }}>
              {columns.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap }}>
                  {Array.from({ length: 7 }).map((_, di) => {
                    const cell = week[di];
                    if (!cell) return <div key={di} style={{ width: cellSize, height: cellSize }} />;
                    const lv = levelOf(cell.count);
                    const todayCell = isToday(cell.date);
                    return (
                      <div
                        key={di}
                        onMouseEnter={(e) => handleMove(e, cell.count, cell.date)}
                        onMouseMove={(e) => handleMove(e, cell.count, cell.date)}
                        onMouseLeave={() => setHover(null)}
                        className="rounded-[3px] cursor-pointer transition-transform hover:scale-125"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: colors[lv],
                          boxShadow: todayCell ? "0 0 0 2px #1d4ed8" : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating tooltip — follows cursor, exact GitHub-style copy */}
      {hover && (
        <div
          className="pointer-events-none absolute z-50 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-medium shadow-xl whitespace-nowrap"
          style={{
            left: Math.max(0, hover.x - 60),
            top: hover.y - 42,
          }}
        >
          {hover.count > 0 ? (
            <>
              <strong>{hover.count}</strong> question{hover.count !== 1 ? "s" : ""} solved
            </>
          ) : (
            "No questions solved"
          )}
          <span className="text-gray-400"> · {fmt(hover.date)}</span>
        </div>
      )}

      {/* Footer */}
      <div className={`flex items-center flex-wrap text-[11px] text-gray-400 ${compact ? "gap-1 mt-2" : "gap-1.5 mt-3"}`}>
        {!compact && (
          <span className="mr-auto">
            <strong className="text-gray-600">{totalSolved.toLocaleString()}</strong> solved ·{" "}
            <strong className="text-gray-600">{activeDays}</strong> active days
          </span>
        )}
        <span>Less</span>
        {colors.map((c) => (
          <div key={c} className="rounded-[3px]" style={{ width: compact ? 10 : 12, height: compact ? 10 : 12, backgroundColor: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
