import { describe, expect, it } from "vitest";
import { isAdmin, isSuperAdmin, assignableRoles, canManageUser, hasRole } from "../../src/lib/permissions";

describe("access guard", () => {
  it("isAdmin returns true for ADMIN and SUPER_ADMIN", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("SUPER_ADMIN")).toBe(true);
    expect(isAdmin("USER")).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it("isSuperAdmin only returns true for SUPER_ADMIN", () => {
    expect(isSuperAdmin("SUPER_ADMIN")).toBe(true);
    expect(isSuperAdmin("ADMIN")).toBe(false);
    expect(isSuperAdmin("USER")).toBe(false);
  });

  it("hasRole enforces allowed list", () => {
    expect(hasRole("SUPER_ADMIN", ["SUPER_ADMIN"])).toBe(true);
    expect(hasRole("ADMIN", ["SUPER_ADMIN"])).toBe(false);
  });

  it("assignableRoles restricts non-super-admin to USER", () => {
    expect(assignableRoles("SUPER_ADMIN")).toEqual(["USER", "ADMIN", "SUPER_ADMIN"]);
    expect(assignableRoles("ADMIN")).toEqual(["USER"]);
  });

  it("canManageUser allows SUPER_ADMIN to manage anyone", () => {
    expect(canManageUser("SUPER_ADMIN", "SUPER_ADMIN")).toBe(true);
    expect(canManageUser("SUPER_ADMIN", "ADMIN")).toBe(true);
    expect(canManageUser("SUPER_ADMIN", "USER")).toBe(true);
  });

  it("canManageUser prevents non-super-admin from managing admins", () => {
    expect(canManageUser("ADMIN", "ADMIN")).toBe(false);
    expect(canManageUser("ADMIN", "SUPER_ADMIN")).toBe(false);
    expect(canManageUser("ADMIN", "USER")).toBe(true);
  });
});
