// Helpers for selecting and labelling a case's subject entities.
//
// Not every case type names an "accused" party. CORRUPTION cases do; others
// (e.g. TAX_EVASION) do not. So when we need to name a case's subject(s) we
// prefer the accused entities, but fall back to any other *named* (non-location)
// entity when there are none. Locations are never a subject.

const LOCATION_ROLE = "location";
const ACCUSED_ROLE = "accused";

/**
 * Return the entities that name a case's subject.
 *
 * Prefers accused entities; when there are none (e.g. a TAX_EVASION case) falls
 * back to every other entity that has a defined, non-location role. Entities
 * with a missing/empty role are never treated as a subject.
 *
 * @param entities  the case's entities (any shape)
 * @param getRole   extracts the relationship role from one entity
 */
export function getSubjectEntities<T>(
  entities: readonly T[] | null | undefined,
  getRole: (entity: T) => string | null | undefined,
): T[] {
  const list = entities ?? [];
  const accused = list.filter((e) => getRole(e) === ACCUSED_ROLE);
  if (accused.length > 0) return accused;
  return list.filter((e) => {
    const role = getRole(e);
    return Boolean(role) && role !== LOCATION_ROLE;
  });
}

// i18n keys for each case type's display label, keyed by the backend CaseType
// value. Single source of truth so every display site stays consistent.
const CASE_TYPE_LABEL_KEYS: Record<string, string> = {
  CORRUPTION: "cases.type.corruption",
  TAX_EVASION: "cases.type.taxEvasion",
};

const DEFAULT_CASE_TYPE_LABEL_KEY = "cases.type.corruption";

/** i18n key for a case type's display label (falls back to corruption). */
export function getCaseTypeLabelKey(caseType: string | null | undefined): string {
  return (caseType && CASE_TYPE_LABEL_KEYS[caseType]) || DEFAULT_CASE_TYPE_LABEL_KEY;
}
