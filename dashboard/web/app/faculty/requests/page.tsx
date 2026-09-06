"use client";
import { FeatureGate } from "@/lib/faculty/use-features";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Video,
  Search,
  Filter,
  Users,
  CalendarRange,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { FacultySessionRequest, SessionStatus } from "@/lib/faculty/types";
import { getSessions, confirmSession, declineSession, proposeAlternative } from "@/lib/faculty/api";
import { toast } from "sonner";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from "date-fns";

// HH:mm values — matches Zod regex /^\d{2}:\d{2}$/ required by proposeSessionSchema
const TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
function fmtTimeSlot(t: string) {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${suffix}`;
}

const STATUS_CFG: Record<SessionStatus, { label: string; cls: string; border: string; icon: React.ElementType; color: string }> = {
  pending: { 
    label: "Awaiting Action", 
    cls: "bg-amber-50 text-amber-700 border-amber-200", 
    border: "border-l-amber-500",
    icon: Clock,
    color: "text-amber-500"
  },
  confirmed: { 
    label: "Confirmed Session", 
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200", 
    border: "border-l-emerald-500",
    icon: CheckCircle2,
    color: "text-emerald-500"
  },
  proposed: { 
    label: "Alternative Proposed", 
    cls: "bg-indigo-50 text-indigo-700 border-indigo-200", 
    border: "border-l-indigo-500",
    icon: AlertCircle,
    color: "text-indigo-500"
  },
  completed: { 
    label: "Session Completed", 
    cls: "bg-slate-50 text-slate-650 border-slate-200", 
    border: "border-l-slate-400",
    icon: CheckCircle2,
    color: "text-slate-455"
  },
  cancelled: { 
    label: "Cancelled", 
    cls: "bg-rose-50 text-rose-700 border-rose-200", 
    border: "border-l-rose-500",
    icon: XCircle,
    color: "text-rose-500"
  },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RequestsPageInner() {
  const [requests, setRequests] = useState<FacultySessionRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"All" | SessionStatus>("All");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [proposingFor, setProposingFor] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState(TIME_SLOTS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    getSessions()
      .then(({ sessions }) => {
        const mapped: FacultySessionRequest[] = sessions.map((s: any) => {
          // BUG 2 FIX: SessionBooking model stores requestedDate (YYYY-MM-DD string)
          // and requestedTime (HH:mm string) — NOT scheduledAt or durationMins.
          // studentName is denormalized on the document — no need to populate.
          const studentName = s.studentName ?? (typeof s.studentId === "object" ? s.studentId?.fullName ?? "Student" : "Student");
          return {
            id: s._id,
            studentName,
            studentInitials: studentName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
            batch: typeof s.studentId === "object" ? s.studentId?.batch ?? "2024" : "2024",
            year: typeof s.studentId === "object" ? s.studentId?.year ?? "3rd" : "3rd",
            branch: typeof s.studentId === "object" ? s.studentId?.branch ?? "CS" : "CS",
            topic: s.topic,
            notes: s.notes ?? "",
            date: s.requestedDate ?? "",         // YYYY-MM-DD ✓
            time: s.requestedTime ?? "",          // HH:mm ✓
            duration: s.durationMin ?? 30,        // 30 | 60 ✓
            status: (s.status === "declined" ? "cancelled" : s.status) as SessionStatus,
            meetLink: s.meetLink,
            proposedDate: s.proposedDate,         // stored as plain string in model
            proposedTime: s.proposedTime,         // stored as plain string in model
          };
        });
        if (mapped.length > 0) setRequests(mapped);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleConfirm = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "confirmed" } : r)
    );
    confirmSession(id)
      .then(() => toast.success("Session confirmed! Jitsi link generated."))
      .catch((err) => {
        setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "pending" } : r));
        toast.error("Failed to confirm session: " + (err?.message ?? "Unknown error"));
      });
  };

  const handleDecline = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r))
    );
    declineSession(id)
      .then(() => toast.success("Session declined."))
      .catch((err) => {
        setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "pending" } : r));
        toast.error("Failed to decline session: " + (err?.message ?? "Unknown error"));
      });
  };

  const handleProposeSubmit = (id: string) => {
    if (!proposedDate || !proposedTime) return;
    // BUG-FIX G1: reject past dates that bypass the input min attribute (e.g. manual typing)
    if (proposedDate < format(new Date(), "yyyy-MM-dd")) {
      toast.error("Please pick a date that isn't in the past.");
      return;
    }
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "proposed", proposedDate, proposedTime } : r
      )
    );
    proposeAlternative(id, proposedDate, proposedTime)
      .then(() => toast.success("Alternative time proposed to student."))
      .catch((err) => {
        setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "pending" } : r));
        toast.error("Failed to propose alternative: " + (err?.message ?? "Unknown error"));
      });
    setProposingFor(null);
    setProposedDate("");
    setProposedTime(TIME_SLOTS[0]);
  };

  // Dynamic filter logic
  const scopedRequests = requests.filter(
    (r) => activeTab === "All" || r.status === activeTab
  );

  const filteredRequests = searchQuery.trim()
    ? scopedRequests.filter(
        (r) =>
          r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.branch.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : scopedRequests;

  // Counts
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const confirmedCount = requests.filter((r) => r.status === "confirmed").length;
  const completedCount = requests.filter((r) => r.status === "completed").length;

  const STAT_CARDS = [
    {
      label: "Total Requests",
      value: totalCount,
      icon: CalendarRange,
      iconBg: "bg-blue-500",
      textColor: "text-blue-600",
      gradient: "from-blue-500/10 to-indigo-500/5",
      border: "hover:border-blue-400"
    },
    {
      label: "Pending Action",
      value: pendingCount,
      icon: Clock,
      iconBg: "bg-amber-500",
      textColor: "text-amber-600",
      gradient: "from-amber-500/10 to-orange-500/5",
      border: "hover:border-amber-400"
    },
    {
      label: "Confirmed Session",
      value: confirmedCount,
      icon: CheckCircle2,
      iconBg: "bg-emerald-500",
      textColor: "text-emerald-600",
      gradient: "from-emerald-500/10 to-teal-500/5",
      border: "hover:border-emerald-400"
    },
    {
      label: "Completed",
      value: completedCount,
      icon: Sparkles,
      iconBg: "bg-violet-500",
      textColor: "text-violet-600",
      gradient: "from-violet-500/10 to-fuchsia-500/5",
      border: "hover:border-violet-400"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* ── Page Header ── */}
      <div className="mb-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/25">
              <CalendarRange className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Session Requests</h1>
          </div>
          <p className="text-sm text-gray-500 ml-12">
            Manage and schedule 1:1 mentorship sessions requested by students
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner ml-12 md:ml-0">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === "list" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === "calendar" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
          <div className="h-14 bg-gray-100 animate-pulse rounded-xl" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {STAT_CARDS.map(({ label, value, icon: Icon, iconBg, textColor, gradient, border }) => (
              <div 
                key={label}
                className={`bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between transition-all duration-200 bg-gradient-to-br ${gradient} ${border} hover:shadow-md hover:scale-[1.01]`}
              >
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${iconBg} text-white shadow-sm shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>

          {/* ── Interactive Filters ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-6 flex flex-wrap items-center gap-3 justify-between">
            {/* Search inputs */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student, topic or branch..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
              />
            </div>

            {/* Tab pill layout */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(["All", "pending", "confirmed", "proposed", "completed"] as const).map(
                (tab) => {
                  const isActive = activeTab === tab;
                  const count =
                    tab === "All"
                      ? requests.length
                      : requests.filter((r) => r.status === tab).length;
                  
                  let tabStyle = "bg-gray-100 text-gray-600 hover:bg-gray-200";
                  if (isActive) {
                    if (tab === "All") tabStyle = "bg-blue-600 text-white shadow-sm shadow-blue-500/20";
                    else if (tab === "pending") tabStyle = "bg-amber-500 text-white shadow-sm shadow-amber-500/20";
                    else if (tab === "confirmed") tabStyle = "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20";
                    else if (tab === "proposed") tabStyle = "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20";
                    else tabStyle = "bg-slate-600 text-white shadow-sm shadow-slate-500/20";
                  }
                  
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${tabStyle}`}
                    >
                      {tab}
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                        isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* ── Content View ── */}
          {viewMode === "calendar" ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer">
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-bold text-gray-400 py-2 uppercase tracking-wider">{day}</div>
                ))}
                
                {eachDayOfInterval({
                  start: startOfWeek(startOfMonth(currentMonth)),
                  end: endOfWeek(endOfMonth(currentMonth))
                }).map((day, idx) => {
                  const dayRequests = filteredRequests.filter(req => {
                    const reqDate = new Date(req.date);
                    return isSameDay(day, reqDate);
                  });
                  
                  return (
                    <div 
                      key={idx} 
                      className={`min-h-[100px] border rounded-xl p-1.5 sm:p-2 transition-all flex flex-col ${
                        !isSameMonth(day, currentMonth) 
                          ? 'bg-gray-50/30 border-transparent opacity-60' 
                          : isToday(day)
                            ? 'bg-blue-50/30 border-blue-300 shadow-sm ring-1 ring-blue-100'
                            : 'bg-white border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className={`text-right text-xs font-bold mb-1.5 ${
                        isToday(day) ? 'text-blue-600 bg-blue-100 w-6 h-6 flex items-center justify-center rounded-full ml-auto' : 'text-gray-500 pr-1'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[120px] custom-scrollbar">
                        {dayRequests.map(req => {
                          const cfg = STATUS_CFG[req.status];
                          return (
                            <div key={req.id} className={`text-[10px] px-1.5 py-1 rounded-md font-medium leading-tight ${cfg.cls} border border-opacity-50`}>
                              <div className="font-bold flex items-center gap-1 opacity-80 mb-0.5">
                                <Clock className="w-3 h-3" /> {req.time}
                              </div>
                              <div className="truncate">{req.studentName}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-20 bg-white border border-dashed border-gray-300 rounded-2xl">
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CalendarDays className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-400">No session requests found</p>
                  <p className="text-xs text-gray-300 mt-1">Try adapting your search or filter values</p>
                </div>
              ) : (
                filteredRequests.map((req) => {
                  const { label, cls, border: borderAccent, icon: StatusIcon } = STATUS_CFG[req.status];
                  
                  // Clean avatar color palette based on name initials seed
                  const codeSeed = req.studentName.charCodeAt(0) % 5;
                  const avatarGradients = [
                    "from-blue-600 to-indigo-600 text-white shadow-blue-200",
                    "from-emerald-500 to-teal-600 text-white shadow-emerald-200",
                    "from-violet-500 to-fuchsia-600 text-white shadow-violet-200",
                    "from-rose-500 to-orange-500 text-white shadow-rose-200",
                    "from-cyan-500 to-sky-600 text-white shadow-cyan-200"
                  ];
                  
                  return (
                    <div
                      key={req.id}
                      className={`bg-white border border-gray-200 border-l-4 ${borderAccent} rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarGradients[codeSeed]} flex items-center justify-center font-black text-sm shrink-0 shadow-md`}>
                            {req.studentInitials}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h3 className="font-bold text-sm text-gray-900">{req.studentName}</h3>
                              <span className="text-[10px] text-gray-400">•</span>
                              <span className="text-xs text-gray-500 font-semibold">{req.branch} · {req.year}</span>
                            </div>
                            
                            <h4 className="font-bold text-sm text-gray-900 leading-snug mb-1">{req.topic}</h4>
                            {req.notes && (
                              <p className="text-xs text-gray-400 mb-3 bg-gray-50/60 p-2 rounded-lg border border-gray-100 max-w-2xl leading-relaxed">{req.notes}</p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500 font-medium">
                              <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-full border border-gray-200/50">
                                <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                                {fmtDate(req.date)}
                              </span>
                              <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-full border border-gray-200/50">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                {req.time} · {req.duration} mins
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cls}`}>
                                <StatusIcon className="w-3 h-3" /> {label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions column */}
                        <div className="flex items-center md:items-end justify-start md:justify-center md:flex-col gap-2 shrink-0 ml-15 md:ml-0">
                          {req.status === "pending" && proposingFor !== req.id && (
                            <>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleConfirm(req.id)}
                                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-md shadow-blue-600/15"
                                >
                                  Confirm Session
                                </button>
                                <button
                                  onClick={() => setProposingFor(req.id)}
                                  className="border border-gray-300 text-gray-600 text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer bg-white"
                                >
                                  Propose Time
                                </button>
                              </div>
                              <button
                                onClick={() => handleDecline(req.id)}
                                className="text-xs text-gray-400 hover:text-rose-600 font-semibold mt-1 transition-colors cursor-pointer"
                              >
                                Decline Request
                              </button>
                            </>
                          )}

                          {/* Inline propose form */}
                          {proposingFor === req.id && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-right w-full md:w-auto shadow-inner">
                              <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> Propose Alternative Time</p>
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <input
                                  type="date"
                                  value={proposedDate}
                                  onChange={(e) => setProposedDate(e.target.value)}
                                  min={format(new Date(), "yyyy-MM-dd")} // BUG-FIX G1
                                  className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                                <select
                                  value={proposedTime}
                                  onChange={(e) => setProposedTime(e.target.value)}
                                  className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                  {TIME_SLOTS.map((t) => (
                                    <option key={t} value={t}>
                                      {fmtTimeSlot(t)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setProposingFor(null)}
                                  className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 font-semibold"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleProposeSubmit(req.id)}
                                  disabled={!proposedDate}
                                  className="text-xs font-bold bg-blue-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                                >
                                  Send Proposal
                                </button>
                              </div>
                            </div>
                          )}

                          {req.status === "confirmed" && req.meetLink && (
                            <a
                              href={req.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
                            >
                              <Video className="w-3.5 h-3.5" /> Join Meet
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Alternate propose status label */}
                      {req.status === "proposed" && req.proposedDate && (
                        <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-start gap-2 bg-indigo-50/40 p-3 rounded-lg border border-indigo-100/50">
                          <AlertCircle className="w-4 h-4 text-indigo-500 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-indigo-900 mb-0.5">Awaiting student response</p>
                            <p className="text-[11px] text-indigo-700 font-semibold">
                              You proposed: {fmtDate(req.proposedDate)} at {req.proposedTime}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}


// Admin feature-toggle gate (Feature Controls → faculty.sessions)
export default function RequestsPageGate() {
  return (
    <FeatureGate feature="faculty.sessions" title="Session Requests">
      <RequestsPageInner />
    </FeatureGate>
  );
}
