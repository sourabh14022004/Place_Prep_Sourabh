"use client";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { NavbarProvider, useNavbar } from "@/lib/navbar-context";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/hooks";

function AppShell({ children }: { children: React.ReactNode }) {
  // Sidebar collapse state lives in the provider; main content margin follows it.
  const { isSidebarCollapsed } = useNavbar();
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      <main
        className={`min-h-screen pt-14 transition-all duration-200 ${
          isSidebarCollapsed ? "lg:ml-[64px]" : "lg:ml-[224px]"
        }`}
      >
        <div className="px-4 lg:px-6 py-6">{children}</div>
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading, error, mutate } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profile && profile.onboardingComplete === false) {
      router.push("/onboarding/step1");
    }
  }, [profile, isLoading, router]);

  // This gate blocks the entire portal on a single request, so it needs an
  // error branch — without one a failed /api/user/me left every page showing
  // the spinner forever with no way back.
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Couldn&apos;t load your profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {error instanceof Error ? error.message : "Something went wrong."}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => mutate()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100:bg-slate-800 transition-colors"
            >
              Sign in again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || (profile && profile.onboardingComplete === false)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <NavbarProvider>
      <AppShell>{children}</AppShell>
    </NavbarProvider>
  );
}
