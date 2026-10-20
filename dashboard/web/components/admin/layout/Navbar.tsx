"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bell, Settings, HelpCircle } from "lucide-react";
import { SidebarContent } from "./Sidebar";

const pageTitles: Record<string, string> = {
  "/overview": "Overview",
  "/students": "Students",
  "/faculty": "Faculty Performance",
  "/manage-faculty": "Manage Faculty",
  "/analytics/engagement": "Engagement Analytics",
  "/analytics/doubts": "Doubts Intelligence",
  "/analytics/practice": "Practice Analytics",
  "/analytics/placement": "Placement Tracker",
  "/leaderboard": "Leaderboard",
  "/bookings": "Slot Bookings",
  "/notifications": "Notifications",
  "/help": "Help",
};

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const title = pageTitles[pathname] || "Admin Portal";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-50 gap-2 lg:gap-0">
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo container (matches student portal positioning) */}
        <Link
          href="/admin/overview"
          className="flex items-center gap-2.5 shrink-0 lg:w-[224px] group focus:outline-none"
        >
          <div className="bg-gradient-to-br from-blue-700 to-indigo-600 rounded-lg px-2 py-1 text-white font-bold text-xs shadow-xs transition-transform duration-200 group-hover:scale-105">
            NST
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm tracking-tight block leading-tight">
              Place<span className="text-blue-600">Prep</span>
            </span>
            <p className="text-[10px] font-medium text-gray-400 leading-none">Admin Portal</p>
          </div>
        </Link>

        {/* Page title */}
        <h1 className="text-base font-semibold text-gray-900 lg:text-lg flex-1 lg:pl-4">{title}</h1>

        {/* Right actions */}
        <div className="flex items-center gap-1 ml-auto">
          <Link
            href="/admin/notifications"
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </Link>
          <Link
            href="/admin/help"
            className="hidden sm:flex p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-[260px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex h-14 items-center justify-between px-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-blue-700 to-indigo-600 rounded-lg px-2 py-1 text-white font-bold text-xs shadow-xs">
                  NST
                </div>
                <div>
                  <span className="font-bold text-gray-900 text-sm tracking-tight block leading-tight">
                    Place<span className="text-blue-600">Prep</span>
                  </span>
                  <p className="text-[10px] font-medium text-gray-400 leading-none">Admin Portal</p>
                </div>
              </div>
              <button
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
