"use client";
import { FeatureGate } from "@/lib/use-features";

import { useState, useEffect } from "react";
import {
  TrendingUp, Calendar, Users, CheckCircle2,
  Clock, AlertCircle, Activity,
} from "lucide-react";

interface TrendItem {
  id: string;
  trend: string;
  severity: "High" | "Medium" | "Low";
  source: string;
  detectedAt: string;
}

interface TrendsData {
  sessionStats: {
    total: number;
    confirmed: number;
    pending: number;
    completed: number;
    acceptRate: number;
  };
  studentReach: number;
  weeklyActivity: number;
  profileStats: {
    totalAccepted: number;
    totalDeclined: number;
    subject: string;
  };
  industryTrends: TrendItem[];
}

const SEVERITY_STYLES: Record<string, { dot: string; badge: string }> = {
  High:   { dot: "border-red-500",    badge: "bg-red-50 text-red-700 border-red-200" },
  Medium: { dot: "border-amber-400",  badge: "bg-amber-50 text-amber-700 border-amber-200" },
  Low:    { dot: "border-blue-400",   badge: "bg-blue-50 text-blue-700 border-blue-200" },
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2)    return "just now";
  if (mins < 60)   return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function TrendsPageInner() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faculty/trends", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => setData(json.data ?? json))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.sessionStats;

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Industry Trends</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your session activity and live topic demand signals from the question database.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: Calendar,
            label: "Total Sessions",
            value: loading ? "—" : stats?.total ?? 0,
            color: "blue",
          },
          {
            icon: CheckCircle2,
            label: "Confirmed",
            value: loading ? "—" : stats?.confirmed ?? 0,
            color: "emerald",
          },
          {
            icon: Clock,
            label: "Pending",
            value: loading ? "—" : stats?.pending ?? 0,
            color: "amber",
          },
          {
            icon: Users,
            label: "Students Reached",
            value: loading ? "—" : data?.studentReach ?? 0,
            color: "indigo",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center gap-3"
          >
            <div
              className={`w-9 h-9 rounded-lg bg-${k.color}-50 text-${k.color}-600 flex items-center justify-center shrink-0`}
            >
              <k.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                {k.label}
              </p>
              <p className="text-xl font-black text-gray-900 leading-tight">
                {loading ? (
                  <span className="inline-block h-5 w-8 bg-gray-100 rounded animate-pulse" />
                ) : (
                  k.value
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Accept rate card */}
      {!loading && stats && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Session Accept Rate
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.acceptRate}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700 w-9 shrink-0">
                {stats.acceptRate}%
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400">This week</p>
            <p className="text-sm font-bold text-gray-700">{data?.weeklyActivity ?? 0} sessions</p>
          </div>
        </div>
      )}

      {/* Industry trends feed */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-gray-900 text-sm">Live Topic Demand</h2>
          <span className="ml-auto text-xs text-gray-400">from question database</span>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse space-y-2">
                <div className="h-4 w-64 bg-gray-200 rounded" />
                <div className="h-3 w-40 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : !data?.industryTrends?.length ? (
          <div className="px-5 py-12 text-center">
            <AlertCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No trend signals yet.</p>
            <p className="text-xs text-gray-300 mt-1">
              Populate the question database to generate signals.
            </p>
          </div>
        ) : (
          <div className="ml-4 border-l-2 border-gray-100 pl-5 py-3 divide-y divide-transparent space-y-0">
            {data.industryTrends.map((item) => {
              const style = SEVERITY_STYLES[item.severity] ?? SEVERITY_STYLES.Low;
              return (
                <div key={item.id} className="relative py-4 pr-4">
                  <div
                    className={`absolute -left-[27px] top-5 w-3.5 h-3.5 rounded-full bg-white border-[3px] ${style.dot}`}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border mr-2 ${style.badge}`}
                      >
                        {item.severity}
                      </span>
                      <span className="text-xs text-gray-400">{item.source}</span>
                      <p className="text-sm font-semibold text-gray-900 mt-1 leading-snug">
                        {item.trend}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-400 shrink-0 mt-0.5">
                      {timeAgo(item.detectedAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


// Admin feature-toggle gate (Feature Controls → faculty.trends)
export default function TrendsPageGate() {
  return (
    <FeatureGate feature="faculty.trends" title="Industry Trends">
      <TrendsPageInner />
    </FeatureGate>
  );
}
