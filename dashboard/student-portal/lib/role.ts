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

  if (host === "localhost" || host === "127.0.0.1") {
    if (role === "student" && currentPort !== "3000") return `http://${host}:3000${path}`;
    if (role === "faculty" && currentPort !== "3001") return `http://${host}:3001${path}`;
    if (role === "admin" && currentPort !== "3002") return `http://${host}:3002${path}`;
  }
  return path;
}
