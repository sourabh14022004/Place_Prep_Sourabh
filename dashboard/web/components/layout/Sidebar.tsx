"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  House, Building2, TrendingUp, Trophy, Send,
  MessageCircle, CalendarDays, Map, Dumbbell, LogOut,
  PanelLeftClose, PanelLeftOpen, X, Bell,
} from "lucide-react";

import { useNavbar } from "@/lib/navbar-context";
import { useFeatures } from "@/lib/features";

const navItems = [
  { icon: House,     label: "Home",               href: "/dashboard" },
  { icon: Building2, label: "Companies",          href: "/companies",  feature: "student.companies" },
  { icon: Map,       label: "My Roadmap",         href: "/roadmap",    feature: "student.roadmap" },
  { icon: Dumbbell,  label: "Practice",           href: "/practice",   feature: "student.practice" },
  { icon: TrendingUp,label: "My Progress",        href: "/progress",   feature: "student.progress" },
  { icon: Trophy,    label: "Leaderboard",        href: "/leaderboard",feature: "student.leaderboard" },
  { icon: Send,      label: "Experience",         href: "/submit",     feature: "student.experience" },
];

const connectItems = [
  { icon: MessageCircle, label: "Ask a Doubt",   href: "/doubts",      feature: "student.doubts" },
  { icon: CalendarDays,  label: "Book a Session", href: "/sessions",   feature: "student.sessions" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileMenuOpen, setMobileMenuOpen, isSidebarCollapsed, setSidebarCollapsed } = useNavbar();
  const { isEnabled, isLoading: featuresLoading } = useFeatures();

  // Faculty Connect master switch — when off, the whole section disappears.
  const facultyConnectOn = featuresLoading || isEnabled("student.faculty_connect");
  const notificationsOn = featuresLoading || isEnabled("student.notifications");

  const visibleNav = navItems.filter((item) => !item.feature || isEnabled(item.feature));
  const visibleConnect = facultyConnectOn
    ? connectItems.filter((item) => !item.feature || isEnabled(item.feature))
    : [];

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
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const collapsed = isSidebarCollapsed;

  const getLinkClasses = (active: boolean) => {
    const base = "flex items-center text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";
    if (collapsed) {
      // On desktop collapsed: neat centered 40x40 icon button
      // On mobile: full width drawer link with label
      return `${base} lg:w-10 lg:h-10 lg:mx-auto lg:justify-center lg:px-0 lg:py-0 w-full gap-3 px-3 py-2.5 rounded-xl ${
        active
          ? "bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-100/80"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`;
    }
    return `${base} w-full gap-3 px-3 py-2.5 rounded-xl ${
      active
        ? "bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-100/80"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 lg:top-14 bottom-0 bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-200 w-[260px] ${
          collapsed ? "lg:w-[68px]" : "lg:w-[224px]"
        } ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Mobile-only drawer header with close button */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 lg:hidden shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-700 to-indigo-600 rounded-lg px-2 py-1 text-white font-bold text-xs">
              NST
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">
              Place<span className="text-blue-600">Prep</span>
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 ${collapsed ? "lg:px-2 px-3" : "px-3"}`}>
          {visibleNav.map(({ icon: Icon, label, href }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={getLinkClasses(active)}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    active ? "text-blue-600" : "text-gray-400"
                  }`}
                />
                <span className={collapsed ? "lg:hidden truncate" : "truncate"}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Faculty Connect Section */}
          {visibleConnect.length > 0 && (
            <div className="mt-5 pt-3 border-t border-gray-100">
              <p
                className={`px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${
                  collapsed ? "lg:hidden block" : "block"
                }`}
              >
                Faculty Connect
              </p>
              <div className="space-y-1">
                {visibleConnect.map(({ icon: Icon, label, href }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={collapsed ? label : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${getLinkClasses(active)} ${
                        active ? "!bg-indigo-50 !text-indigo-600 !ring-indigo-100/80" : ""
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active ? "text-indigo-600" : "text-gray-400"
                        }`}
                      />
                      <span className={collapsed ? "lg:hidden truncate" : "truncate"}>
                        {label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Footer actions */}
        <div className={`border-t border-gray-100 py-3 ${collapsed ? "lg:px-2 px-3" : "px-3"} space-y-1`}>
          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setSidebarCollapsed(!collapsed)}
            className={`hidden lg:flex items-center rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              collapsed
                ? "w-10 h-10 mx-auto justify-center"
                : "w-full gap-3 px-3 py-2 text-left"
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 shrink-0" />
                <span className="truncate">Collapse</span>
              </>
            )}
          </button>

          {/* Mobile notifications button */}
          {notificationsOn && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/notifications");
              }}
              className="lg:hidden flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-4 h-4 shrink-0 text-gray-400" />
              <span className="truncate">Notifications</span>
            </button>
          )}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
              collapsed
                ? "lg:w-10 lg:h-10 lg:mx-auto lg:justify-center w-full gap-3 px-3 py-2.5 text-left"
                : "w-full gap-3 px-3 py-2.5 text-left"
            }`}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={collapsed ? "lg:hidden truncate" : "truncate"}>
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
