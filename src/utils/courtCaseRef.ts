/**
 * Friendly court-case-reference case URLs.
 *
 * A bare court case number in the path (e.g. /case/081-CR-0116) is redirected to
 * the canonical slug URL. The court identifier (special/supreme) is not part of
 * the URL, so we probe the known identifiers in order. Mirrors the legacy-numeric
 * redirect pattern in legacyCaseMap.ts (worker.ts edge 301 + CaseDetail
 * client-side fallback).
 */

// Bare court case number: digits-letters-digits (e.g. 081-CR-0116, 81-cr-116).
// Zero-padding / casing is normalised server-side by the cases API.
const COURT_REF_PATTERN = /^\d+-[A-Za-z]+-\d+$/;

// Court identifiers the cases API understands, probed in this order.
const COURT_IDENTIFIERS = ['special', 'supreme'] as const;

export function isCourtCaseRef(id: string | undefined): boolean {
  return id != null && COURT_REF_PATTERN.test(id);
}

/**
 * API lookup identifiers for a bare court ref, e.g.
 * ['special:081-CR-0116', 'supreme:081-CR-0116'].
 */
export function courtRefCandidates(ref: string): string[] {
  return COURT_IDENTIFIERS.map((court) => `${court}:${ref}`);
}
