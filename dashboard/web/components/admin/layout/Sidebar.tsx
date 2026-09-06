"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, UserCog,
  Bell, HelpCircle, Calendar, FileText, LogOut,
  Activity, MessageSquare, Dumbbell, Briefcase,
  Trophy, BookCopy, ClipboardList, Building2,
  SlidersHorizontal,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { name: "Overview", href: "/admin/overview", icon: LayoutDashboard },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Students", href: "/admin/students", icon: GraduationCap },
      { name: "Faculty", href: "/admin/faculty", icon: Users },
      { name: "Manage Faculty", href: "/admin/manage-faculty", icon: UserCog },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Questions", href: "/admin/questions", icon: ClipboardList },
      { name: "Companies", href: "/admin/companies", icon: Building2 },
    ],
  },
  {
    label: "Analytics",
    items: [
      { name: "Engagement", href: "/admin/analytics/engagement", icon: Activity },
      { name: "Doubts Intel", href: "/admin/analytics/doubts", icon: MessageSquare },
      { name: "Practice Zone", href: "/admin/analytics/practice", icon: Dumbbell },
      { name: "Placement", href: "/admin/analytics/placement", icon: Briefcase },
    ],
  },
  {
    label: "Activity",
    items: [
      { name: "Leaderboard", href: "/admin/leaderboard", icon: Trophy },
      { name: "Slot Bookings", href: "/admin/bookings", icon: BookCopy },
      { name: "Calendar", href: "/admin/calendar", icon: Calendar },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
      { name: "Reports", href: "/admin/reports", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Feature Controls", href: "/admin/features", icon: SlidersHorizontal },
    ],
  },
];

export function SidebarContent() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/overview"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-full w-full flex-col bg-white overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
          NST
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight text-gray-900">PlacePrep</h1>
          <p className="text-[10px] font-medium text-gray-400">Admin Portal</p>
        </div>
      </div>

      {/* Admin Info */}
      <div className="mx-3 mt-3 mb-2 flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 shrink-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          AD
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-gray-900">Admin User</p>
          <p className="truncate text-[10px] text-gray-400">Super Admin</p>
        </div>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 px-3 pb-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 flex-shrink-0 ${
                        active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-3 shrink-0">
        <Link
          href="/admin/help"
          className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            pathname === "/help"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <HelpCircle className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
          Help
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="w-full group flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
          Logout
        </button>
        <p className="px-3 pt-2 text-[10px] text-gray-300">NST Interview Intelligence</p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <div className="hidden border-r border-gray-100 lg:fixed lg:inset-y-0 lg:flex lg:w-[var(--sidebar-width)] lg:flex-col z-50">
      <SidebarContent />
    </div>
  );
}
