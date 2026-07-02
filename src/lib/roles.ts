// Role helpers for the admin panel UI gate. The API is always the authorization
// authority — these checks only decide which controls/pages the UI offers, so a
// role-less user isn't dropped into a panel that 403s on every call.
//
// Role strings arrive from OIDC claims or the dev-login payload in mixed case;
// every check here is case-insensitive.

// Roles that may enter the admin panel at all (the panel-level gate).
export const ADMIN_ROLES = [
  "admin",
  "moderator",
  "caseworker",
  "contributor",
  "readonly",
] as const;

// Roles allowed to perform privileged casework actions (state transitions, the
// moderation queue, regrade-all).
export const MODERATOR_ROLES = ["admin", "moderator"] as const;

function normalize(roles: readonly string[] | undefined): string[] {
  return (roles ?? []).map((r) => r.toLowerCase());
}

function hasAny(roles: readonly string[] | undefined, allowed: readonly string[]): boolean {
  const lower = normalize(roles);
  return allowed.some((r) => lower.includes(r));
}

// May the user open the admin panel at all?
export function hasAdminAccess(roles: readonly string[] | undefined): boolean {
  return hasAny(roles, ADMIN_ROLES);
}

// Does the user hold admin OR moderator (privileged-action gate)?
export function isModerator(roles: readonly string[] | undefined): boolean {
  return hasAny(roles, MODERATOR_ROLES);
}

// Is the user specifically an admin?
export function isAdmin(roles: readonly string[] | undefined): boolean {
  return normalize(roles).includes("admin");
}
