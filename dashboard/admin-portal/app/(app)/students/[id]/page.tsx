"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, MessageCircle, CalendarDays, TrendingUp, Star, CheckCircle2 } from "lucide-react";
import { useStudent } from "@/lib/hooks";

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { student, isLoading, isError } = useStudent(id);

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
        <Link href="/students" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </Link>
      </div>
    );
  }

  // Normalize API response — backend returns camelCase fields
  const name = student.fullName ?? student.name ?? "Unknown";
  const batch = student.batch ?? student.year ?? "—";
  const status = student.placementStatus ?? student.status ?? "IN PROGRESS";
  const progress = student.roadmapProgress ?? student.progress ?? 0;
  const doubtsCount = student.doubtsCount ?? student.doubts ?? 0;
  const sessionsCount = student.sessionsCount ?? student.sessions ?? 0;
  const xp = student.xpTotal ?? student.xp ?? 0;

  const statusColor: Record<string, string> = {
    PLACED: "bg-emerald-50 text-emerald-700",
    "IN PROGRESS": "bg-amber-50 text-amber-700",
    INACTIVE: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/students" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </Link>

      {/* Profile Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            {name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{name}</h1>
            <p className="text-sm text-gray-500">Batch {batch}</p>
            {xp > 0 && (
              <p className="text-xs text-blue-600 font-semibold mt-1">{xp.toLocaleString()} XP</p>
            )}
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusColor[status] || "bg-gray-100 text-gray-600"}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Roadmap Progress", value: `${progress}%`, icon: TrendingUp, color: "blue" },
          { label: "Doubts Raised", value: doubtsCount, icon: MessageCircle, color: "amber" },
          { label: "Sessions Attended", value: sessionsCount, icon: CalendarDays, color: "emerald" },
          {
            label: "Placement Status",
            value: status,
            icon: status === "PLACED" ? CheckCircle2 : GraduationCap,
            color: status === "PLACED" ? "emerald" : "gray",
          },
        ].map((card) => {
          const colors: Record<string, { bg: string; text: string }> = {
            blue: { bg: "bg-blue-50", text: "text-blue-600" },
            amber: { bg: "bg-amber-50", text: "text-amber-600" },
            emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
            gray: { bg: "bg-gray-100", text: "text-gray-600" },
          };
          const c = colors[card.color];
          return (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{card.label}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Roadmap Progress</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Overall Completion</span>
            <span className="font-semibold text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Placeholder for future sections */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
        <Star className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">
          Session history, placement journey timeline, and performance analytics will appear here.
        </p>
      </div>
    </div>
  );
}
