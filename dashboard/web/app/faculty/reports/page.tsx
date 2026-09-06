"use client";
import { FeatureGate } from "@/lib/faculty/use-features";

import { FileText, Download, Play, CheckCircle2, History, Loader2 } from "lucide-react";

import { useState, useEffect } from "react";

function ReportsPageInner() {
  const [sections, setSections] = useState({
    gapMatrix: true,
    industryTrends: true,
    companyRankings: true,
    subjectBreakdown: false
  });

  const [reportHistory, setReportHistory] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const handleGenerate = () => {
    if (isGenerating) return;
    setIsGenerating(true);

    setTimeout(() => {
      const selectedNames = Object.entries(sections)
        .filter(([_, val]) => val)
        .map(([key]) => {
          if (key === "gapMatrix") return "Gap Matrix";
          if (key === "industryTrends") return "Industry Trends";
          if (key === "companyRankings") return "Company Rankings";
          return "Subject Breakdown";
        });

      const newReportName = selectedNames.length > 0
        ? `Report: ${selectedNames.join(" & ")}`
        : "Standard Curriculum Report";

      const newReport = {
        id: `rep-${Date.now()}`,
        name: newReportName,
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        }),
        sections: { ...sections }
      };

      setReportHistory(prev => [newReport, ...prev]);
      setIsGenerating(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1500);
  };

  const handleDownload = async (reportName: string, selectedSections: any) => {
    try {
      const res = await fetch('/api/faculty/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: selectedSections })
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${reportName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_export.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to download report.');
    }
  };

  const SECTION_CONFIG = [
    {
      key: "gapMatrix" as const,
      label: "Curriculum Gap Matrix",
      desc: "Include the full breakdown of subjects vs industry demand.",
      color: "peer-checked:bg-blue-600 peer-checked:border-blue-600",
    },
    {
      key: "industryTrends" as const,
      label: "Industry Trends",
      desc: "Include topic frequency charts and recent trend alerts.",
      color: "peer-checked:bg-blue-600 peer-checked:border-blue-600",
    },
    {
      key: "companyRankings" as const,
      label: "Company Rankings",
      desc: "Include top hiring companies sorted by curriculum alignment.",
      color: "peer-checked:bg-blue-600 peer-checked:border-blue-600",
    },
    {
      key: "subjectBreakdown" as const,
      label: "Full Subject Breakdown",
      desc: "Include detailed syllabus analysis for all subjects.",
      color: "peer-checked:bg-blue-600 peer-checked:border-blue-600",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 relative">
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-lg shadow-green-500/20 z-50 flex items-center gap-2 animate-in slide-in-from-top-5 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Report generated successfully! Added to history list.</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/25">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Export Reports</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">Generate and download curriculum intelligence reports for academic review.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-gray-100 animate-pulse rounded-xl" />
          <div className="lg:col-span-1 h-96 bg-gray-100 animate-pulse rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Generate Report */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full relative">
              {isGenerating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-bold text-gray-900">Compiling report analytics...</p>
                </div>
              )}

              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Generate New Report
                </h2>
                <p className="text-sm text-gray-500 mt-1">Select the sections you want to include in the PDF export.</p>
              </div>

              <div className="p-6">
                <div className="space-y-3 mb-8">
                  {SECTION_CONFIG.map(({ key, label, desc }) => (
                    <label
                      key={key}
                      className={`flex items-start gap-4 cursor-pointer group rounded-xl border p-4 transition-all ${
                        sections[key]
                          ? "border-blue-200 bg-blue-50/50"
                          : "border-gray-100 hover:border-blue-100 hover:bg-gray-50"
                      }`}
                    >
                      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-300 cursor-pointer peer appearance-none border checked:bg-blue-600 checked:border-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          checked={sections[key]}
                          onChange={() => setSections({ ...sections, [key]: !sections[key] })}
                        />
                        <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <div>
                        <p className={`font-semibold transition-colors ${sections[key] ? "text-blue-700" : "text-gray-900 group-hover:text-blue-700"}`}>
                          {label}
                        </p>
                        <p className="text-sm text-gray-500 leading-snug mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md shadow-blue-500/20 w-full justify-center md:w-auto disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-4 h-4" /> Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col">
              <div className="p-5 border-b border-gray-200 bg-gray-50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                  <History className="w-5 h-5 text-blue-600" />
                  Previously Generated
                </h2>
              </div>

              <div className="p-5 flex-grow overflow-y-auto max-h-[400px]">
                <div className="space-y-3">
                  {reportHistory.map(report => (
                    <div
                      key={report.id}
                      className="border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm transition-all rounded-xl p-4 group animate-in slide-in-from-top-3 duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors mt-0.5" />
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{report.date}</span>
                      </div>
                      <p className="font-bold text-gray-900 mb-3 text-sm leading-snug">{report.name}</p>
                      <button
                        onClick={() => handleDownload(report.name, report.sections)}
                        className="w-full text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 font-semibold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download CSV
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// Admin feature-toggle gate (Feature Controls → faculty.reports)
export default function ReportsPageGate() {
  return (
    <FeatureGate feature="faculty.reports" title="Export Reports">
      <ReportsPageInner />
    </FeatureGate>
  );
}
