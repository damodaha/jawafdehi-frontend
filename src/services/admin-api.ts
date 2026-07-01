// Admin panel API client.
//
// Unlike the legacy clients (api.ts -> nes.jawafdehi.org, jds-api.ts ->
// portal.jawafdehi.org), the admin panel talks to the CONSOLIDATED monolith on
// ONE host under a SINGLE unified `/api` root — the former per-service prefixes
// (`/api/nes`, `/api/ngm`) were hard-cut. Each resource lives at its own path:
//
//     /api/entities...     NES entities (JSON-LD read/write + reindex)
//     /api/courtcases...   NGM court cases (composite-key read/write)
//     /api/courts, /api/firms, /api/materials   NGM governance data
//     /api/cases, /api/sources   Jawafdehi cases / document sources
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
  const { data } = await client.get<NesEntityListResponse>("/api/entities", {
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
    `/api/entities/${encodeRef(ref)}`,
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
  const { data } = await client.post<NesEntity>("/api/entities", payload);
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

// EDIT is an RFC-6902 patch: PATCH /api/entities/{ref} with { patch_ops }.
export async function patchNesEntity(
  ref: string,
  patchOps: PatchOp[],
  changeDescription?: string,
): Promise<NesEntity> {
  const { data } = await client.patch<NesEntity>(
    `/api/entities/${encodeRef(ref)}`,
    { patch_ops: patchOps, change_description: changeDescription },
  );
  return data;
}

export async function getNesEntityVersions(ref: string): Promise<{
  versions: unknown[];
  total: number;
}> {
  const { data } = await client.get(
    `/api/entities/${encodeRef(ref)}/versions`,
  );
  return data;
}

export async function listNesEntityPrefixes(): Promise<{ prefixes: string[] }> {
  const { data } = await client.get("/api/entity_prefixes");
  return data;
}

// Trigger an OpenSearch reindex (admin only). Returns whatever the job emits.
export async function reindexNes(): Promise<unknown> {
  const { data } = await client.post("/api/admin/reindex", {});
  return data;
}

// Soft-delete an entity (backend flips it to removed; returns 204 No Content).
export async function deleteNesEntity(ref: string): Promise<void> {
  await client.delete(`/api/entities/${encodeRef(ref)}`);
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
  const { data } = await client.get<Paginated<T>>("/api/courtcases/", { params });
  return data;
}

export async function listCourts<T = Record<string, unknown>>(): Promise<Paginated<T>> {
  const { data } = await client.get<Paginated<T>>("/api/courts/");
  return data;
}

export async function listBlacklistedFirms<T = Record<string, unknown>>(): Promise<
  Paginated<T>
> {
  const { data } = await client.get<Paginated<T>>("/api/firms/");
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
    `/api/courtcases/${encodeURIComponent(court)}/${encodeURIComponent(caseNumber)}`,
  );
  return data;
}

export async function createCourtCase<T = Record<string, unknown>>(
  payload: CourtCaseWrite,
): Promise<T> {
  const { data } = await client.post<T>("/api/courtcases/", payload);
  return data;
}

export async function updateCourtCase<T = Record<string, unknown>>(
  court: string,
  caseNumber: string,
  payload: Partial<CourtCaseWrite>,
): Promise<T> {
  const { data } = await client.patch<T>(
    `/api/courtcases/${encodeURIComponent(court)}/${encodeURIComponent(caseNumber)}`,
    payload,
  );
  return data;
}

// Soft-delete a court case by its composite key (backend returns 204).
export async function deleteCourtCase(
  court: string,
  caseNumber: string,
): Promise<void> {
  await client.delete(
    `/api/courtcases/${encodeURIComponent(court)}/${encodeURIComponent(caseNumber)}`,
  );
}

// List materials (paginated). The materials list is NGM/DRF-shaped {results,
// next}; `count`/`previous` may be absent, so ResourceTable tolerates undefined.
export async function listMaterials<T = Record<string, unknown>>(
  params: Record<string, unknown> = {},
): Promise<Paginated<T>> {
  // Trailing slash required: the backend list endpoint is GET /api/materials/
  // (no ?iri= param). Without the slash the route 404s.
  const { data } = await client.get<Paginated<T>>("/api/materials/", { params });
  return data;
}

// Resolve a material's JSON-LD by its full @id IRI (public read).
export async function getMaterialByIri<T = Record<string, unknown>>(
  iri: string,
): Promise<T> {
  const { data } = await client.get<T>("/api/materials/", {
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
    `/api/materials/${source}/${encodeURIComponent(ident)}`,
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
  const { data } = await client.post<T>("/api/materials/", body);
  return data;
}

export async function replaceMaterial<T = Record<string, unknown>>(
  source: string,
  ident: string,
  jsonld: Record<string, unknown>,
): Promise<T> {
  const { data } = await client.put<T>(
    `/api/materials/${encodeURIComponent(source)}/${encodeURIComponent(ident)}`,
    jsonld,
  );
  return data;
}

// Soft-delete a material by its <source>/<ident> path components (204).
export async function deleteMaterial(
  source: string,
  ident: string,
): Promise<void> {
  await client.delete(
    `/api/materials/${encodeURIComponent(source)}/${encodeURIComponent(ident)}`,
  );
}

// ---------------------------------------------------------------------------
// Jawafdehi — corruption cases (DISTINCT from NGM court cases) + sources.
// Full CRUD: cases are keyed by slug, updated via RFC-6902 PATCH; sources are
// keyed by numeric id and created via multipart (optional file upload).
// ---------------------------------------------------------------------------

export async function listCases<T = Record<string, unknown>>(
  params: Record<string, unknown> = {},
): Promise<Paginated<T>> {
  const { data } = await client.get<Paginated<T>>("/api/cases/", { params });
  return data;
}

export async function getCase<T = Record<string, unknown>>(
  slug: string,
): Promise<T> {
  const { data } = await client.get<T>(`/api/cases/${encodeURIComponent(slug)}/`);
  return data;
}

// CREATE a corruption case. The backend accepts the case authoring fields
// (title, case_type, state, …); we keep it loosely typed so the form owns the
// exact shape while callers still get a typed result back.
export async function createCase<T = Record<string, unknown>>(
  payload: Record<string, unknown>,
): Promise<T> {
  const { data } = await client.post<T>("/api/cases/", payload);
  return data;
}

// UPDATE is an RFC-6902 patch (mirrors the NES entity contract): the body is a
// bare array of patch ops.
export async function patchCase<T = Record<string, unknown>>(
  slug: string,
  patchOps: PatchOp[],
): Promise<T> {
  const { data } = await client.patch<T>(
    `/api/cases/${encodeURIComponent(slug)}/`,
    patchOps,
  );
  return data;
}

// Soft-delete a case (backend flips state -> CLOSED, returns 204).
export async function deleteCase(slug: string): Promise<void> {
  await client.delete(`/api/cases/${encodeURIComponent(slug)}/`);
}

export async function listSources<T = Record<string, unknown>>(
  params: Record<string, unknown> = {},
): Promise<Paginated<T>> {
  const { data } = await client.get<Paginated<T>>("/api/sources/", { params });
  return data;
}

export async function getSource<T = Record<string, unknown>>(
  id: number | string,
): Promise<T> {
  const { data } = await client.get<T>(`/api/sources/${id}/`);
  return data;
}

// Build the multipart body for a source create/update. Scalar fields ride as
// form fields; `urls` (link-role dicts) is JSON-encoded; an optional File is
// attached under `file`. Kept a standalone helper so it's unit-testable without
// the network (the FormData shape is the load-bearing contract).
export interface SourceWriteFields {
  title: string;
  description?: string;
  source_type?: string | null;
  urls?: { link: string; role: string }[] | null;
  [k: string]: unknown;
}

export function buildSourceFormData(
  fields: SourceWriteFields,
  file?: File | null,
): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v == null || v === "") continue;
    if (k === "urls") {
      fd.append("urls", JSON.stringify(v));
    } else if (Array.isArray(v) || typeof v === "object") {
      fd.append(k, JSON.stringify(v));
    } else {
      fd.append(k, String(v));
    }
  }
  if (file) fd.append("file", file);
  return fd;
}

// CREATE a document source. Multipart so an optional file can be uploaded
// alongside the metadata. axios sets the multipart boundary from the FormData.
export async function createSource<T = Record<string, unknown>>(
  fields: SourceWriteFields,
  file?: File | null,
): Promise<T> {
  const { data } = await client.post<T>(
    "/api/sources/",
    buildSourceFormData(fields, file),
  );
  return data;
}

// UPDATE a source. Also multipart (a replacement file may be attached). Uses
// PATCH so partial field updates don't wipe unspecified fields.
export async function updateSource<T = Record<string, unknown>>(
  id: number | string,
  fields: SourceWriteFields,
  file?: File | null,
): Promise<T> {
  const { data } = await client.patch<T>(
    `/api/sources/${id}/`,
    buildSourceFormData(fields, file),
  );
  return data;
}

// Soft-delete a source (204).
export async function deleteSource(id: number | string): Promise<void> {
  await client.delete(`/api/sources/${id}/`);
}

export { client as adminClient };
