"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Bell,
  User,
  Megaphone,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { SidebarContent } from "./Sidebar";

export default function Navbar() {
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [targetGroup, setTargetGroup] = useState("All Students");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handlePublishBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementBody.trim()) return;

    setBroadcastModalOpen(false);
    setToastMessage(`Broadcast published successfully to ${targetGroup}!`);
    setAnnouncementTitle("");
    setAnnouncementBody("");
    setIsHighPriority(false);

    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

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
          <span className="text-xs text-blue-600 font-semibold hidden md:inline-block">
            | Faculty
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Broadcast Announcement Action */}
          <button
            onClick={() => setBroadcastModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
            title="Broadcast Announcement to Cohort"
          >
            <Megaphone className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Broadcast Notice</span>
          </button>

          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 shrink-0"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </Link>

          <Link
            href="/profile"
            aria-label="Profile"
            className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 shrink-0 overflow-hidden"
          >
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName ?? "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4.5 h-4.5" />
            )}
          </Link>
        </div>
      </header>

      {/* Broadcast Announcement Modal */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Broadcast Announcement
                  </h3>
                  <p className="text-xs text-gray-500">
                    Push live notice to student dashboards
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Audience
                </label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="All Students">
                    All NST Students (Batch 2023–2027)
                  </option>
                  <option value="Batch 2023-2027 (CS)">
                    Batch 2023-2027 (CS)
                  </option>
                  <option value="Batch 2024-2028 (CS-AI)">
                    Batch 2024-2028 (CS-AI)
                  </option>
                  <option value="My Mentored Students">
                    My Mentored Students Only
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Notice Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Special System Design Mock Drive this Saturday"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Message Content
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide instructions, timings, or study links..."
                  value={announcementBody}
                  onChange={(e) => setAnnouncementBody(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="highPriority"
                  checked={isHighPriority}
                  onChange={(e) => setIsHighPriority(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label
                  htmlFor="highPriority"
                  className="text-xs font-medium text-gray-700 flex items-center gap-1 cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  Mark as Urgent Priority (Banner Notice)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold border border-gray-700 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {toastMessage}
        </div>
      )}

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
