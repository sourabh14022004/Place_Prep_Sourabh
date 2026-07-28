"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House, Building2, TrendingUp, Trophy, Send,
  MessageCircle, CalendarDays, Map, Dumbbell,
  LogOut, User,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

import { useNavbar } from "@/lib/navbar-context";

const navItems = [
  { icon: House,     label: "Home",               href: "/dashboard" },
  { icon: Building2, label: "Companies",          href: "/companies" },
  { icon: Map,       label: "My Roadmap",         href: "/roadmap" },
  { icon: Dumbbell,  label: "Practice",           href: "/practice" },
  { icon: TrendingUp,label: "My Progress",        href: "/progress" },
  { icon: Trophy,    label: "Leaderboard",        href: "/leaderboard" },
  { icon: Send,      label: "Experience",         href: "/submit" },
];

const connectItems = [
  { icon: MessageCircle, label: "Ask a Doubt",   href: "/doubts" },
  { icon: CalendarDays,  label: "Book a Session", href: "/sessions" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isMobileMenuOpen, setMobileMenuOpen } = useNavbar();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    document.cookie = "student_authed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "has_onboarded=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <aside className={`fixed left-0 top-14 bottom-0 w-[216px] bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-200 ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {/* Main Nav */}
          <div className="space-y-0.5">
            {navItems.map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(href)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>

          {/* Faculty Connect Section */}
          <div className="mt-5">
            <p className="px-3 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Faculty Connect
            </p>
            <div className="space-y-0.5">
              {connectItems.map(({ icon: Icon, label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive(href)
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 p-3 space-y-0.5 shrink-0">
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive("/profile")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <User className="w-4 h-4 shrink-0 text-gray-400" />
            My Profile
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-red-500" />
            Logout
          </button>
          <div className="pt-2.5 mt-1 border-t border-gray-100 flex items-center gap-2 px-3">
            <img src="/newton-school-logo.png" alt="NST Logo" className="h-6 w-6 object-contain shrink-0" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              PlacePrep
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
