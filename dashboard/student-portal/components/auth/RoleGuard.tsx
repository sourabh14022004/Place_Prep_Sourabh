"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { extractUserRole, getPortalUrl, PortalRole } from "@/lib/role";

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
      const loginUrl = getPortalUrl("student", "/login");
      window.location.href = loginUrl.startsWith("http") ? loginUrl : "http://localhost:3000/login";
      return;
    }

    const detectedRole = extractUserRole(
      user.publicMetadata,
      user.unsafeMetadata,
      user.primaryEmailAddress?.emailAddress
    );

    if (detectedRole !== allowedRole) {
      let targetPath = "/dashboard";
      if (detectedRole === "faculty") targetPath = "/";
      if (detectedRole === "admin") targetPath = "/overview";

      const redirectUrl = getPortalUrl(detectedRole, targetPath);
      window.location.href = redirectUrl;
    } else {
      setAuthorized(true);
    }
  }, [isLoaded, isSignedIn, user, allowedRole]);

  if (!isLoaded || !authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-['Inter']">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">Verifying portal access rights...</p>
      </div>
    );
  }

  return <>{children}</>;
}
