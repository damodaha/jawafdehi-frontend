// API client for the Casework Review System portal.
//
// Auth model: the casework review API (mounted at /api/casework/ on the
// jawafdehi-api) is gated by the shared jawafdehi JWT plus the Contributor
// role. Clients obtain a token pair from the existing SimpleJWT endpoint
// (/api/caseworker/auth/token/) and send `Authorization: Bearer <access>`.
//
// We deliberately reuse the same token-obtain/refresh endpoints as the
// caseworker portal, but keep SEPARATE localStorage keys (cwrk_*) so signing in
// to one portal does not silently sign you into the other.
import axios from "axios";
import type {
  CaseworkUser,
  ReviewListItem,
  ReviewDetail,
  CaseworkRule,
  ReviewConfig,
  Paginated,
} from "@/types/casework";

const API_ROOT = import.meta.env.VITE_JDS_API_BASE_URL || "https://portal.jawafdehi.org/api";
const BASE_URL = `${API_ROOT}/casework`;
// The shared SimpleJWT token endpoints live under /caseworker/auth/.
const TOKEN_BASE = `${API_ROOT}/caseworker/auth`;

const ACCESS_KEY = "cwrk_access_token";
const REFRESH_KEY = "cwrk_refresh_token";

const client = axios.create({ baseURL: BASE_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (r) => r,
  async (error) => {
    const config = error.config ?? {};
    // Refresh the access token on a 401 and retry ONCE. The _retry flag guards
    // against an infinite loop when the refreshed token is itself rejected
    // (deauthorized, role change, clock skew) and the retry 401s again.
    if (error.response?.status === 401 && !config._retry) {
      const refresh = localStorage.getItem(REFRESH_KEY);
      if (refresh) {
        config._retry = true;
        try {
          const { data } = await axios.post(`${TOKEN_BASE}/token/refresh/`, { refresh });
          localStorage.setItem(ACCESS_KEY, data.access);
          config.headers.Authorization = `Bearer ${data.access}`;
          return client.request(config);
        } catch {
          localStorage.removeItem(ACCESS_KEY);
          localStorage.removeItem(REFRESH_KEY);
          window.location.href = "/portal/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Best-effort human message from an axios error: handles a plain-string body,
// DRF's { detail: "..." }, and field-error objects ({ field: ["msg", ...] }).
export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === "string") return d.detail;
    // First field error (string or first item of a list).
    for (const v of Object.values(d)) {
      if (typeof v === "string" && v.trim()) return v;
      if (Array.isArray(v) && typeof v[0] === "string") return v[0];
    }
  }
  return fallback;
}

// ---- Auth ----

export async function login(username: string, password: string) {
  const { data } = await axios.post(`${TOKEN_BASE}/token/`, { username, password });
  localStorage.setItem(ACCESS_KEY, data.access);
  localStorage.setItem(REFRESH_KEY, data.refresh);
  return data;
}

export function logout() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isLoggedIn() {
  return !!localStorage.getItem(ACCESS_KEY);
}

export async function getMe(): Promise<CaseworkUser> {
  const { data } = await client.get("/auth/me/");
  return data;
}

// ---- Reviews ----

export interface SubmitReviewPayload {
  slug?: string;
  court_case_number?: string;
}

// A court case ref is "<court>:<case_number>" (e.g. "special:081-CR-0079"):
// lowercase-alnum court id, then a hyphen/alnum case number, no slashes/scheme.
const COURT_REF_RE = /^[a-z0-9]+:[A-Za-z0-9-]+$/;

// Classify free-text input from the submit box into the right field. A court
// case ref goes to `court_case_number`; everything else (a bare slug or a full
// case URL like https://jawafdehi.org/case/<slug>) goes to `slug`, which the
// backend normalizes (it extracts the slug from a URL).
export function buildSubmitPayload(raw: string): SubmitReviewPayload {
  const value = raw.trim();
  return COURT_REF_RE.test(value) ? { court_case_number: value } : { slug: value };
}

export async function listReviews(params?: {
  page?: number;
  page_size?: number;
}): Promise<Paginated<ReviewListItem>> {
  const { data } = await client.get<Paginated<ReviewListItem> | ReviewListItem[]>("/reviews/", {
    params,
  });
  // Tolerate a non-paginated (plain array) response during rollout.
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return data;
}

export async function getReview(id: number): Promise<ReviewDetail> {
  const { data } = await client.get<ReviewDetail>(`/reviews/${id}/`);
  return data;
}

export async function submitReview(payload: SubmitReviewPayload): Promise<ReviewDetail> {
  const { data } = await client.post<ReviewDetail>("/reviews/submit/", payload);
  return data;
}

export async function regradeAll(): Promise<{ regrading: number; review_ids: number[] }> {
  const { data } = await client.post("/reviews/regrade-all/");
  return data;
}

// ---- Rules (code-enforced, read-only) ----

export async function listRules(): Promise<CaseworkRule[]> {
  const { data } = await client.get<CaseworkRule[]>("/rules/");
  return data;
}

// ---- Config ----

export async function getConfig(): Promise<ReviewConfig> {
  const { data } = await client.get<ReviewConfig>("/config/");
  return data;
}

export async function updateConfig(payload: Partial<ReviewConfig>): Promise<ReviewConfig> {
  const { data } = await client.put<ReviewConfig>("/config/", payload);
  return data;
}
