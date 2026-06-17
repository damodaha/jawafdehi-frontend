// API client for the Casework Review System portal.
//
// Auth model: the casework review API (mounted at /api/casework/ on the
// jawafdehi-api) is gated by a Zitadel access token (RS256 JWT) plus the
// Contributor role. The SPA obtains the token via OIDC PKCE and sends it as
// `Authorization: Bearer <access>`.
import axios from "axios";
import type {
  CaseworkUser,
  ReviewListItem,
  ReviewDetail,
  CaseworkRule,
  ReviewConfig,
  Paginated,
} from "@/types/casework";
import { getAccessToken, getUserManager } from "./oidc";

const API_ROOT = import.meta.env.VITE_JDS_API_BASE_URL || "https://portal.jawafdehi.org/api";
const BASE_URL = `${API_ROOT}/casework`;

const client = axios.create({ baseURL: BASE_URL });

client.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (r) => r,
  async (error) => {
    const config = error.config ?? {};
    // On a 401, try a silent renew once. The _retry flag guards against
    // an infinite loop when the renewed token is itself rejected.
    if (error.response?.status === 401 && !config._retry) {
      config._retry = true;
      try {
        const um = getUserManager();
        await um.signinSilent();
        const token = await getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return client.request(config);
        }
      } catch {
        // Silent sign-in failed, redirect to login.
        await getUserManager().signinRedirect();
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
  // Defensively default each field so a malformed envelope can't crash callers
  // that iterate `results` (e.g. mergeReviews).
  return {
    count: data?.count ?? 0,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    results: data?.results ?? [],
  };
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
