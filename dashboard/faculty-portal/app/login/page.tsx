"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function FacultyLoginPage() {
  useEffect(() => {
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const authBase = isLocal
      ? "http://localhost:3003"
      : (process.env.NEXT_PUBLIC_AUTH_PORTAL_URL || "");
    window.location.href = authBase ? `${authBase.replace(/\/$/, "")}/login` : "/";
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-['Inter']">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-gray-600">Redirecting to PlacePrep Login...</p>
    </div>
  );
}
