/**
 * app/manifest.ts
 * PWA web app manifest — served at /manifest.webmanifest by Next automatically.
 * Lets students "Add to Home Screen" with proper branding (free-tier friendly).
 */

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PlacePrep — NST Interview Intelligence Portal",
    short_name: "PlacePrep",
    description:
      "Structured, data-driven interview preparation for NST students: company-specific roadmaps, real questions, progress analytics.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f9fafb", // gray-50 — matches app shell
    theme_color: "#1d4ed8",      // blue-700 — brand
    orientation: "portrait-primary",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
