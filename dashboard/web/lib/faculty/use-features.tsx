"use client";

import useSWR from "swr";
import Link from "next/link";
import { ShieldOff, RefreshCw, LayoutDashboard } from "lucide-react";

export type FeatureMap = Record<string, boolean>;

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

/** Client-side mirror of the admin Feature Controls for the faculty portal. */
export function useFeatures() {
  const { data, error, isLoading, mutate } = useSWR<FeatureMap>("/api/faculty/features", fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60_000,
    dedupingInterval: 15_000,
  });

  const isEnabled = (key: string) => (data?.[key] ?? true) === true;

  return { features: data, isLoading, error, mutate, isEnabled };
}

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  title?: string;
}

/** Renders a "disabled by administrator" screen instead of the page content. */
export function FeatureGate({ feature, children, title = "This section" }: FeatureGateProps) {
  const { isDisabled } = useFeaturesState(feature);
  if (!isDisabled) return <>{children}</>;

  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-5">
        <ShieldOff className="w-7 h-7 text-red-500" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">{title} is currently unavailable</h1>
      <p className="text-sm text-gray-500 mb-6">
        An administrator has temporarily disabled this feature of the Faculty Portal.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" /> Back to Dashboard
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Recheck
        </button>
      </div>
    </div>
  );
}

// Small indirection so FeatureGate only blocks when data has loaded (fail-open).
function useFeaturesState(_feature: string) {
  const { isEnabled, isLoading, features } = useFeatures();
  const known = features != null;
  const isDisabled = !isLoading && known && !isEnabled(_feature);
  return { isDisabled };
}
