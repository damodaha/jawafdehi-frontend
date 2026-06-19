// API client for the Casework Review System portal.
//
// Auth model: the casework review API (mounted at /api/casework/ on the
// jawafdehi-api) is gated by an OIDC access token (RS256 JWT) plus the
// Contributor role. The SPA obtains the token via OIDC PKCE and sends it as
// `Authorization: Bearer <access>`.
import axios from "axios";
import type {
  ReviewListItem,
  ReviewDetail,
  CaseworkRule,
  ReviewConfig,
  Paginated,
  GroupedCase,
} from "@/types/casework";
import { getAccessToken } from "./oidc";

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
  (error) => {
    // Surface the error to the caller. We deliberately do NOT auto-redirect to
    // re-auth on 401: silent renew uses an iframe Zitadel blocks, so redirecting
    // here caused an endless login loop. The route guard handles signed-out users.
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

// Reviews grouped by case, paginated BY CASE: each entry carries ALL of a
// case's executions (so older runs that would fall on a later page of the flat
// list still show under their case). Used by the review list page.
export async function listReviewsGrouped(params?: {
  page?: number;
  page_size?: number;
}): Promise<Paginated<GroupedCase>> {
  const { data } = await client.get<Paginated<GroupedCase> | GroupedCase[]>("/reviews/grouped/", {
    params,
  });
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
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
