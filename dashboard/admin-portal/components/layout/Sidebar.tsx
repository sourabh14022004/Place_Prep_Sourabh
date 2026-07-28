"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard, Users, GraduationCap, UserCog,
  Bell, HelpCircle, Calendar, FileText, LogOut,
  Activity, MessageSquare, Dumbbell, Briefcase,
  Trophy, BookCopy,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { name: "Overview", href: "/overview", icon: LayoutDashboard },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Students", href: "/students", icon: GraduationCap },
      { name: "Faculty", href: "/faculty", icon: Users },
      { name: "Manage Faculty", href: "/manage-faculty", icon: UserCog },
    ],
  },
  {
    label: "Analytics",
    items: [
      { name: "Engagement", href: "/analytics/engagement", icon: Activity },
      { name: "Doubts Intel", href: "/analytics/doubts", icon: MessageSquare },
      { name: "Practice Zone", href: "/analytics/practice", icon: Dumbbell },
      { name: "Placement", href: "/analytics/placement", icon: Briefcase },
    ],
  },
  {
    label: "Activity",
    items: [
      { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { name: "Slot Bookings", href: "/bookings", icon: BookCopy },
      { name: "Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Reports", href: "/reports", icon: FileText },
    ],
  },
];

export function SidebarContent() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user: clerkUser, isLoaded } = useUser();

  const realName = isLoaded && clerkUser ? (clerkUser.fullName || clerkUser.firstName || "Admin User") : "Admin User";
  const realEmail = isLoaded && clerkUser ? (clerkUser.primaryEmailAddress?.emailAddress || "admin@nst.edu") : "admin@nst.edu";
  const realImage = isLoaded && clerkUser ? clerkUser.imageUrl : undefined;
  const initials = isLoaded && clerkUser && clerkUser.firstName ? `${clerkUser.firstName[0]}${clerkUser.lastName?.[0] || ""}`.toUpperCase() : "AD";

  const handleLogout = async () => {
    document.cookie = "admin_authed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {}
    try {
      if (signOut) {
        await signOut({ redirectUrl: "/login" });
      }
    } catch {}
    window.location.href = "/login";
  };

  return (
    <div className="flex h-full w-full flex-col bg-white pt-3">
      {/* Admin User Info pill */}
      <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 shrink-0">
        {realImage ? (
          <img src={realImage} alt={realName} className="h-7 w-7 rounded-full object-cover shrink-0" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-[10px] font-bold text-white">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-gray-900">{realName}</p>
          <p className="truncate text-[10px] text-gray-400 font-medium">{realEmail}</p>
        </div>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 px-3 pb-2 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-3 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/overview" && pathname.startsWith(item.href + "/"));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 p-3 shrink-0 space-y-0.5">
        <Link
          href="/help"
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            pathname === "/help"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0 text-gray-400" />
          Help
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0 text-gray-400" />
          Logout
        </button>
        <div className="pt-2.5 mt-1 border-t border-gray-100 flex items-center gap-2 px-3">
          <img src="/newton-school-logo.png" alt="NST Logo" className="h-6 w-6 object-contain shrink-0" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            PlacePrep
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden border-r border-gray-200 lg:fixed lg:top-14 lg:bottom-0 lg:flex lg:w-[216px] lg:flex-col z-40 bg-white">
      <SidebarContent />
    </aside>
  );
}
