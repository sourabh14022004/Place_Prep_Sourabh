"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { extractUserRole, PortalRole } from "@/lib/role";

interface RoleGuardProps {
  allowedRole: PortalRole;
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const authBase = isLocal
        ? "http://localhost:3003"
        : (process.env.NEXT_PUBLIC_AUTH_PORTAL_URL || "");
      const redirectBack = encodeURIComponent(window.location.href);
      window.location.href = authBase
        ? `${authBase.replace(/\/$/, "")}/login?redirect_url=${redirectBack}`
        : "/login";
      return;
    }

    const detectedRole = extractUserRole(
      user.publicMetadata,
      user.unsafeMetadata,
      user.primaryEmailAddress?.emailAddress
    );

    if (detectedRole !== allowedRole) {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const authBase = isLocal
        ? "http://localhost:3003"
        : (process.env.NEXT_PUBLIC_AUTH_PORTAL_URL || "");
      window.location.href = authBase ? `${authBase.replace(/\/$/, "")}/login` : "/login";
    } else {
      setAuthorized(true);
    }
  }, [isLoaded, isSignedIn, user, allowedRole]);

  if (!isLoaded || !authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-['Inter']">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">Verifying faculty access rights...</p>
      </div>
    );
  }

  return <>{children}</>;
}
