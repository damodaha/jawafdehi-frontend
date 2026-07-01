// DEV-ONLY username/password auth for the /admin SPA.
//
// Production is OIDC/Zitadel only. When VITE_DEV_AUTH is set at build/dev time
// (and the backend has DEV_AUTH on), the login screen offers a username/password
// form that opens a Django SESSION via /api/casework/auth/dev-login/ — the SAME
// credentials as the Django admin. With the flag unset, none of this is reachable
// and the SPA is SSO-only.
//
// Session auth (cookie) is used instead of a bearer token: the backend accepts
// SessionAuthentication under DEV_AUTH. We keep a small snapshot of the signed-in
// user (and the CSRF token) in localStorage so a page reload stays logged in
// without a token, and so admin-api.ts can attach X-CSRFToken to writes.
import axios from "axios";
import { ADMIN_API_BASE_URL } from "./admin-api";
import type { CaseworkUser } from "@/types/casework";

export const DEV_AUTH_ENABLED = import.meta.env.VITE_DEV_AUTH === "true";

const STORAGE_KEY = "jawafdehi.devAuth.user";
const CSRF_KEY = "jawafdehi.devAuth.csrf";

// A dedicated axios instance that sends the session cookie. `withCredentials`
// makes the browser include the sessionid cookie on cross-origin XHR (the FE
// dev server and the API may be on different ports); same-origin it's a no-op.
const devClient = axios.create({
  baseURL: ADMIN_API_BASE_URL,
  withCredentials: true,
});

export interface DevAuthUser extends CaseworkUser {
  csrftoken?: string;
}

export function getStoredDevUser(): CaseworkUser | null {
  if (!DEV_AUTH_ENABLED || typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CaseworkUser;
  } catch {
    return null;
  }
}

export function getStoredCsrf(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CSRF_KEY);
}

function store(user: CaseworkUser, csrf?: string) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  if (csrf) window.localStorage.setItem(CSRF_KEY, csrf);
}

function clearStored() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(CSRF_KEY);
}

export async function devLogin(
  username: string,
  password: string,
): Promise<CaseworkUser> {
  const { data } = await devClient.post<DevAuthUser>(
    "/api/casework/auth/dev-login/",
    { username, password },
  );
  const { csrftoken, ...user } = data;
  store(user, csrftoken);
  return user;
}

export async function devLogout(): Promise<void> {
  try {
    await devClient.post("/api/casework/auth/dev-logout/", null, {
      headers: getStoredCsrf() ? { "X-CSRFToken": getStoredCsrf()! } : {},
    });
  } finally {
    clearStored();
  }
}
