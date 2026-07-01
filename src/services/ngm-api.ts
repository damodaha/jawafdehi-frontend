/**
 * NGM API Client (governance / judicial materials + court cases)
 *
 * NGM data lives on the Think-Big monolith under the SINGLE unified `/api` root
 * (the former per-service `/api/ngm` prefix was hard-cut). Reads are public —
 * materials and court cases are derived from public-domain government documents.
 *
 *   GET /api/materials/<source>/<ident>          -> material JSON-LD (schema.org)
 *   GET /api/courtcases/<court>/<case_number>/   -> court case (composite key)
 *   GET /api/courtcases/<court>/<case_number>/{hearings,entities,documents}
 *
 * Base URL defaults to the SAME-ORIGIN relative `/api` so the Vite dev proxy /
 * monolith ingress resolves it. An absolute override (VITE_NGM_API_BASE_URL) is
 * supported for split-host deployments. NOTE: keep the default RELATIVE — an
 * absolute prod default would make a containerized frontend bypass the proxy and
 * hit prod (the bug that crashed the home page during the search migration).
 */

import axios from 'axios';
import { JDSApiError } from './jds-api';
import type { CourtCase, CourtCaseHearing, CourtCaseEntity } from '@/types/jds';

const NGM_API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NGM_API_BASE_URL) ||
  '/api';

// A material @id IRI path component (`<source>/<ident>`) or a full IRI. The detail
// route is a splat, so the tail may already be the `<source>/<ident>` form.
const MATERIAL_MARKER = '/material/';

/** Same-origin material path tail (`<source>/<ident>`) from an IRI or bare tail. */
export function materialTail(iriOrTail: string): string {
  const i = iriOrTail.indexOf(MATERIAL_MARKER);
  return i === -1 ? iriOrTail : iriOrTail.slice(i + MATERIAL_MARKER.length);
}

/** Percent-encode each path segment of a tail, preserving the `/` separators. */
function encodeTail(tail: string): string {
  return tail.split("/").map(encodeURIComponent).join("/");
}

/**
 * A material is stored schema.org JSON-LD (bilingual language maps + a `jawafdehi:`
 * extension namespace), the same family as NES entities. We type only the spine and
 * keep an index signature for the type-specific long tail (rendered generically).
 */
export type MaterialBilingual = { en?: string | null; ne?: string | null };
export interface Material {
  '@id': string;
  '@type'?: string | string[];
  '@context'?: unknown;
  additionalType?: string;
  name?: MaterialBilingual | string;
  description?: MaterialBilingual | string;
  url?: string;
  sameAs?: string | string[];
  identifier?: string;
  dateCreated?: string;
  datePublished?: string;
  [key: string]: unknown;
}

/**
 * Retrieve a material's JSON-LD by its IRI path component (`<source>/<ident>`).
 * Accepts either the bare tail or a full material IRI.
 */
export async function getMaterial(iriOrTail: string): Promise<Material> {
  const tail = encodeTail(materialTail(iriOrTail));
  const endpoint = `/materials/${tail}`;
  try {
    const response = await axios.get<Material>(`${NGM_API_BASE_URL}${endpoint}`);
    return response.data;
  } catch (error) {
    handleNgmError(error, endpoint);
  }
}

/**
 * Parse a court-case ref into its composite key. Refs travel as `<court>:<number>`
 * (e.g. `special:081-CR-0060`, the form `Case.court_cases[]` carries); a bare number
 * with no court prefix is returned with an empty court.
 */
export function parseCourtCaseRef(ref: string): { court: string; caseNumber: string } {
  const idx = ref.indexOf(':');
  if (idx === -1) return { court: '', caseNumber: ref };
  return { court: ref.slice(0, idx), caseNumber: ref.slice(idx + 1) };
}

/**
 * Retrieve a court case by its composite key from the NGM read plane.
 * Accepts either a `<court>:<number>` ref or explicit court + caseNumber.
 */
export async function getCourtCase(ref: string): Promise<CourtCase>;
export async function getCourtCase(court: string, caseNumber: string): Promise<CourtCase>;
export async function getCourtCase(courtOrRef: string, caseNumber?: string): Promise<CourtCase> {
  const { court, caseNumber: number } =
    caseNumber === undefined
      ? parseCourtCaseRef(courtOrRef)
      : { court: courtOrRef, caseNumber };
  // Composite-key detail route is /courtcases/<court>/<case_number>/ (mounted at
  // /api/), NOT nested under /courts/. Case numbers contain hyphens but no
  // slashes; encode each segment.
  const endpoint = `/courtcases/${encodeURIComponent(court)}/${encodeURIComponent(number)}/`;
  try {
    const response = await axios.get<CourtCase>(`${NGM_API_BASE_URL}${endpoint}`);
    return response.data;
  } catch (error) {
    handleNgmError(error, endpoint);
  }
}

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Fetch a composite-key sub-resource list (hearings/entities), unwrapping pages. */
async function getCaseSubResource<T>(
  court: string,
  caseNumber: string,
  sub: 'hearings' | 'entities' | 'documents',
): Promise<T[]> {
  const endpoint = `/courtcases/${encodeURIComponent(court)}/${encodeURIComponent(caseNumber)}/${sub}`;
  try {
    const response = await axios.get<Paginated<T> | T[]>(`${NGM_API_BASE_URL}${endpoint}`);
    const data = response.data;
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch (error) {
    handleNgmError(error, endpoint);
  }
}

/**
 * Retrieve a FULL court case: the composite-key core plus its hearings and
 * party entities (separate sub-resource endpoints), assembled into one CourtCase
 * shaped for CourtCaseCard. Accepts a `<court>:<number>` ref or explicit pair.
 */
export async function getCourtCaseFull(ref: string): Promise<CourtCase>;
export async function getCourtCaseFull(court: string, caseNumber: string): Promise<CourtCase>;
export async function getCourtCaseFull(courtOrRef: string, caseNumber?: string): Promise<CourtCase> {
  const { court, caseNumber: number } =
    caseNumber === undefined
      ? parseCourtCaseRef(courtOrRef)
      : { court: courtOrRef, caseNumber };
  // The core case MUST load (it determines whether the case exists / the page
  // 404s). Hearings + entities are supplementary: a flaky or empty sub-resource
  // must NOT tank an otherwise-valid page, so they degrade to [] on failure.
  const core = await getCourtCase(court, number);
  const [hearings, entities] = await Promise.all([
    getCaseSubResource<CourtCaseHearing>(court, number, 'hearings').catch(() => []),
    getCaseSubResource<CourtCaseEntity>(court, number, 'entities').catch(() => []),
  ]);
  return { ...core, hearings, entities };
}

/** Normalize an axios/unknown error into a JDSApiError (shared error shape). */
function handleNgmError(error: unknown, endpoint: string): never {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.detail || error.response?.data?.error || error.message;
    throw new JDSApiError(`NGM API Error: ${message}`, error.response?.status, endpoint, error);
  }
  throw new JDSApiError(
    `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    undefined,
    endpoint,
    error,
  );
}
