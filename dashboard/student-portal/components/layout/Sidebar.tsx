"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
 House, Building2, TrendingUp, Trophy, Send,
 MessageCircle, CalendarDays, Map, Dumbbell, LogOut,
 PanelLeftClose, PanelLeftOpen,
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
     await fetch('/api/auth/logout', { method: 'POST' });
   } catch (e) {
     console.error('Logout failed', e);
   } finally {
     window.location.href = '/login';
   }
 };

 const isActive = (href: string) =>
  pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

 const collapsed = isSidebarCollapsed;

 const linkClass = (active: boolean) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
   active
    ? "bg-blue-50 text-blue-700"
    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  } ${collapsed ? "justify-center px-0" : ""}`;

 return (
  <>
   {/* Mobile overlay */}
   {isMobileMenuOpen && (
    <div
     className="fixed inset-0 bg-black/20 z-30 lg:hidden"
     onClick={() => setMobileMenuOpen(false)}
    />
   )}

   <aside className={`fixed left-0 top-14 bottom-0 bg-white border-r border-gray-200 flex flex-col z-40 transition-all duration-200 ${
    collapsed ? "w-[64px]" : "w-[224px]"
   } ${
    isMobileMenuOpen ? "translate-x-0 w-[224px]" : "-translate-x-full lg:translate-x-0"
   }`}>
    <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
     {/* Main Nav */}
     <div className="space-y-1">
      {visibleNav.map(({ icon: Icon, label, href }) => (
       <Link
        key={href}
        href={href}
        title={collapsed ? label : undefined}
        className={linkClass(isActive(href))}
       >
        <Icon className={`w-4 h-4 shrink-0 ${isActive(href) ? "text-blue-600" : "text-gray-400"}`} />
        {!collapsed && label}
       </Link>
      ))}
     </div>

     {/* Faculty Connect Section — hidden entirely when admin disables it */}
     {visibleConnect.length > 0 && (
      <div className="mt-6 pt-4 border-t border-gray-100">
       <p className={`px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${collapsed ? "hidden" : ""}`}>
        Faculty Connect
       </p>
       <div className="space-y-1">
        {visibleConnect.map(({ icon: Icon, label, href }) => (
         <Link
          key={href}
          href={href}
          title={collapsed ? label : undefined}
          className={`${linkClass(isActive(href))} ${isActive(href) ? "!bg-indigo-50 !text-indigo-600" : ""}`}
         >
          <Icon className={`w-4 h-4 shrink-0 ${isActive(href) ? "text-indigo-500" : "text-gray-400"}`} />
          {!collapsed && label}
         </Link>
        ))}
       </div>
      </div>
     )}
    </nav>

    <div className={`border-t border-gray-100 p-3 ${collapsed ? "px-2" : ""}`}>
     {/* Collapse toggle — desktop only */}
     <button
      onClick={() => setSidebarCollapsed(!collapsed)}
      className="hidden lg:flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors mb-1"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
     >
      {collapsed ? <PanelLeftOpen className="w-4 h-4 shrink-0" /> : <PanelLeftClose className="w-4 h-4 shrink-0" />}
      {!collapsed && "Collapse"}
     </button>

     {notificationsOn && (
      <button
       onClick={() => router.push("/notifications")}
       className="lg:hidden flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors mb-1"
      >
       Notifications
      </button>
     )}

     <button
      onClick={handleLogout}
      className={`flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ${collapsed ? "justify-center px-0" : ""}`}
      title={collapsed ? "Logout" : undefined}
     >
      <LogOut className="w-4 h-4 shrink-0" />
      {!collapsed && "Logout"}
     </button>
    </div>
   </aside>
  </>
 );
}
