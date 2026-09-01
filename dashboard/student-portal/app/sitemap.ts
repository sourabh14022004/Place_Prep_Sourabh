/**
 * app/sitemap.ts
 * Only the genuinely public routes — everything else is behind auth and
 * blocked via robots.ts.
 */

import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || "https://nst-prep-portal-by-pranay-student-p.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];
}
