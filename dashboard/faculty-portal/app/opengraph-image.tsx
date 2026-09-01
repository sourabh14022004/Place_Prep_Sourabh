/**
 * app/opengraph-image.tsx — social share card (Faculty Portal).
 * Note: this app is auth-only and marked noindex; the card exists so shared
 * links still render a branded preview instead of a blank rectangle.
 */
import { ImageResponse } from "next/og";

export const alt = "PlacePrep — Faculty Portal";
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
          background: "linear-gradient(135deg, #312e81, #4f46e5 55%, #6366f1 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            background: "rgba(255,255,255,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 28,
          }}
          >
            NST
          </div>
          <div style={{ fontSize: 30, opacity: 0.92, fontWeight: 600 }}>PlacePrep</div>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1, marginTop: 44 }}>
          Faculty Portal
        </div>
        <div style={{ fontSize: 30, opacity: 0.85, marginTop: 28 }}>
          Internal access only — sign in to continue.
        </div>
      </div>
    ),
    size
  );
}
