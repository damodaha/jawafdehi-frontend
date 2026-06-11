import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { CaseworkUser } from "@/types/casework";
import { getMe, login as apiLogin, logout as apiLogout, isLoggedIn } from "@/services/casework-api";

interface AuthState {
  user: CaseworkUser | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const CaseworkAuthContext = createContext<AuthContextValue | null>(null);

export function CaseworkAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });

  const fetchUser = useCallback(async () => {
    if (!isLoggedIn()) {
      setState({ user: null, loading: false, error: null });
      return;
    }
    try {
      const user = await getMe();
      setState({ user, loading: false, error: null });
    } catch {
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (username: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      await apiLogin(username, password);
      await fetchUser();
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: string } } };
      const msg =
        e.response?.status === 403
          ? "Your account does not have the Contributor role required for the review system."
          : e.response?.data?.detail ?? "Login failed. Check your credentials.";
      setState((s) => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }
  };

  const logout = () => {
    apiLogout();
    setState({ user: null, loading: false, error: null });
  };

  return (
    <CaseworkAuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isAdmin: !!state.user?.is_admin,
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
