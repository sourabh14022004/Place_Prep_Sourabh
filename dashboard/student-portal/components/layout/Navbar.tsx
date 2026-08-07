"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Zap, Search, X, Building2, Tag, Menu } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { searchAll, type SearchResult } from "@/lib/mock-data";
import { useNavbar } from "@/lib/navbar-context";


// Unread notification count — reads from sessionStorage
function useUnreadCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    // BACKEND TODO: GET /api/notifications/unread-count
    setTimeout(() => {
      const lastRead = sessionStorage.getItem("notifications_last_read");
      if (!lastRead) {
        setCount(3); // 3 unread by default for new users
      } else {
        setCount(0);
      }
    }, 0);
  }, []);
  return count;
}

import { fetchStudentProfile } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { isMobileMenuOpen, setMobileMenuOpen } = useNavbar();
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const unreadCount = useUnreadCount();

  const [liveXp, setLiveXp] = useState<number>(2450);

  useEffect(() => {
    async function loadLiveXp() {
      if (user?.id || user?.primaryEmailAddress?.emailAddress) {
        const profile = await fetchStudentProfile(user.id, user.primaryEmailAddress?.emailAddress);
        if (profile && typeof profile.xp === "number") {
          setLiveXp(profile.xp);
        }
      }
    }
    loadLiveXp();
  }, [user]);

  const xp = liveXp;

  // Derive results directly from query — no useEffect needed
  const results = useMemo(() => searchAll(query), [query]);
  const open = results.length > 0 && query.trim().length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSelectedIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = selectedIdx >= 0 ? results[selectedIdx] : results[0];
        if (target) {
          router.push(target.href);
          setQuery("");
          setSelectedIdx(-1);
        }
      } else if (e.key === "Escape") {
        setQuery("");
        setSelectedIdx(-1);
        inputRef.current?.blur();
      }
    },
    [open, results, selectedIdx, router]
  );

  const handleSelect = (r: SearchResult) => {
    router.push(r.href);
    setQuery("");
    setSelectedIdx(-1);
  };
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-50 gap-2 lg:gap-0">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-100 rounded-md lg:hidden"
        aria-label="Toggle Sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>
      
      {/* Logo */}
      <div className="flex items-center gap-2 lg:w-[216px] shrink-0">
        <img src="/newton-school-logo.png" alt="NST Logo" className="h-7 w-7 object-contain shrink-0" />
        <span className="font-bold text-gray-900 text-sm hidden sm:inline-block">PlacePrep</span>
      </div>

      {/* Search — global command palette (only on dashboard) */}
      <div className="flex-1 flex justify-center px-4" ref={wrapperRef}>
        {pathname === "/dashboard" && (
          <div className="relative w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIdx(-1); }}
                onKeyDown={handleKeyDown}
                placeholder="Search company, topic, or question..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                aria-label="Global search"
                aria-autocomplete="list"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setSelectedIdx(-1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {open && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                {results.map((r, idx) => (
                  <button
                    key={`${r.type}-${r.label}`}
                    onClick={() => handleSelect(r)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                      idx === selectedIdx ? "bg-blue-50" : ""
                    }`}
                  >
                    {r.type === "company" ? (
                      <div className={`w-7 h-7 ${r.color} rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {r.initial}
                      </div>
                    ) : (
                      <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        {r.type === "topic" ? (
                          <Tag className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{r.label}</div>
                      <div className="text-xs text-gray-500 truncate">{r.subtitle}</div>
                    </div>
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-gray-400 shrink-0">
                      {r.type}
                    </span>
                  </button>
                ))}
                <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1">
                  <kbd className="font-mono bg-gray-100 rounded px-1">↑↓</kbd> navigate &nbsp;
                  <kbd className="font-mono bg-gray-100 rounded px-1">↵</kbd> open &nbsp;
                  <kbd className="font-mono bg-gray-100 rounded px-1">esc</kbd> close
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3.5 ml-auto">
        {/* XP Badge */}
        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 hover:bg-amber-100 transition-colors cursor-default shrink-0">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold text-amber-700">{xp.toLocaleString()}</span>
          <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide">XP</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 shrink-0" />

        {/* Notification Bell */}
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 shrink-0"
          onClick={() => sessionStorage.setItem("notifications_last_read", new Date().toISOString())}
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Avatar — links to /profile page */}
        <Link
          href="/profile"
          aria-label="Profile"
          className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-blue-400 transition-all flex items-center justify-center shrink-0"
          title="View Profile"
        >
          {user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.imageUrl}
              alt={user.fullName ?? "Profile"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
              {user?.firstName?.[0] ?? "U"}
            </div>
          )}
        </Link>


        {/* Clerk User Button — hidden visually but provides sign-out + account management */}
        <div className="hidden">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
