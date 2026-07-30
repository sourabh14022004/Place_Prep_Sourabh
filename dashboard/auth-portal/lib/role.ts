export type PortalRole = "student" | "faculty" | "admin";

export function extractUserRole(
  publicMetadata?: Record<string, any> | null,
  unsafeMetadata?: Record<string, any> | null,
  email?: string | null
): PortalRole {
  const roleFromMeta = (publicMetadata?.role || unsafeMetadata?.role) as string | undefined;
  if (roleFromMeta && ["student", "faculty", "admin"].includes(roleFromMeta.toLowerCase())) {
    return roleFromMeta.toLowerCase() as PortalRole;
  }
  const cleanEmail = (email || "").toLowerCase();
  if (cleanEmail.includes("faculty")) return "faculty";
  if (cleanEmail.includes("admin")) return "admin";
  return "student";
}

export function getPortalUrl(role: PortalRole, path: string = ""): string {
  if (typeof window === "undefined") return path;

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (isLocal) {
    const ports: Record<PortalRole, string> = {
      student: "3000",
      faculty: "3001",
      admin: "3002",
    };
    return `http://localhost:${ports[role]}${cleanPath}`;
  }

  // Production — read from env vars with fallback defaults
  const bases: Record<PortalRole, string> = {
    student:
      process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL ||
      "https://place-prep-sourabh.vercel.app",
    faculty:
      process.env.NEXT_PUBLIC_FACULTY_PORTAL_URL ||
      "https://place-prep-faculty-portal-gkw93ncxs-sourabh14022004s-projects.vercel.app",
    admin:
      process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL ||
      "https://place-prep-admin-portal-okbo5332j-sourabh14022004s-projects.vercel.app",
  };

  const base = bases[role];
  return `${base.replace(/\/$/, "")}${cleanPath}`;
}
