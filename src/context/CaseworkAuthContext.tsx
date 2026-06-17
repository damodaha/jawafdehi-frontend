import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "react-oidc-context";
import type { CaseworkUser } from "@/types/casework";
import { getUserManager } from "@/services/oidc";

interface AuthContextValue {
  user: CaseworkUser | null;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  isAdmin: boolean;
}

const CaseworkAuthContext = createContext<AuthContextValue | null>(null);

// Build the portal user straight from the Zitadel token claims. `roles` is the
// flattened project-roles array (Zitadel role keys, lowercase); the API remains
// the authorization authority — this is only for the header / UI gating.
function toCaseworkUser(
  profile: Record<string, unknown> | undefined,
): CaseworkUser | null {
  if (!profile) return null;
  const roles = Array.isArray(profile.roles)
    ? (profile.roles as unknown[]).filter(
        (r): r is string => typeof r === "string",
      )
    : [];
  const username =
    (profile.email as string) ||
    (profile.preferred_username as string) ||
    (profile.name as string) ||
    "";
  return { username, roles, is_admin: roles.includes("admin") };
}

export function CaseworkAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  const user = useMemo(
    () => (auth.isAuthenticated ? toCaseworkUser(auth.user?.profile) : null),
    [auth.isAuthenticated, auth.user?.profile],
  );

  const login = () => {
    auth.signinRedirect({
      state: window.location.pathname + window.location.search,
    });
  };

  const logout = () => {
    getUserManager().signoutRedirect();
  };

  return (
    <CaseworkAuthContext.Provider
      value={{
        user,
        loading: auth.isLoading,
        error: auth.error?.message ?? null,
        login,
        logout,
        isAdmin: !!user?.is_admin,
      }}
    >
      {children}
    </CaseworkAuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCaseworkAuth() {
  const ctx = useContext(CaseworkAuthContext);
  if (!ctx) throw new Error("useCaseworkAuth must be used inside CaseworkAuthProvider");
  return ctx;
}
