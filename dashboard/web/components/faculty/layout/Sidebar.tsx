"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  MessageCircle,
  Send,
  LogOut,
  LayoutList,
  Trophy,
  BookOpen,
  TrendingUp, Route } from "lucide-react";
import { cn } from "@/lib/faculty/utils";
import { useFeatures } from "@/lib/faculty/use-features";

/**
 * Faculty nav items — each can be toggled from Admin → Feature Controls
 * via its `feature` key.
 */
const navigation = [
  { name: "Dashboard", href: "/faculty", icon: LayoutDashboard },
  { name: "Session Requests", href: "/faculty/requests", icon: CalendarDays, feature: "faculty.sessions" },
  { name: "Doubts & Questions", href: "/faculty/doubts", icon: MessageCircle, feature: "faculty.doubts" },
  { name: "Student Matrix", href: "/faculty/students", icon: LayoutList, feature: "faculty.students" },
  { name: "Leaderboard", href: "/faculty/leaderboard", icon: Trophy, feature: "faculty.leaderboard" },
  { name: "Company Rankings", href: "/faculty/rankings", icon: Building2, feature: "faculty.rankings" },
  { name: "Custom Roadmaps", href: "/faculty/custom-roadmaps", icon: Route },
  { name: "Curriculum Gap", href: "/faculty/curriculum", icon: BookOpen, feature: "faculty.curriculum" },
  { name: "Industry Trends", href: "/faculty/trends", icon: TrendingUp, feature: "faculty.trends" },
  { name: "Export Reports", href: "/faculty/reports", icon: Send, feature: "faculty.reports" },
];

export function SidebarContent() {
  const pathname = usePathname();
  const { isEnabled, isLoading } = useFeatures();
  const visible = navigation.filter((item) => !item.feature || isLoading || isEnabled(item.feature));

  return (
    <div className="flex h-full w-full flex-col bg-white pt-4">
      {/* User Info */}
      {/* <div className="mx-3 mb-4 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-indigo-600 text-sm font-bold text-white shadow-sm">
          PS
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">Prof. Sharma</p>
          <p className="truncate text-xs text-blue-600 font-medium">Computer Science Dept.</p>
        </div>
      </div> */}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3">
        {visible.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "text-gray-650 hover:bg-blue-50 hover:text-blue-700"
              )}
            >
              <item.icon
                className={cn(
                  "h-4.5 w-4.5 flex-shrink-0",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-blue-600"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="w-full group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-red-500" />
          Logout
        </button>
        <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">NST Interview Intelligence</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <div className="hidden border-r border-gray-200 lg:fixed lg:top-14 lg:bottom-0 lg:flex lg:w-[var(--sidebar-width)] lg:flex-col z-50">
      <SidebarContent />
    </div>
  );
}
