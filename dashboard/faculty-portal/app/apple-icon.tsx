/**
 * app/apple-icon.tsx — generated at build time (Faculty Portal).
 */
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #312e81, #4f46e5 100%)",
          borderRadius: 36,
          color: "#ffffff",
          fontWeight: 800,
          fontSize: 56,
          letterSpacing: 2,
        }}
      >
        NST
        <div style={{ width: 84, height: 9, borderRadius: 5, background: "rgba(255,255,255,0.85)", marginTop: 10 }} />
      </div>
    ),
    size
  );
}
