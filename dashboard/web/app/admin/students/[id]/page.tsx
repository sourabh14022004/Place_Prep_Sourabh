"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  MessageCircle,
  CalendarDays,
  TrendingUp,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Flame,
  ExternalLink,
  Briefcase,
  Mail,
  Edit2,
  X,
  Check,
  Building,
  Target,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useStudent } from "@/lib/admin/hooks";
import { CompanyLogo, PlatformLogo } from "@/components/ui";
import { toast } from "sonner";

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { student, isLoading, isError, mutate } = useStudent(id);

  // Status edit modal state
  const [editingStatus, setEditingStatus] = useState(false);
  const [placementStatus, setPlacementStatus] = useState("IN PROGRESS");
  const [placedCompany, setPlacedCompany] = useState("");
  const [placedRole, setPlacedRole] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Expanded weeks for roadmaps
  const [expandedRoadmapId, setExpandedRoadmapId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-5 bg-gray-100 rounded w-32 animate-pulse" />
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-100 rounded w-40 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-400 text-sm mb-4">Student not found.</p>
        <Link href="/admin/students" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </Link>
      </div>
    );
  }

  // Normalize API response
  const name = student.fullName ?? student.name ?? "Unknown";
  const batch = student.batch ?? student.year ?? "—";
  const branch = student.branch ?? "CS & AI";
  const email = student.email ?? "";
  const status = student.placementStatus ?? student.status ?? "IN PROGRESS";
  const overallProg = student.overallProgress ?? Math.min(Math.round((student.xpTotal || 0) / 20), 100);
  const doubtsCount = student.totalDoubts ?? student.doubtsCount ?? student.doubts ?? 0;
  const sessionsCount = student.totalSessions ?? student.sessionsCount ?? student.sessions ?? 0;
  const xp = student.xpTotal ?? student.xp ?? 0;
  const streak = student.currentStreakDays ?? 0;
  const problemsSolved = student.problemsSolved ?? 0;
  const roadmaps: any[] = student.roadmaps ?? [];
  const targetCompanies: string[] = student.targetCompanySlugs ?? [];
  const targetDomains: string[] = student.targetDomains ?? [];
  const platformHandles = student.platformHandles ?? {};
  const recentDoubts: any[] = student.recentDoubts ?? [];
  const recentSessions: any[] = student.recentSessions ?? [];

  const statusColor: Record<string, { badge: string; dot: string }> = {
    PLACED: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    "IN PROGRESS": { badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
    INACTIVE: { badge: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
  };

  const currentSt = statusColor[status] || statusColor["IN PROGRESS"];

  const handleOpenEditStatus = () => {
    setPlacementStatus(student.placementStatus || "IN PROGRESS");
    setPlacedCompany(student.placedCompany || "");
    setPlacedRole(student.placedRole || "");
    setEditingStatus(true);
  };

  const handleSaveStatus = async () => {
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/students/${student.userId || id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placementStatus,
          placedCompany: placementStatus === "PLACED" ? placedCompany : undefined,
          placedRole: placementStatus === "PLACED" ? placedRole : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? "Failed to update placement status");
      }

      toast.success("Placement status updated successfully!");
      setEditingStatus(false);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenEditStatus}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-400" /> Update Status
          </button>
        </div>
      </div>

      {/* Profile Header Hero Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xl font-black shadow-md">
              {name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wide ${currentSt.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentSt.dot}`} />
                  {status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5 flex-wrap">
                <span className="font-semibold text-gray-700">Batch {batch}</span>
                <span>•</span>
                <span>{branch}</span>
                {email && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> {email}
                    </span>
                  </>
                )}
                {student.phone && (
                  <>
                    <span>•</span>
                    <span>{student.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Placed highlight banner if PLACED */}
          {status === "PLACED" && student.placedCompany && (
            <div className="flex items-center gap-3 bg-emerald-50/80 border border-emerald-200 rounded-xl px-4 py-2.5">
              <CompanyLogo name={student.placedCompany.toLowerCase()} size={32} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Placed At</p>
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {student.placedCompany} {student.placedRole ? `• ${student.placedRole}` : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6 Key Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          { icon: TrendingUp,   label: "Overall Progress", val: `${overallProg}%`, sub: "Curriculum solved", color: "blue" },
          { icon: BookOpen,     label: "Roadmaps Followed", val: roadmaps.length, sub: "Active curricula", color: "indigo" },
          { icon: CheckCircle2, label: "Problems Solved",  val: problemsSolved, sub: "Verified solves", color: "emerald" },
          { icon: Sparkles,     label: "Total XP",         val: `${xp.toLocaleString()}`, sub: "Platform score", color: "amber" },
          { icon: Flame,        label: "Current Streak",   val: `${streak}d`, sub: "Daily practice", color: "orange" },
          { icon: MessageCircle,label: "Doubts / 1:1",     val: `${doubtsCount} / ${sessionsCount}`, sub: "Help requests", color: "purple" },
        ].map((m) => {
          const colors: Record<string, { bg: string; text: string }> = {
            blue:   { bg: "bg-blue-50",   text: "text-blue-600" },
            indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
            emerald:{ bg: "bg-emerald-50",text: "text-emerald-600" },
            amber:  { bg: "bg-amber-50",  text: "text-amber-600" },
            orange: { bg: "bg-orange-50", text: "text-orange-600" },
            purple: { bg: "bg-purple-50", text: "text-purple-600" },
          };
          const c = colors[m.color];
          return (
            <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                  <m.icon className={`w-3.5 h-3.5 ${c.text}`} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">{m.label}</span>
              </div>
              <div className="text-xl font-black text-gray-900 leading-tight">{m.val}</div>
              <p className="text-[10px] text-gray-400 mt-1">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Followed Roadmaps Detailed Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Followed Roadmaps ({roadmaps.length})</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Individual preparation roadmaps, company targets, and weekly progress
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
            {roadmaps.length} active
          </span>
        </div>

        {roadmaps.length > 0 ? (
          <div className="space-y-4">
            {roadmaps.map((r: any) => {
              const isWeeksOpen = expandedRoadmapId === (r._id || r.companySlug);
              return (
                <div
                  key={r._id || r.companySlug}
                  className="border border-gray-200 rounded-xl p-5 hover:border-blue-200 transition-colors bg-gray-50/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <CompanyLogo name={r.companySlug || r.companyName} size={40} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-base">{r.companyName || r.title}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize border border-blue-100">
                            {r.status || "Active"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Target: <span className="font-medium text-gray-700">{r.targetRole || "Software Engineer"}</span> • {r.totalWeeks} Weeks Plan
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{r.progressPct}%</div>
                        <div className="text-[11px] text-gray-500">
                          {r.doneQuestions} / {r.totalQuestions} questions
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedRoadmapId(isWeeksOpen ? null : (r._id || r.companySlug))}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        {isWeeksOpen ? "Hide Weeks" : "View Weeks"}
                        {isWeeksOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3.5">
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(r.progressPct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Weeks breakdown drawer */}
                  {isWeeksOpen && r.weeks && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                        Curriculum Breakdown ({r.weeks.length} Weeks)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        {r.weeks.map((w: any) => (
                          <div
                            key={w.weekNumber}
                            className={`p-3 rounded-lg border text-xs ${
                              w.doneQuestions >= w.totalQuestions && w.totalQuestions > 0
                                ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                                : w.status === "active"
                                ? "bg-blue-50/60 border-blue-200 text-blue-900"
                                : "bg-white border-gray-200 text-gray-600"
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold mb-1">
                              <span>Week {w.weekNumber}</span>
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white/80 border">
                                {w.status}
                              </span>
                            </div>
                            <div className="font-bold truncate" title={w.topicLabel}>
                              {w.topicLabel}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1">
                              {w.doneQuestions}/{w.totalQuestions} questions
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No active roadmaps</p>
            <p className="text-xs text-gray-400 mt-0.5">This student has not followed any company preparation roadmaps yet.</p>
          </div>
        )}
      </div>

      {/* Target Companies & Connected Coding Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Target Companies Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm">Target Companies</h3>
          </div>
          {targetCompanies.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {targetCompanies.map((slug) => (
                <div
                  key={slug}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50/80 border border-gray-200 text-xs font-semibold text-gray-800"
                >
                  <CompanyLogo name={slug} size={20} />
                  <span className="capitalize">{slug}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No target companies specified during onboarding.</p>
          )}

          {targetDomains.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Target Domains</span>
              <div className="flex flex-wrap gap-1.5">
                {targetDomains.map((d) => (
                  <span key={d} className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coding Profiles Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-sm">Connected Coding Profiles</h3>
          </div>
          <div className="space-y-3">
            {/* LeetCode */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <PlatformLogo platform="leetcode" size={32} />
                <div>
                  <div className="text-xs font-bold text-gray-900">LeetCode</div>
                  <div className="text-[11px] text-gray-500">
                    {platformHandles.leetcode ? `@${platformHandles.leetcode}` : "Not connected"}
                  </div>
                </div>
              </div>
              {platformHandles.leetcode ? (
                <a
                  href={`https://leetcode.com/u/${platformHandles.leetcode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg"
                >
                  View Profile <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-[11px] text-gray-400 italic">Unlinked</span>
              )}
            </div>

            {/* Codeforces */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <PlatformLogo platform="codeforces" size={32} />
                <div>
                  <div className="text-xs font-bold text-gray-900">Codeforces</div>
                  <div className="text-[11px] text-gray-500">
                    {platformHandles.codeforces ? `@${platformHandles.codeforces}` : "Not connected"}
                  </div>
                </div>
              </div>
              {platformHandles.codeforces ? (
                <a
                  href={`https://codeforces.com/profile/${platformHandles.codeforces}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg"
                >
                  View Profile <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-[11px] text-gray-400 italic">Unlinked</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Doubts and Mentorship Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recent Doubts Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-gray-900 text-sm">Recent Doubts ({doubtsCount})</h3>
            </div>
          </div>
          {recentDoubts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentDoubts.map((d: any) => (
                <div key={d._id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-900 truncate">
                      {d.title || d.questionText || "Doubt Thread"}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      d.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {d.status || "OPEN"}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {d.domain || d.tag || "DSA"} • {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "Recent"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No doubt threads opened by this student.</p>
          )}
        </div>

        {/* 1:1 Sessions Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-gray-900 text-sm">1:1 Mentorship Sessions ({sessionsCount})</h3>
            </div>
          </div>
          {recentSessions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentSessions.map((s: any) => (
                <div key={s._id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-900 truncate">
                      {s.topic || "1:1 Mentorship Session"}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                    }`}>
                      {s.status || "Scheduled"}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {s.dateTime ? new Date(s.dateTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : "Upcoming"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No 1:1 mentorship sessions booked yet.</p>
          )}
        </div>
      </div>

      {/* Placement Status Edit Modal */}
      {editingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Update Placement Status</h3>
              <button onClick={() => setEditingStatus(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Status</label>
                <select
                  value={placementStatus}
                  onChange={(e) => setPlacementStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="IN PROGRESS">IN PROGRESS</option>
                  <option value="PLACED">PLACED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              {placementStatus === "PLACED" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Placed Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Google, Microsoft, Amazon"
                      value={placedCompany}
                      onChange={(e) => setPlacedCompany(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Role / Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer (L3), SDE 1"
                      value={placedRole}
                      onChange={(e) => setPlacedRole(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setEditingStatus(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingStatus}
                onClick={handleSaveStatus}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {savingStatus ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
