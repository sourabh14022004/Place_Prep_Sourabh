"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Bell, HelpCircle } from "lucide-react";
import { SidebarContent } from "./Sidebar";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-50 gap-2 lg:gap-0">
        {/* Mobile hamburger */}
        <button
          className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-100 rounded-md lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo container matching Student Portal style */}
        <div className="flex items-center gap-2 lg:w-[216px] shrink-0">
          <img src="/newton-school-logo.png" alt="NST Logo" className="h-7 w-7 object-contain shrink-0" />
          <span className="font-bold text-gray-900 text-sm hidden sm:inline-block">
            PlacePrep
          </span>
          <span className="text-xs text-gray-900 font-semibold hidden md:inline-block">
            | Admin
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 shrink-0"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </Link>
          <Link
            href="/help"
            aria-label="Help"
            className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 shrink-0"
          >
            <HelpCircle className="w-4.5 h-4.5" />
          </Link>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-[216px] bg-white shadow-xl z-50 animate-in slide-in-from-left duration-200">
            <div className="absolute top-3 right-3 z-10">
              <button
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
