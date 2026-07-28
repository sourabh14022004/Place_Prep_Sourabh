"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  useEffect(() => {
    window.location.href = "http://localhost:3000/login";
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-['Inter']">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-gray-600">Redirecting to Central PlacePrep Login...</p>
    </div>
  );
}
