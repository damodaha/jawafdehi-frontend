import React, { createContext, useContext, useEffect, useCallback } from "react";
import { useAuth } from "react-oidc-context";
import type { CaseworkUser } from "@/types/casework";
import { getMe } from "@/services/casework-api";
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

export function CaseworkAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [user, setUser] = React.useState<CaseworkUser | null>(null);
  const [userLoading, setUserLoading] = React.useState(false);
  const [userError, setUserError] = React.useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!auth.isAuthenticated) {
      setUser(null);
      setUserLoading(false);
      setUserError(null);
      return;
    }

    setUserLoading(true);
    try {
      const caseworkUser = await getMe();
      setUser(caseworkUser);
      setUserLoading(false);
      setUserError(null);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: string } } };
      const msg =
        e.response?.status === 403
          ? "Your account does not have the Contributor role required for the review system."
          : e.response?.data?.detail ?? "Failed to load user profile.";
      setUser(null);
      setUserLoading(false);
      setUserError(msg);
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = () => {
    auth.signinRedirect();
  };

  const logout = () => {
    getUserManager().signoutRedirect();
  };

  return (
    <CaseworkAuthContext.Provider
      value={{
        user,
        loading: auth.isLoading || userLoading,
        error: userError,
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
