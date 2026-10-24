import type { Role } from "@prisma/client";

export const ADMIN_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN"];

export function isAdmin(role?: Role | string | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdmin(role?: Role | string | null): boolean {
  return role === "SUPER_ADMIN";
}

export function hasRole(role: Role | string | null | undefined, allowed: (Role | string)[]): boolean {
  if (!role) return false;
  return allowed.includes(role as any);
}

export function assignableRoles(actorRole?: Role | string | null): Role[] {
  if (isSuperAdmin(actorRole)) return ["USER", "ADMIN", "SUPER_ADMIN"];
  return ["USER"];
}

export function canManageUser(
  actorRole: Role | string | null | undefined,
  targetRole: Role | string,
): boolean {
  if (isSuperAdmin(actorRole)) return true;
  if (isAdmin(actorRole)) return !isAdmin(targetRole);
  return false;
}
