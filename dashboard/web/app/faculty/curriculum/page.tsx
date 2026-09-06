"use client";
import { FeatureGate } from "@/lib/faculty/use-features";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Minus, BookOpen } from "lucide-react";

interface SubjectGap {
  courseName: string;
  semester: number;
  alignment: number;
  status: "Aligned" | "Moderate" | "Critical";
  topicCount: number;
}

interface CurriculumData {
  subjects: SubjectGap[];
  hasData: boolean;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Aligned")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3 h-3" /> Aligned
      </span>
    );
  if (status === "Moderate")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <Minus className="w-3 h-3" /> Moderate
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
      <AlertTriangle className="w-3 h-3" /> Critical
    </span>
  );
}

function AlignmentBar({ pct }: { pct: number }) {
  const color =
    pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-700 w-9 shrink-0 text-right">
        {pct}%
      </span>
    </div>
  );
}

function CurriculumPageInner() {
  const [data, setData] = useState<CurriculumData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faculty/curriculum", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => setData(json.data ?? json))
      .catch(() => setData({ subjects: [], hasData: false }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Curriculum Gap Matrix</h1>
          <p className="text-sm text-gray-500 mt-1">
            Alignment between taught syllabus and industry interview demands.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-md">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300" />
            <span className="text-gray-500">≥ 75% Aligned</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-md">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300" />
            <span className="text-gray-500">40–74% Moderate</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-md">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-300" />
            <span className="text-gray-500">&lt; 40% Critical</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-0 divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-8 h-5 bg-gray-100 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                  <div className="h-2 w-full bg-gray-100 rounded-full" />
                </div>
                <div className="h-5 w-16 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : !data?.hasData ? (
          <div className="py-20 text-center px-6">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              No syllabus data imported yet
            </h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto mb-6">
              Import your course curriculum into the{" "}
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                curriculum_topics
              </code>{" "}
              collection to see gap analysis here.
            </p>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
              Coming Soon
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/40 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">
                {data.subjects.length} courses analysed
              </span>
              <span className="text-xs text-gray-400">
                Sorted by semester
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {data.subjects.map((sub) => (
                <div
                  key={sub.courseName}
                  className="px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-8 shrink-0 text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        S{sub.semester}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {sub.courseName}
                        </p>
                        <StatusBadge status={sub.status} />
                      </div>
                      <AlignmentBar pct={sub.alignment} />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-400">
                        {sub.topicCount} topic{sub.topicCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {data?.hasData && (
        <p className="text-xs text-gray-400 text-center">
          Alignment = percentage of taught topics present in interview question database, weighted by syllabus depth.
        </p>
      )}
    </div>
  );
}


// Admin feature-toggle gate (Feature Controls → faculty.curriculum)
export default function CurriculumPageGate() {
  return (
    <FeatureGate feature="faculty.curriculum" title="Curriculum Gap">
      <CurriculumPageInner />
    </FeatureGate>
  );
}
