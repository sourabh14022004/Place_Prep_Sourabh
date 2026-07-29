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
  const host = window.location.hostname;
  const currentPort = window.location.port;
  const isLocal = host === "localhost" || host === "127.0.0.1";

  const studentBase = process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || (isLocal ? "http://localhost:3000" : "");
  const facultyBase = process.env.NEXT_PUBLIC_FACULTY_PORTAL_URL || (isLocal ? "http://localhost:3001" : "");
  const adminBase = process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || (isLocal ? "http://localhost:3002" : "");

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (role === "student") {
    if (isLocal && currentPort === "3000") return path;
    if (studentBase) return `${studentBase.replace(/\/$/, "")}${cleanPath}`;
  }
  if (role === "faculty") {
    if (isLocal && currentPort === "3001") return path;
    if (facultyBase) return `${facultyBase.replace(/\/$/, "")}${cleanPath}`;
  }
  if (role === "admin") {
    if (isLocal && currentPort === "3002") return path;
    if (adminBase) return `${adminBase.replace(/\/$/, "")}${cleanPath}`;
  }

  return path;
}
