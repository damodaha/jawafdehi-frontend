// Client-side vocab + helpers for the Jawafdehi corruption-case and document-
// source admin forms. The enum values mirror src/types/jds.ts (CaseType /
// CaseState / DocumentSourceType) and the backend serializers; the backend
// remains the authority and re-validates.
import type {
  CaseType,
  CaseState,
  DocumentSourceType,
} from "@/types/jds";

// Corruption-case type + workflow-state choices (see types/jds.ts).
export const CASE_TYPES: readonly CaseType[] = [
  "CORRUPTION",
  "BRIBERY",
  "FORGERY",
  "EMBEZZLEMENT",
  "ABUSE_OF_OFFICE",
  "MONEY_LAUNDERING",
  "ILLEGAL_PROPERTY",
  "EXAM_RIGGING",
  "TAX_EVASION",
];

export const CASE_STATES: readonly CaseState[] = [
  "DRAFT",
  "IN_REVIEW",
  "PUBLISHED",
  "CLOSED",
];

// Document-source type choices (see types/jds.ts DocumentSourceType).
export const SOURCE_TYPES: readonly DocumentSourceType[] = [
  "LEGAL_COURT_ORDER",
  "LEGAL_PROCEDURAL",
  "OFFICIAL_GOVERNMENT",
  "FINANCIAL_FORENSIC",
  "INTERNAL_CORPORATE",
  "MEDIA_NEWS",
  "INVESTIGATIVE_REPORT",
  "PUBLIC_COMPLAINT",
  "LEGISLATIVE_DOC",
  "SOCIAL_MEDIA",
  "OTHER_VISUAL",
];

// Source-link roles. Uploaded files are RAW; the rest cover the URL kinds a
// source can carry (mirrors SourceLinkRole in types/jds.ts).
export const SOURCE_LINK_ROLES = [
  "RAW",
  "MARKDOWN",
  "PERMALINK",
  "SOURCE_PAGE",
  "ALTERNATE",
] as const;

// URL-friendly slug: lowercase alnum, hyphen-separated (mirrors the case-slug
// rule; reused from the NES slugify shape).
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
