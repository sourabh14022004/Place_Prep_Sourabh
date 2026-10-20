ar
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, UserCog,
  Bell, HelpCircle, Calendar, FileText, LogOut,
  Activity, MessageSquare, Dumbbell, Briefcase,
  Trophy, BookCopy, ClipboardList, Building2,
  SlidersHorizontal, Route } from "lucide-react";

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
      { name: "Custom Roadmaps", href: "/admin/custom-roadmaps", icon: Route },
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

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      window.location.href = "/login";
    }
  };

  const isActive = (href: string) =>
    href === "/admin/overview"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Grouped Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navGroups.map((group, groupIdx) => (
          <div
            key={group.label}
            className={groupIdx > 0 ? "pt-3 mt-2 border-t border-gray-100" : ""}
          >
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      active
                        ? "bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-100/80 shadow-2xs"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                      <item.icon
                        className={`w-4 h-4 transition-colors ${
                          active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      />
                    </div>
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-100 p-3 shrink-0 space-y-1">
        <Link
          href="/admin/help"
          onClick={onNavigate}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            pathname === "/admin/help"
              ? "bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-100/80 shadow-2xs"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <div className="w-4 h-4 shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </div>
          <span className="truncate">Help</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <div className="w-4 h-4 shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            <LogOut className="w-4 h-4 text-red-600" />
          </div>
          Logout
        </button>
        <p className="px-3 pt-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          NST Interview Intelligence
        </p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden border-r border-gray-200 lg:fixed lg:top-14 lg:bottom-0 lg:flex lg:w-[224px] lg:flex-col z-40 bg-white">
      <SidebarContent />
    </aside>
  );
}
