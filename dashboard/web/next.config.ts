import type { NextConfig } from "next";

/**
 * Merged PlacePrep web app (student + faculty + admin on one origin).
 *
 * The three portals previously ran as separate Next deployments, and this file
 * carried rewrites proxying /faculty/* and /admin/* to the other two. Those
 * sections are now real route segments in this app, so the rewrites are gone —
 * the URLs they used to produce are unchanged.
 *
 * The API is a separate Express server (backend/). /api/* is rewritten to it
 * rather than being fetched cross-origin, so the browser still sees a single
 * origin: cookies stay same-origin, no CORS, and not one frontend fetch call
 * had to change — they were all already relative /api/... paths.
 */
const API_URL = process.env.API_URL || "http://localhost:4000";

const nextConfig: NextConfig = {
  // The web app no longer imports backend *logic* — that all moved to the
  // Express server. It still imports pure shared domain constants (e.g.
  // constants/roles), which carry no mongoose or framework dependency.
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["placeprep-backend"],
  // ── Security headers ─────────────────────────────────────────────────
  // Baseline hardening applied to every response. HSTS is handled by the host.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },                    // clickjacking protection
          { key: "X-Content-Type-Options", value: "nosniff" },           // MIME sniffing
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
    ];
  },
};

export default nextConfig;
