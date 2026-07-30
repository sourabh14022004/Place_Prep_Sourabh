export type PortalRole = "student" | "faculty" | "admin";

/**
 * Extracts the user's portal role from Clerk metadata or email pattern.
 * Priority: publicMetadata.role > unsafeMetadata.role > email pattern > "student"
 */
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
