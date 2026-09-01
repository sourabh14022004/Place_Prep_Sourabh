"use client";

import Link from "next/link";
import { ShieldOff, RefreshCw } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/hooks";

export type FeatureMap = Record<string, boolean>;

/**
 * Central client-side feature-flag store.
 * Backed by GET /api/features which mirrors the admin-controlled
 * `feature_flags` collection. Fail-open: unknown keys are treated as enabled.
 */
export function useFeatures() {
  const { data, error, isLoading, mutate } = useSWR<FeatureMap>("/api/features", fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60_000, // admin toggles propagate within ~60s without a reload
    dedupingInterval: 15_000,
  });

  const isEnabled = (key: string) => (data?.[key] ?? true) === true;

  return {
    features: data ?? null,
    isLoading,
    error,
    mutate,
    isEnabled,
    isDisabled: (key: string) => !isLoading && data != null && data[key] === false,
  };
}

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  /** Page title shown when disabled */
  title?: string;
}

/**
 * Wrap a page with this to enforce an admin feature toggle.
 * Renders a friendly "disabled" screen instead of the page content when the
 * admin has switched the feature off — including on direct URL access.
 */
export function FeatureGate({ feature, children, title = "This section" }: FeatureGateProps) {
  const { isDisabled, isLoading } = useFeatures();

  if (isLoading) return null; // brief flash-free render while flags load
  if (!isDisabled(feature)) return <>{children}</>;

  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-5">
        <ShieldOff className="w-7 h-7 text-red-500" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">{title} is currently unavailable</h1>
      <p className="text-sm text-gray-500 mb-6">
        An administrator has temporarily disabled this feature. If you believe this is a mistake,
        please reach out to your placement coordinator.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Recheck
        </button>
      </div>
    </div>
  );
}
