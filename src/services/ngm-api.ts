/**
 * NGM API Client (governance / judicial materials + court cases)
 *
 * NGM data lives on the Think-Big monolith under the host-root `/ngm/api/` prefix
 * (distinct from the Jawafdehi `/api/` tree and the NES `/nes/api/` tree). Reads are
 * public — materials and court cases are derived from public-domain government
 * documents.
 *
 *   GET /ngm/api/materials/<source>/<ident>          -> material JSON-LD (schema.org)
 *   GET /ngm/api/courts/<court>/cases/<case_number>/  -> court case (composite key)
 *
 * Base URL defaults to the SAME-ORIGIN relative `/ngm/api` so the Vite dev proxy /
 * monolith ingress resolves it. An absolute override (VITE_NGM_API_BASE_URL) is
 * supported for split-host deployments. NOTE: keep the default RELATIVE — an
 * absolute prod default would make a containerized frontend bypass the proxy and
 * hit prod (the bug that crashed the home page during the search migration).
 */

import axios from 'axios';
import { JDSApiError } from './jds-api';
import type { CourtCase } from '@/types/jds';

const NGM_API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NGM_API_BASE_URL) ||
  '/ngm/api';

// A material @id IRI path component (`<source>/<ident>`) or a full IRI. The detail
// route is a splat, so the tail may already be the `<source>/<ident>` form.
const MATERIAL_MARKER = '/material/';

/** Same-origin material path tail (`<source>/<ident>`) from an IRI or bare tail. */
export function materialTail(iriOrTail: string): string {
  const i = iriOrTail.indexOf(MATERIAL_MARKER);
  return i === -1 ? iriOrTail : iriOrTail.slice(i + MATERIAL_MARKER.length);
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
  const tail = materialTail(iriOrTail);
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
  // Case numbers contain hyphens but no slashes; encode each segment.
  const endpoint = `/courts/${encodeURIComponent(court)}/cases/${encodeURIComponent(number)}/`;
  try {
    const response = await axios.get<CourtCase>(`${NGM_API_BASE_URL}${endpoint}`);
    return response.data;
  } catch (error) {
    handleNgmError(error, endpoint);
  }
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
