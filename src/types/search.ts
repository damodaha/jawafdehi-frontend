export type ArchiveSearchType =
  | "all"
  | "case"
  | "entity"
  | "document";

export type ArchiveSearchSort = "relevance" | "newest" | "oldest" | "title";

export interface ArchiveSearchParams {
  q?: string;
  type?: ArchiveSearchType;
  entity_type?: string[];
  role?: string[];
  case_type?: string[];
  tags?: string[];
  sort?: ArchiveSearchSort;
  page?: number;
  page_size?: number;
}

export interface SearchFacetItem {
  name: string;
  display_name: string;
  count: number;
}

export interface ArchiveSearchFacets {
  type: SearchFacetItem[];
  entity_type: SearchFacetItem[];
  role: SearchFacetItem[];
  case_type: SearchFacetItem[];
  tags: SearchFacetItem[];
}

export interface SearchResultEntityPreview {
  id: number;
  display_name: string | null;
  nes_id: string | null;
  relationship_type?: string;
}

interface BaseSearchResult {
  result_type: "case" | "entity" | "document";
  id: number;
  title: string;
  description: string;
  url: string;
  api_url: string;
  matched_fields: string[];
  score: number;
}

export interface CaseSearchResult extends BaseSearchResult {
  result_type: "case";
  slug: string;
  state: string;
  case_type: string;
  date: string | null;
  tags: string[];
  entities: SearchResultEntityPreview[];
}

export interface EntitySearchResult extends BaseSearchResult {
  result_type: "entity";
  entity_type: string;
  nes_id: string | null;
  role_counts: Record<string, number>;
  related_case_count: number;
}

export interface DocumentSearchResult extends BaseSearchResult {
  result_type: "document";
  source_id: string;
  source_type: string | null;
  related_entities: SearchResultEntityPreview[];
}

export type ArchiveSearchResult =
  | CaseSearchResult
  | EntitySearchResult
  | DocumentSearchResult;

export interface ArchiveSearchResponse {
  query: string;
  page: number;
  page_size: number;
  count: number;
  counts: {
    all: number;
    cases: number;
    entities: number;
    documents: number;
  };
  facets: ArchiveSearchFacets;
  results: ArchiveSearchResult[];
}
