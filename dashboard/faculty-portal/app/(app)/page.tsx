"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  ChevronDown, ChevronUp, RefreshCw, 
  FileText, ArrowUp, 
  AlertTriangle, 
  Clock, CheckCircle2, 
  ArrowRight,
  Server, Cloud, Database, Radar,
  BookOpen, MessageSquare, Activity
} from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json());

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<"current" | "previous">("current");
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Interactive dashboard states
  const [currentSemester, setCurrentSemester] = useState("Fall 2024");
  const [semesterDropdownOpen, setSemesterDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncToast, setShowSyncToast] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<Date>(new Date());
  const [syncTimeDisplay, setSyncTimeDisplay] = useState("just now");

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setSyncTimeDisplay(formatDistanceToNow(lastSyncTimestamp, { addSuffix: true }));
    const interval = setInterval(() => {
      setSyncTimeDisplay(formatDistanceToNow(lastSyncTimestamp, { addSuffix: true }));
    }, 60000);
    return () => clearInterval(interval);
  }, [lastSyncTimestamp]);

  // Real data from APIs
  const { data: curriculumData, error: curriculumError, mutate: mutateCurriculum } = useSWR('/api/faculty/curriculum', fetcher);
  const { data: trendsData, error: trendsError, mutate: mutateTrends } = useSWR('/api/faculty/trends', fetcher);
  const mockCurriculumCoverage = curriculumData?.data?.subjects ?? [];
  const industryTrends = trendsData?.data?.industryTrends ?? [];

  const { mutate: mutateDashboard } = useSWR('/api/faculty/dashboard', fetcher);
  const handleSyncData = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      // Refresh all three data sources so every section updates together
      await Promise.all([mutateDashboard(), mutateCurriculum(), mutateTrends()]);
      setLastSyncTimestamp(new Date());
      setShowSyncToast(true);
      setTimeout(() => setShowSyncToast(false), 3000);
    } catch {
      setSyncError(true);
      setTimeout(() => setSyncError(false), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Real dashboard data (faculty info + stats)
  const { data: dashboardData, error: dashboardError } = useSWR('/api/faculty/dashboard', fetcher);
  const facultyInfo = dashboardData?.data?.faculty ?? dashboardData?.faculty;

  const currentFaculty = {
    name: facultyInfo?.fullName ?? "Faculty",
    subjects: (facultyInfo?.subject ? [facultyInfo.subject] : ["DSA", "System Design", "Web Development", "DBMS & SQL", "Cloud Computing"]),
    doubtsSolvedThisMonth: dashboardData?.data?.stats?.doubtsSolvedThisMonth ?? 0,
    doubtsSolvedAllTime: dashboardData?.data?.stats?.totalDoubts ?? 0,
  };

  const resolutionRate = dashboardData?.data?.stats?.resolutionRate ?? 100;
  const isLive = dashboardData?.data?.stats?.isLive ?? false;
  const heatmapData = dashboardData?.data?.heatmap?.heatmapData ?? [];
  const heatmapActiveDays = dashboardData?.data?.heatmap?.activeDays ?? 0;
  const heatmapMaxStreak = dashboardData?.data?.heatmap?.maxStreak ?? 0;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-700 font-semibold text-[11px] uppercase tracking-wide">Critical</span>;
      case "Moderate":
        return <span className="inline-flex items-center px-2 py-1 rounded bg-amber-100 text-amber-800 font-semibold text-[11px] uppercase tracking-wide">Moderate</span>;
      case "Aligned":
        return <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-100 text-emerald-700 font-semibold text-[11px] uppercase tracking-wide">Aligned</span>;
      default:
        return null;
    }
  };

  const getAlertDot = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-red-500";
      case "medium":
        return "border-amber-500";
      case "info":
        return "border-blue-500";
      default:
        return "border-gray-500";
    }
  };

  const getCoverageData = (subjectName: string) => {
    return mockCurriculumCoverage.find((s: any) => s.subjectName === subjectName);
  };

  // We are asked to specifically render 3 rows in matrix preview:
  const sysDesign = getCoverageData("System Design");
  const cloudComp = getCoverageData("Cloud Computing");
  const dsa = getCoverageData("Data Structures & Algo");

  const getSubjectCoverageByName = (coverageObj: any) => {
    let color = "#10b981"; // emerald
    let bgColor = "bg-emerald-50";
    let borderColor = "border-emerald-200";
    let textColor = "text-emerald-600";
    
    if (coverageObj.status === "Critical") {
      color = "#f43f5e"; // rose
      bgColor = "bg-rose-50";
      borderColor = "border-rose-200";
      textColor = "text-rose-600";
    } else if (coverageObj.status === "Moderate") {
      color = "#2563eb"; // blue-600
      bgColor = "bg-blue-50";
      borderColor = "border-blue-200";
      textColor = "text-blue-600";
    }

    return {
      ...coverageObj,
      color,
      bgColor,
      borderColor,
      textColor,
      id: coverageObj.subjectName.toLowerCase().replace(/\s+/g, ""),
    };
  };

  const subjectColors = [
    {
      color: "#10b981", // Emerald
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-600",
      hoverBg: "hover:bg-emerald-50/40 hover:border-emerald-300",
      activeBg: "bg-emerald-50 border-emerald-400 shadow-sm scale-[1.01]",
    },
    {
      color: "#2563eb", // Blue
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-600",
      hoverBg: "hover:bg-blue-50/40 hover:border-blue-300",
      activeBg: "bg-blue-50 border-blue-400 shadow-sm scale-[1.01]",
    },
    {
      color: "#f43f5e", // Rose
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      textColor: "text-rose-600",
      hoverBg: "hover:bg-rose-50/40 hover:border-rose-300",
      activeBg: "bg-rose-50 border-rose-400 shadow-sm scale-[1.01]",
    },
    {
      color: "#8b5cf6", // Purple
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-600",
      hoverBg: "hover:bg-purple-50/40 hover:border-purple-300",
      activeBg: "bg-purple-50 border-purple-400 shadow-sm scale-[1.01]",
    },
    {
      color: "#f59e0b", // Amber
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-600",
      hoverBg: "hover:bg-amber-50/40 hover:border-amber-300",
      activeBg: "bg-amber-50 border-amber-400 shadow-sm scale-[1.01]",
    },
    {
      color: "#06b6d4", // Cyan
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      textColor: "text-cyan-600",
      hoverBg: "hover:bg-cyan-50/40 hover:border-cyan-300",
      activeBg: "bg-cyan-50 border-cyan-400 shadow-sm scale-[1.01]",
    },
  ];

  const resolvedSubjects = currentFaculty.subjects
    .slice(0, 3)
    .map((subName: string) => mockCurriculumCoverage.find((s: any) => s.subjectName === subName) || {
      subjectName: subName, status: "Aligned", alignment: 50, courseCode: "CS"
    })
    .map(getSubjectCoverageByName)
    .map((sub, idx) => {
      const palette = subjectColors[idx % subjectColors.length];
      return {
        ...sub,
        color: palette.color,
        bgColor: palette.bgColor,
        borderColor: palette.borderColor,
        textColor: palette.textColor,
        hoverBg: palette.hoverBg,
        activeBg: palette.activeBg,
      };
    });

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Curriculum Intelligence Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time alignment between academic programs and industry hiring requirements.</p>
        </div>
        <div className="flex gap-3 relative">
          {/* Semester Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setSemesterDropdownOpen(!semesterDropdownOpen)}
              className="bg-white border border-gray-300 text-gray-700 font-medium text-sm py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {currentSemester} <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${semesterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {semesterDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-100">
                {["Fall 2024", "Spring 2024", "Fall 2023"].map((sem) => (
                  <button
                    key={sem}
                    onClick={() => {
                      setCurrentSemester(sem);
                      setSemesterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors ${currentSemester === sem ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}
                  >
                    {sem}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={handleSyncData}
            disabled={isSyncing}
            className="bg-black text-white font-medium text-sm py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      {showSyncToast && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-top-5 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Dashboard synced successfully!</span>
        </div>
      )}

      {syncError && (
        <div className="fixed top-4 right-4 bg-red-600 text-white font-bold text-xs px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-top-5 duration-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Sync failed. Please check your connection and try again.</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
            <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
            <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
            <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
          </div>
          <div className="h-44 bg-gray-100 animate-pulse rounded-xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-100 animate-pulse rounded-xl"></div>
            <div className="lg:col-span-1 h-96 bg-gray-100 animate-pulse rounded-xl"></div>
          </div>
        </div>
      ) : dashboardError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mb-4" />
          <p className="text-gray-700 font-semibold text-base mb-1">Failed to load dashboard data</p>
          <p className="text-gray-400 text-sm mb-5">There was a problem connecting to the server. Please check your connection.</p>
          <button
            onClick={() => { mutateDashboard(); mutateCurriculum(); mutateTrends(); }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      ) : (
        <>
      {/* Top Row: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Subjects — LeetCode Open-Arc Donut Style */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative col-span-1 lg:col-span-2 hover:border-blue-500 hover:shadow-md transition-all duration-200">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Assigned Subjects
            </h3>
            <span className="text-blue-700 bg-blue-50 text-[10px] px-2.5 py-0.5 rounded-full font-semibold border border-blue-100 uppercase tracking-wider">
              Curriculum Map
            </span>
          </div>

          <div className="flex items-center gap-8">
            {/* 270° Open-Arc Donut Ring */}
            <div className="relative flex items-center justify-center shrink-0 w-40 h-40 p-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 120 120">
                {/*
                  270° arc: circumference = 2π*50 = 314.16
                  270° portion = 314.16 * 3/4 = 235.62
                  Rotation 135° so the gap sits at the bottom.
                  All circles share transform="rotate(135, 60, 60)"
                */}

                {/* ── DEFAULT STATE: dynamic segments ── */}
                {/* Gray track (270°) */}
                <circle
                  cx="60" cy="60" r="50"
                  fill="transparent"
                  stroke="#C4C9D4"
                  strokeWidth="8"
                  strokeDasharray="235.62 314.16"
                  strokeLinecap="round"
                  transform="rotate(135, 60, 60)"
                  style={{
                    opacity: hoveredSubject === null ? 1 : 0,
                    transition: "opacity 0.35s ease",
                  }}
                />

                {(() => {
                  let accumulatedOffset = 0;
                  return resolvedSubjects.map((sub, idx) => {
                    const totalMax = resolvedSubjects.length * 100;
                    const gap = 2.5;
                    const arcLen = (sub.alignment / totalMax) * 235.62;
                    const offset = accumulatedOffset;
                    
                    // Increment offset for the next segment
                    accumulatedOffset += arcLen + gap;
                    
                    return (
                      <circle
                        key={`def-${sub.id}`}
                        cx="60" cy="60" r="50"
                        fill="transparent"
                        stroke={sub.color}
                        strokeWidth="8"
                        strokeDasharray={`${arcLen} 314.16`}
                        strokeDashoffset={`-${offset}`}
                        strokeLinecap="round"
                        transform="rotate(135, 60, 60)"
                        style={{
                          opacity: hoveredSubject === null ? 1 : 0,
                          transition: "opacity 0.35s ease",
                        }}
                      />
                    );
                  });
                })()}

                {/* ── HOVER STATE: dim track + single bright arc ── */}
                {/* Dim track shown when hovering */}
                <circle
                  cx="60" cy="60" r="50"
                  fill="transparent"
                  stroke="#C4C9D4"
                  strokeWidth="8"
                  strokeDasharray="235.62 314.16"
                  strokeLinecap="round"
                  transform="rotate(135, 60, 60)"
                  style={{
                    opacity: hoveredSubject !== null ? 0.7 : 0,
                    transition: "opacity 0.35s ease",
                  }}
                />

                {resolvedSubjects.map((sub) => {
                  const arcLen = (sub.alignment / 100) * 235.62;
                  return (
                    <circle
                      key={`hov-${sub.id}`}
                      cx="60" cy="60" r="50"
                      fill="transparent"
                      stroke={sub.color}
                      strokeWidth="10"
                      strokeDasharray={`${arcLen} 314.16`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      transform="rotate(135, 60, 60)"
                      style={{
                        opacity: hoveredSubject === sub.id ? 1 : 0,
                        filter: hoveredSubject === sub.id ? `drop-shadow(0 0 5px ${sub.color}bb)` : "none",
                        transition: "opacity 0.35s ease",
                      }}
                    />
                  );
                })}
              </svg>

              {/* Center Stats */}
              <div className="absolute flex flex-col items-center justify-center text-center px-2" style={{ transition: "all 0.3s ease" }}>
                {hoveredSubject === null ? (
                  <>
                    <span className="text-3xl font-black text-gray-900 leading-tight">{resolvedSubjects.length}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Subjects</span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1">
                      {Math.round(resolvedSubjects.reduce((acc, s) => acc + s.alignment, 0) / (resolvedSubjects.length || 1))}% Avg
                    </span>
                  </>
                ) : (
                  (() => {
                    const activeSub = resolvedSubjects.find(s => s.id === hoveredSubject);
                    if (!activeSub) return null;
                    const whole = Math.floor(activeSub.alignment);
                    const decimal = Math.round((activeSub.alignment % 1) * 10);
                    return (
                      <>
                        <span className="text-[10px] text-gray-500 font-semibold mb-0.5">Alignment</span>
                        <div className="flex items-baseline gap-0">
                          <span className="text-[28px] font-black leading-none" style={{ color: activeSub.color }}>
                            {whole}
                          </span>
                          <span className="text-sm font-bold leading-none" style={{ color: activeSub.color }}>
                            .{decimal}%
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium mt-1.5">{activeSub.alignment} Completed</span>
                      </>
                    );
                  })()
                )}
              </div>
            </div>

            {/* Right Stat Cards 2x3 Grid */}
            <div className="grid grid-cols-2 gap-2 flex-grow max-h-[180px] overflow-y-auto pr-1">
              {resolvedSubjects.map((sub) => {
                const isHovered = hoveredSubject === sub.id;
                const isAnyHovered = hoveredSubject !== null;
                
                return (
                  <div
                    key={`card-${sub.id}`}
                    className={`rounded-lg px-3 py-2 flex items-center justify-between border transition-all duration-200 cursor-pointer ${
                      isHovered
                        ? sub.activeBg
                        : isAnyHovered
                        ? "bg-gray-50 border-gray-200 opacity-40"
                        : `bg-gray-50 border-gray-200 hover:bg-gray-100/50 ${sub.hoverBg}`
                    }`}
                    onMouseEnter={() => setHoveredSubject(sub.id)}
                    onMouseLeave={() => setHoveredSubject(null)}
                  >
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${sub.textColor}`}>{sub.subjectName}</p>
                      <p className="text-gray-900 font-bold text-xs">{sub.alignment}<span className="text-gray-400 font-normal text-[10px]">/100</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 font-medium">{sub.courseCode}</p>
                      <p className={`text-[9px] font-bold ${sub.textColor}`}>
                        {sub.status} {sub.status === "Aligned" ? "✓" : sub.status === "Critical" ? "⚠" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* Doubts Solved */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all duration-200 hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-emerald-700 bg-emerald-50 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-emerald-100 uppercase tracking-wider">
                +{currentFaculty.doubtsSolvedThisMonth} this month
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Doubts Solved</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{currentFaculty.doubtsSolvedAllTime}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-medium pt-2 border-t border-gray-100 mt-2">
            Excellent resolution rate
          </div>
        </div>

        {/* Overall Activity & Status */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-amber-500 transition-all duration-200 hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border uppercase tracking-wider ${
                resolutionRate >= 90
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                  : resolutionRate >= 70
                  ? 'text-amber-700 bg-amber-50 border-amber-100'
                  : 'text-red-700 bg-red-50 border-red-100'
              }`}>
                {resolutionRate >= 90 ? 'Top Performer' : resolutionRate >= 70 ? 'Good Standing' : 'Needs Attention'}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Resolution Rate</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{resolutionRate}%</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
            <span className="text-gray-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Synced {isSyncing ? "just now" : syncTimeDisplay}
            </span>
            {isLive ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="text-gray-400 font-semibold flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> Offline
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Faculty Activity Tracker
            </h3>
            <p className="text-xs text-gray-500">
              {selectedYear === "current" 
                ? `${dashboardData?.data?.stats?.totalDoubts ?? 0} doubts resolved and ${dashboardData?.data?.stats?.confirmedSessions ?? 0} mock sessions in the past year` 
                : "98 doubts resolved and 8 mock sessions in the previous year"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs font-semibold text-gray-600 w-full sm:w-auto">
            <div className="flex gap-4">
              <span>Total active days: <strong className="text-gray-900">{heatmapActiveDays}</strong></span>
              <span>•</span>
              <span>Max streak: <strong className="text-gray-900">{heatmapMaxStreak} days</strong></span>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as "current" | "previous")}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs py-1.5 px-3 rounded-lg transition-all outline-none cursor-pointer shadow-sm w-full sm:w-auto text-center"
            >
              <option value="current">Current Year</option>
              <option value="previous">Previous Year</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto pb-2 animate-fade-in flex justify-center">
          <div className="flex flex-col items-center">
            {/* Heatmap Grid grouped by months */}
            <div className="flex items-start">
              {/* Month Blocks */}
              <div className="flex gap-3.5">
                {[
                  { name: "Jul", weeksCount: 4, label: "Jul" },
                  { name: "Aug", weeksCount: 4, label: "Aug" },
                  { name: "Sep", weeksCount: 4, label: "Sep" },
                  { name: "Oct", weeksCount: 5, label: "Oct" },
                  { name: "Nov", weeksCount: 4, label: "Nov" },
                  { name: "Dec", weeksCount: 4, label: "Dec" },
                  { name: "Jan", weeksCount: 5, label: "Jan" },
                  { name: "Feb", weeksCount: 4, label: "Feb" },
                  { name: "Mar", weeksCount: 4, label: "Mar" },
                  { name: "Apr", weeksCount: 4, label: "Apr" },
                  { name: "May", weeksCount: 5, label: "May" },
                  { name: "Jun", weeksCount: 5, label: "Jun" }
                ].map((month, mIdx) => {
                  let startDayForMonth = 0;
                  if (mIdx > 0) {
                     // sum weeksCount for previous months * 7
                     for(let i = 0; i < mIdx; i++) {
                       startDayForMonth += [4, 4, 4, 5, 4, 4, 5, 4, 4, 4, 5, 5][i] * 7;
                     }
                  }

                  return (
                  <div key={mIdx} className="flex flex-col items-center gap-2">
                    {/* Month Weeks Container */}
                    <div className="flex gap-[3px]">
                      {Array.from({ length: month.weeksCount }).map((_, wIdx) => (
                        <div key={wIdx} className="flex flex-col gap-[3px]">
                          {Array.from({ length: 7 }).map((_, dIndex) => {
                            const globalDayIndex = startDayForMonth + wIdx * 7 + dIndex;
                            let level = 0;
                            if (selectedYear === 'current') {
                              level = heatmapData[globalDayIndex] || 0;
                            } else {
                              // If previous year, we will just use the same real data offset by 365 days 
                              // (Assuming heatmapData contains the whole history or we just mock zero if empty for now,
                              // but since we don't have past year data from backend right now, we fallback to 0)
                              level = heatmapData[globalDayIndex] || 0;
                            }
                            
                            return (
                              <div
                                key={dIndex}
                                className={`w-[9px] h-[9px] rounded-[1.5px] transition-all hover:scale-125 duration-100 cursor-pointer ${
                                  level === 1 ? "bg-emerald-100" :
                                  level === 2 ? "bg-emerald-300" :
                                  level === 3 ? "bg-emerald-500" :
                                  level === 4 ? "bg-emerald-700" :
                                  "bg-gray-100"
                                }`}
                                title={`${month.name} week ${wIdx + 1}, day ${dIndex + 1}: ${level === 0 ? "No" : level} activity`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    
                    {/* Month Label */}
                    <div className="h-6 flex items-center justify-center mt-1">
                      <span className="text-[10px] text-gray-400 font-bold tracking-wider">{month.label}</span>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center items-center gap-1.5 text-[10px] text-gray-400 mt-3 font-medium">
          <span>Less</span>
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-gray-100" />
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald-100" />
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald-300" />
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald-500" />
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald-700" />
          <span>More</span>
        </div>
      </div>

      {/* Main Panels */}
      <div className="w-full">
        
        {/* Panel: Trend Alerts Feed */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col">
          <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Radar className="w-5 h-5 text-blue-600" />
              Recent Trend Alerts
            </h2>
          </div>
          
          <div className={`p-5 flex-grow overflow-y-auto transition-all duration-300 ${isExpanded ? "max-h-[1000px]" : "max-h-[450px]"}`}>
            <div className="space-y-6 ml-3 border-l-2 border-gray-100">
              {industryTrends.map((alert: any, index: number) => (
                <div key={alert.id} className="relative pl-5">
                  <div className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white border-[3px] ${getAlertDot(alert.severity?.toLowerCase() || 'info')}`}></div>
                  <span className="text-xs text-gray-500 font-semibold block mb-1">
                    {alert.detectedAt ? formatDistanceToNow(new Date(alert.detectedAt), { addSuffix: true }) : (alert.timeAgo || 'recently')} • {alert.source}
                  </span>
                  <p className="font-semibold text-gray-900 mb-1 leading-snug">
                    {alert.trend || alert.headline}
                  </p>
                  <p className="text-sm text-gray-500 mb-2 leading-relaxed">
                    {alert.description || `Based on recent question frequency, ${alert.trend || 'this trend'} is highly relevant.`}
                  </p>
                  {alert.tags && alert.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {alert.tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-600 font-semibold border border-gray-200 uppercase tracking-wide">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="block w-full text-blue-600 font-bold text-xs py-2 rounded hover:bg-gray-100 transition-colors text-center border border-transparent hover:border-gray-200 cursor-pointer outline-none"
            >
              {isExpanded ? "Show Less Insights" : "View All Insights"}
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 inline-block ml-1 align-text-bottom" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 inline-block ml-1 align-text-bottom" />
              )}
            </button>
          </div>
        </div>

      </div>
      </>
      )}
    </div>
  );
}
