import { describe, it, expect } from "vitest";
import { hasAdminAccess, isModerator, isAdmin } from "./roles";

describe("roles helpers", () => {
  it("hasAdminAccess: true for any admin-panel role, case-insensitive", () => {
    expect(hasAdminAccess(["Caseworker"])).toBe(true);
    expect(hasAdminAccess(["READONLY"])).toBe(true);
    expect(hasAdminAccess(["contributor"])).toBe(true);
    expect(hasAdminAccess(["admin"])).toBe(true);
    expect(hasAdminAccess(["moderator"])).toBe(true);
  });

  it("hasAdminAccess: false for unknown roles or none", () => {
    expect(hasAdminAccess(["viewer"])).toBe(false);
    expect(hasAdminAccess([])).toBe(false);
    expect(hasAdminAccess(undefined)).toBe(false);
  });

  it("isModerator: only admin or moderator", () => {
    expect(isModerator(["Admin"])).toBe(true);
    expect(isModerator(["MODERATOR"])).toBe(true);
    expect(isModerator(["caseworker"])).toBe(false);
    expect(isModerator(["readonly"])).toBe(false);
    expect(isModerator(undefined)).toBe(false);
  });

  it("isAdmin: only admin", () => {
    expect(isAdmin(["admin"])).toBe(true);
    expect(isAdmin(["ADMIN", "moderator"])).toBe(true);
    expect(isAdmin(["moderator"])).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});
