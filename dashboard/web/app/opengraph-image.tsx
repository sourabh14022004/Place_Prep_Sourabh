/**
 * app/opengraph-image.tsx
 * Social share card (WhatsApp/LinkedIn/Slack/Twitter), generated at build time.
 * 1200×630 per the Open Graph spec.
 */

import { ImageResponse } from "next/og";

export const alt = "PlacePrep — NST Interview Intelligence Portal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #4f46e5 100%)",
          color: "#ffffff",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "rgba(255,255,255,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: 1,
            }}
          >
            NST
          </div>
          <div style={{ fontSize: 30, opacity: 0.92, fontWeight: 600 }}>PlacePrep</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.15 }}>Crack your placement,</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.15 }}>the structured way.</div>
        </div>
        <div style={{ fontSize: 30, opacity: 0.85, marginTop: 28, maxWidth: 860 }}>
          Company-specific roadmaps · real interview questions · progress analytics — built exclusively for NST students.
        </div>
      </div>
    ),
    size
  );
}
