"use client";

/**
 * dashboard/student-portal/lib/swr-provider.tsx
 * Global SWR defaults for the whole student portal.
 *
 * Why this exists: without a global config every hook fell back to SWR's stock
 * behaviour — unbounded exponential retries and a full cache-miss on every key
 * change. Two consequences users actually felt:
 *   1. A failing endpoint retried forever, so a page never settled into an
 *      error state it could render.
 *   2. Any key change (filter, page, tab) blanked `data` to undefined, so pages
 *      dropped back to their full-page skeleton instead of showing stale rows.
 *
 * keepPreviousData is the single highest-impact default here: paginated and
 * filtered views keep rendering the previous result while the next one loads.
 */

import { SWRConfig } from "swr";

/** Stop retrying after this many consecutive failures so pages can show an error. */
const MAX_RETRY_COUNT = 3;

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        keepPreviousData: true,
        errorRetryCount: MAX_RETRY_COUNT,
        errorRetryInterval: 3_000,
        revalidateOnFocus: false,
        revalidateIfStale: true,
        shouldRetryOnError: (err: unknown) => {
          // 4xx are deterministic — retrying an auth or validation failure just
          // keeps the page in a loading state. Only retry network/5xx classes.
          const msg = err instanceof Error ? err.message : "";
          return !/unauthorized|forbidden|not found|invalid/i.test(msg);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
