"use client";

import Link from "next/link";

/**
 * Codolio-style stat tile — big number, small label, icon chip, optional
 * sub-metric and destination link. Used across Dashboard/Profile headers.
 */
export function StatTile({
  icon: Icon,
  value,
  label,
  sub,
  iconClasses = "bg-blue-50 text-blue-600",
  href,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  sub?: string;
  iconClasses?: string;
  href?: string;
}) {
  const body = (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-gray-200 hover:shadow-md h-full">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClasses}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-black leading-none tracking-tight text-gray-900">{value}</div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
        {sub && <div className="mt-0.5 truncate text-[11px] text-gray-500">{sub}</div>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

/** SVG progress ring (Codolio goal-ring style). */
export function ProgressRing({
  pct,
  size = 96,
  stroke = 10,
  color = "#2563eb",
  trackColor = "#F3F4F6",
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        {clamped > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(clamped / 100) * c} ${c}`}
            style={{ transition: "stroke-dasharray 600ms ease" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

const DIFF_COLORS = { Easy: "#22c55e", Medium: "#f59e0b", Hard: "#ef4444" } as const;

/** Codolio-style difficulty donut with center total + side legend. */
export function DifficultyDonut({
  easy,
  medium,
  hard,
  size = 120,
}: {
  easy: number;
  medium: number;
  hard: number;
  size?: number;
}) {
  const data = [
    { name: "Easy" as const, count: easy },
    { name: "Medium" as const, count: medium },
    { name: "Hard" as const, count: hard },
  ];
  const total = Math.max(1, easy + medium + hard);
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
          {data.map(({ name, count }) => {
            if (!count) return null;
            const dash = (count / total) * circ;
            const seg = (
              <circle
                key={name}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={DIFF_COLORS[name]}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-gray-900">{easy + medium + hard}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Solved</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        {data.map(({ name, count }) => (
          <div key={name}>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-gray-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DIFF_COLORS[name] }} />
                {name}
              </span>
              <span className="font-bold tabular-nums text-gray-800">{count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${Math.round((count / total) * 100)}%`, backgroundColor: DIFF_COLORS[name] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TopicRow {
  topic: string;
  completed: number;
  total: number;
  percentage: number;
}

/** Codolio-style topic strength — sorted mastery bars with solved/total. */
export function TopicStrength({ topics, maxRows = 8 }: { topics: TopicRow[]; maxRows?: number }) {
  if (!topics?.length) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        Solve questions to reveal your topic strengths.
      </p>
    );
  }
  const sorted = [...topics].sort((a, b) => b.percentage - a.percentage || b.completed - a.completed);
  const palette = ["bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-cyan-500", "bg-sky-500", "bg-teal-500"];
  return (
    <div className="space-y-3">
      {sorted.slice(0, maxRows).map((t, i) => (
        <div key={t.topic}>
          <div className="mb-1 flex items-center justify-between">
            <span className="truncate text-sm font-medium text-gray-700">{t.topic}</span>
            <span className="ml-3 shrink-0 text-xs tabular-nums text-gray-400">
              {t.completed}/{t.total}
            </span>
            <span
              className={`ml-2 w-10 shrink-0 text-right text-xs font-bold ${
                t.percentage >= 75 ? "text-emerald-600" : t.percentage >= 40 ? "text-blue-600" : "text-amber-600"
              }`}
            >
              {t.percentage}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className={`h-2 rounded-full ${palette[i % palette.length]} transition-all`}
              style={{ width: `${Math.min(100, t.percentage)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
