import type { NextConfig } from "next";

/**
 * Admin Portal Next.js config.
 * - externalDir: required to import from placeprep-backend (monorepo sibling)
 *
 * LOCAL DEV: Runs on port 3002. Routes served at root path (/).
 * PRODUCTION: Proxied by student portal rewrites at /admin/*.
 *   The rewrite strips /admin from the path, so admin portal still
 *   serves its own routes at root — no basePath needed.
 */

const nextConfig: NextConfig = {
  transpilePackages: ["placeprep-backend"],
  // ── Security headers (Admin = highest-value target) ──────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },                    // hard anti-clickjack
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Cache-Control", value: "no-store, max-age=0" },       // never cache admin pages/data…
        ],
      },
      {
        // …EXCEPT immutable content-hashed build output (safe + fast)
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
