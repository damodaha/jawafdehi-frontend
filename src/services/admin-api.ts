// Admin panel API client.
//
// Unlike the legacy clients (api.ts -> nes.jawafdehi.org, jds-api.ts ->
// portal.jawafdehi.org), the admin panel talks to the CONSOLIDATED monolith on
// ONE host, addressing each former service by its URL path prefix:
//
//     /api/nes/...   NES entities (JSON-LD read/write + reindex)
//     /api/ngm/...   NGM courts + materials (read plane + ingestion)
//     /api/...       Jawafdehi cases / sources / casework
//
// Auth is OIDC/Zitadel only (DRF token auth was dropped in the monolith): every
// request carries `Authorization: Bearer <access>` from the shared oidc.ts.
import axios, { type AxiosInstance } from "axios";
import { getAccessToken } from "./oidc";

// The monolith host. Defaults to the same origin so a deploy behind one domain
// "just works"; override for split local dev (e.g. http://localhost:48000).
export const ADMIN_API_BASE_URL =
  import.meta.env.VITE_ADMIN_API_BASE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

function makeClient(): AxiosInstance {
  const client = axios.create({ baseURL: ADMIN_API_BASE_URL });
  client.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return client;
}

const client = makeClient();

// Best-effort human message from an axios error: mirrors casework-api's helper
// (plain-string body, DRF { detail }, the monolith's { error: { message } },
// and field-error objects).
export function adminErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === "string") return d.detail;
    const errObj = d.error as { message?: string } | undefined;
    if (errObj && typeof errObj.message === "string") return errObj.message;
    for (const v of Object.values(d)) {
      if (typeof v === "string" && v.trim()) return v;
      if (Array.isArray(v) && typeof v[0] === "string") return v[0];
    }
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// NES — entities (JSON-LD documents keyed by @id IRI)
// ---------------------------------------------------------------------------

// A stored NES entity is a raw schema.org JSON-LD document; we only type the
// keys the admin list/detail views read. Everything else rides along in [k].
export interface NesEntity {
  "@id": string;
  "@type"?: string | string[];
  name?: string | { ne?: string; en?: string };
  [k: string]: unknown;
}

