"use client";

import { useState } from "react";
import { Download, FileText, TrendingUp, Users, GraduationCap, Clock } from "lucide-react";
import { toast } from "sonner";

const reports = [
  {
    title: "Student Performance",
    desc: "Detailed breakdown of student roadmap progress, mock interview scores, and placement stats.",
    icon: GraduationCap,
    color: "blue",
    apiType: "student-performance",
  },
  {
    title: "Faculty Engagement",
    desc: "Analytics on faculty session acceptance rates, average ratings, and response times.",
    icon: Users,
    color: "indigo",
    apiType: "faculty-engagement",
  },
  {
    title: "System Utilization",
    desc: "Platform usage metrics including peak hours, active users, and feature adoption.",
    icon: TrendingUp,
    color: "cyan",
    apiType: "system-utilization",
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
  cyan:   { bg: "bg-cyan-50",   text: "text-cyan-600" },
};

type ExportEntry = {
  title: string;
  exportedAt: string;
  apiType: string;
};

export default function ReportsPage() {
  const [exportLog, setExportLog] = useState<ExportEntry[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (report: typeof reports[number]) => {
    setExporting(report.apiType);
    try {
      // Verify the endpoint responds OK before opening (avoids silent browser download errors)
      const check = await fetch(
        `/api/admin/reports?type=${encodeURIComponent(report.apiType)}&format=csv`,
        { method: 'HEAD' }
      ).catch(() => null);

      if (check && !check.ok) {
        const errText = check.status === 429
          ? 'Too many exports. Please wait a moment.'
          : `Export failed (${check.status}). Try again.`;
        toast.error(errText);
        return;
      }

      // Trigger download
      window.open(`/api/admin/reports?type=${encodeURIComponent(report.apiType)}&format=csv`);
      toast.success(`${report.title} export started — check your Downloads folder.`);

      // Log the export in session state
      setExportLog(prev => [
        {
          title: report.title,
          exportedAt: new Date().toISOString(),
          apiType: report.apiType,
        },
        ...prev,
      ]);
    } catch {
      toast.error('Export failed. Please check your connection and try again.');
    } finally {
      setExporting(null);
    }
  };

  const formatExportTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports &amp; Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and export detailed platform analytics.</p>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const c = COLOR_MAP[report.color] ?? { bg: "bg-gray-50", text: "text-gray-600" };
          const isExporting = exporting === report.apiType;
          return (
            <div key={report.title} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center mb-4`}>
                <report.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1.5">{report.title}</h3>
              <p className="text-sm text-gray-500 flex-1 mb-6">{report.desc}</p>
              <button
                onClick={() => handleExport(report)}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-lg text-sm font-semibold transition-colors border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExporting ? "Exporting…" : "Export CSV"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Recent exports — session-state tracked */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900">Recent Exports</h3>
          {exportLog.length > 0 && (
            <span className="ml-auto text-xs text-gray-400 font-medium">
              {exportLog.length} export{exportLog.length > 1 ? "s" : ""} this session
            </span>
          )}
        </div>
        {exportLog.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No exports yet this session.</p>
            <p className="text-xs text-gray-300 mt-1">Click "Export CSV" above to generate a report.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {exportLog.map((entry, idx) => {
              const report = reports.find(r => r.apiType === entry.apiType);
              const c = report ? COLOR_MAP[report.color] : { bg: "bg-gray-50", text: "text-gray-500" };
              return (
                <div key={idx} className="flex items-center gap-4 py-3">
                  <div className={`w-9 h-9 rounded-lg ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
                    {report ? <report.icon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{entry.title}</p>
                    <p className="text-xs text-gray-400">CSV export</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatExportTime(entry.exportedAt)}
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
