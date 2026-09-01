"use client";

import { useEffect } from "react";

/**
 * Client-safe page titles.
 *
 * Next.js metadata exports only work in server components, but every page in
 * this portal is a client component ("use client") — so titles are set via
 * this effect instead. The root layout's <title> template keeps branding
 * consistent for anything that doesn't call this.
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · PlacePrep` : "PlacePrep — NST Interview Intelligence Portal";
  }, [title]);
}
