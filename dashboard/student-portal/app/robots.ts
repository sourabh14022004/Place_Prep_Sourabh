/**
 * app/robots.ts
 * The landing page is public marketing surface → indexable.
 * Everything behind auth (app group + APIs) must stay out of search engines.
 */

import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || "https://nst-prep-portal-by-pranay-student-p.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register"],
        disallow: ["/api/", "/dashboard", "/companies", "/roadmap", "/practice",
                   "/progress", "/leaderboard", "/submit", "/doubts", "/sessions",
                   "/messages", "/notifications", "/profile", "/onboarding"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