export interface NesEntityListResponse {
  entities: NesEntity[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListEntitiesParams {
  query?: string;
  entity_type?: string;
  entity_prefix?: string;
  keywords?: string;
  limit?: number;
  offset?: number;
}

export async function listNesEntities(
  params: ListEntitiesParams = {},
): Promise<NesEntityListResponse> {
  const { data } = await client.get<NesEntityListResponse>("/api/nes/entities", {
    params,
  });
  return data;
}

// Encode a `<prefix>/<slug>` ref for the detail routes. The backend's _REF
// route matches a path WITH literal slashes (it splits prefix/slug on the final
// "/"), so we must NOT percent-encode the separators — encode each segment but
// keep the slashes. (encodeURIComponent on the whole ref would turn "/" into
// "%2F", which Django/WSGI mishandles and the ref parser wouldn't split.)
function encodeRef(ref: string): string {
  return ref.split("/").map(encodeURIComponent).join("/");
}

// Detail by ref: a bare `<prefix>/<slug>` path or a url-encoded @id IRI.
export async function getNesEntity(ref: string): Promise<NesEntity> {
  const { data } = await client.get<NesEntity>(
    `/api/nes/entities/${encodeRef(ref)}`,
  );
  return data;
}

// CREATE accepts the backend "authoring shape": identity keys (prefix/slug/type)
// plus the bilingual name and any free-form schema.org / jawafdehi: properties,
// which are copied through verbatim. (A full JSON-LD doc with @id is also
// accepted by the backend, but the form always sends the authoring shape.)
export interface CreateEntityPayload {
  prefix: string;
  slug: string;
  type: string | string[];
  name: string | { ne?: string; en?: string };
  change_description?: string;
  // Free-form schema.org / jawafdehi: properties (description, sameAs, etc.).
  [k: string]: unknown;
}

export async function createNesEntity(
  payload: CreateEntityPayload,
): Promise<NesEntity> {
  const { data } = await client.post<NesEntity>("/api/nes/entities", payload);
  return data;
}

// An RFC-6902 JSON Patch operation. The backend rejects ops targeting the
// immutable paths /@id, /@type, /@context, /jawafdehi:version.
export interface PatchOp {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
}

// EDIT is an RFC-6902 patch: PATCH /api/nes/entities/{ref} with { patch_ops }.
export async function patchNesEntity(
  ref: string,
  patchOps: PatchOp[],
  changeDescription?: string,
): Promise<NesEntity> {
  const { data } = await client.patch<NesEntity>(
    `/api/nes/entities/${encodeRef(ref)}`,
    { patch_ops: patchOps, change_description: changeDescription },
  );
  return data;
}

export async function getNesEntityVersions(ref: string): Promise<{
  versions: unknown[];
  total: number;
}> {
  const { data } = await client.get(
    `/api/nes/entities/${encodeRef(ref)}/versions`,
  );
  return data;
}

export async function listNesEntityPrefixes(): Promise<{ prefixes: string[] }> {
  const { data } = await client.get("/api/nes/entity_prefixes");
  return data;
}

// Trigger an OpenSearch reindex (admin only). Returns whatever the job emits.
export async function reindexNes(): Promise<unknown> {
  const { data } = await client.post("/api/nes/admin/reindex", {});
  return data;
}

// ---------------------------------------------------------------------------
// NGM — courts + materials (read-mostly; ingestion is bulk)
// ---------------------------------------------------------------------------

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function listCourtCases<T = Record<string, unknown>>(
  params: Record<string, unknown> = {},
): Promise<Paginated<T>> {
  const { data } = await client.get<Paginated<T>>("/api/ngm/cases/", { params });
  return data;
}

export async function listCourts<T = Record<string, unknown>>(): Promise<Paginated<T>> {
  const { data } = await client.get<Paginated<T>>("/api/ngm/courts/");
  return data;
}

export async function listBlacklistedFirms<T = Record<string, unknown>>(): Promise<
  Paginated<T>
> {
  const { data } = await client.get<Paginated<T>>("/api/ngm/firms/");
  return data;
}

// --- NGM court-case write surface (HasNgmRole) -----------------------------
// Composite natural key is (court, case_number); create posts to the list root,
// update uses the composite path. `nes_id`, when set, must be a canonical NES
// entity @id IRI (backend returns 400 otherwise).
export interface CourtCaseWrite {
  case_number: string;
  court_identifier: string;
  registration_date_bs?: string | null;
  registration_date_ad?: string | null;
  case_type?: string | null;
  case_status?: string | null;
  plaintiff?: string | null;
  defendant?: string | null;
  nes_id?: string | null;
  extra_data?: Record<string, unknown> | null;
  document_sources?: unknown[] | null;
}

export async function getCourtCase<T = Record<string, unknown>>(
  court: string,
  caseNumber: string,
): Promise<T> {
  const { data } = await client.get<T>(
    `/api/ngm/cases/${encodeURIComponent(court)}/${encodeURIComponent(caseNumber)}`,
  );
  return data;
}

export async function createCourtCase<T = Record<string, unknown>>(
  payload: CourtCaseWrite,
): Promise<T> {
  const { data } = await client.post<T>("/api/ngm/cases/", payload);
  return data;
}

export async function updateCourtCase<T = Record<string, unknown>>(
  court: string,
  caseNumber: string,
  payload: Partial<CourtCaseWrite>,
): Promise<T> {
  const { data } = await client.patch<T>(
    `/api/ngm/cases/${encodeURIComponent(court)}/${encodeURIComponent(caseNumber)}`,
    payload,
  );
  return data;
}

// Resolve a material's JSON-LD by its full @id IRI (public read).
export async function getMaterialByIri<T = Record<string, unknown>>(
  iri: string,
): Promise<T> {
  const { data } = await client.get<T>("/api/ngm/materials/", {
    params: { iri },
  });
  return data;
}

// Resolve a material's JSON-LD by its IRI path components (public read). Avoids
// needing the canonical host base — used by the edit form, which routes on
// <source>/<ident>. `source` may be multi-segment, so it's not url-encoded.
export async function getMaterialByPath<T = Record<string, unknown>>(
  source: string,
  ident: string,
): Promise<T> {
  const { data } = await client.get<T>(
    `/api/ngm/materials/${source}/${encodeURIComponent(ident)}`,
  );
  return data;
}

// --- NGM material write surface (HasNgmRole) -------------------------------
// A material is a schema.org JSON-LD doc keyed by its @id IRI. Create upserts by
// @id; update replaces the doc at <source>/<ident> (the body @id must match).
export async function createMaterial<T = Record<string, unknown>>(
  jsonld: Record<string, unknown>,
  materialType?: string,
): Promise<T> {
  const body = materialType
    ? { material: jsonld, material_type: materialType }
    : jsonld;
  const { data } = await client.post<T>("/api/ngm/materials/", body);
  return data;
}

export async function replaceMaterial<T = Record<string, unknown>>(
  source: string,
  ident: string,
  jsonld: Record<string, unknown>,
): Promise<T> {
  const { data } = await client.put<T>(
    `/api/ngm/materials/${encodeURIComponent(source)}/${encodeURIComponent(ident)}`,
    jsonld,
  );
  return data;
}

// ---------------------------------------------------------------------------
// Jawafdehi — cases + sources (full CRUD lives here)
// ---------------------------------------------------------------------------

export async function listCases<T = Record<string, unknown>>(
  params: Record<string, unknown> = {},
): Promise<Paginated<T>> {
  const { data } = await client.get<Paginated<T>>("/api/cases/", { params });
  return data;
}

export async function listSources<T = Record<string, unknown>>(
  params: Record<string, unknown> = {},
): Promise<Paginated<T>> {
  const { data } = await client.get<Paginated<T>>("/api/sources/", { params });
  return data;
}

export { client as adminClient };
