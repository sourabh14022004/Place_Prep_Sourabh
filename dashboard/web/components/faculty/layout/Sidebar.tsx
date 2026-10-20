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
  TrendingUp,
  Route,
} from "lucide-react";
import { useFeatures } from "@/lib/faculty/use-features";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  feature?: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { name: "Dashboard", href: "/faculty", icon: LayoutDashboard },
    ],
  },
  {
    label: "Mentorship",
    items: [
      { name: "Session Requests", href: "/faculty/requests", icon: CalendarDays, feature: "faculty.sessions" },
      { name: "Doubts & Questions", href: "/faculty/doubts", icon: MessageCircle, feature: "faculty.doubts" },
    ],
  },
  {
    label: "Student Insights",
    items: [
      { name: "Student Matrix", href: "/faculty/students", icon: LayoutList, feature: "faculty.students" },
      { name: "Leaderboard", href: "/faculty/leaderboard", icon: Trophy, feature: "faculty.leaderboard" },
      { name: "Company Rankings", href: "/faculty/rankings", icon: Building2, feature: "faculty.rankings" },
    ],
  },
  {
    label: "Curriculum & Trends",
    items: [
      { name: "Custom Roadmaps", href: "/faculty/custom-roadmaps", icon: Route },
      { name: "Curriculum Gap", href: "/faculty/curriculum", icon: BookOpen, feature: "faculty.curriculum" },
      { name: "Industry Trends", href: "/faculty/trends", icon: TrendingUp, feature: "faculty.trends" },
    ],
  },
  {
    label: "Reports",
    items: [
      { name: "Export Reports", href: "/faculty/reports", icon: Send, feature: "faculty.reports" },
    ],
  },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isEnabled, isLoading } = useFeatures();

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
    href === "/faculty"
      ? pathname === "/faculty"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navGroups.map((group, groupIdx) => {
          // Filter items by feature toggle
          const visibleItems = group.items.filter(
            (item) => !item.feature || isLoading || isEnabled(item.feature)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div
              key={group.label ?? `group-${groupIdx}`}
              className={groupIdx > 0 ? "pt-3 mt-2 border-t border-gray-100" : ""}
            >
              {group.label && (
                <p className="px-3 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onNavigate}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
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
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-100 p-3 shrink-0 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <div className="w-4 h-4 shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            <LogOut className="w-4 h-4 text-red-600" />
          </div>
          Logout
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden border-r border-gray-200 lg:fixed lg:top-14 lg:bottom-0 lg:flex lg:w-[224px] lg:flex-col z-40 bg-white">
      <SidebarContent />
    </aside>
  );
}
