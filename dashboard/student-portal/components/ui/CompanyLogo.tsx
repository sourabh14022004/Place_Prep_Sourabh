"use client";
import React, { useState } from "react";

interface CompanyLogoProps {
  logoUrl?: string;
  slug?: string;
  name?: string;
  className?: string;
  size?: number;
}

export function getCleanDomain(slug: string = "", name: string = ""): string {
  let raw = (slug || name).toLowerCase().trim();
  raw = raw
    .replace(/-(alltime|1year|2year|3year|4year|5year|6months|six-months|months|\d+year|\d+month)$/i, "")
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9]/g, "");

  return raw ? `${raw}.com` : "";
}

const BRAND_COLORS = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-purple-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
];

export default function CompanyLogo({
  logoUrl,
  slug = "",
  name = "Company",
  className = "w-10 h-10 rounded-lg",
}: CompanyLogoProps) {
  const cleanDomain = getCleanDomain(slug, name);

  // Generate fallback sources in priority order
  const sources: string[] = [];
  if (logoUrl && logoUrl.trim() && !logoUrl.includes("example.com")) {
    sources.push(logoUrl.trim());
  }
  sources.push(`https://www.google.com/s2/favicons?sz=128&domain=${cleanDomain}`);
  sources.push(`https://logo.clearbit.com/${cleanDomain}`);

  const [srcIndex, setSrcIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  const handleError = () => {
    if (srcIndex + 1 < sources.length) {
      setSrcIndex(srcIndex + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  const displayName = name || slug || "C";
  const initial = displayName.replace(/[^a-zA-Z]/g, "").charAt(0).toUpperCase() || "C";

  // Pick deterministic color based on name
  let colorIndex = 0;
  for (let i = 0; i < displayName.length; i++) {
    colorIndex += displayName.charCodeAt(i);
  }
  const bgClass = BRAND_COLORS[colorIndex % BRAND_COLORS.length];

  if (hasFailedAll) {
    return (
      <div
        className={`${className} ${bgClass} text-white font-bold flex items-center justify-center shrink-0 shadow-xs select-none`}
      >
        <span className="text-base leading-none">{initial}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[srcIndex]}
      alt={name}
      onError={handleError}
      className={`${className} shrink-0 object-contain bg-white border border-gray-100 p-1 shadow-xs`}
    />
  );
}
