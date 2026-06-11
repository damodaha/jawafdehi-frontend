// Types for the Casework Review System portal (ported from the standalone
// casework SPA into the jawafdehi frontend). The review system is rule-centered:
// each review scores a case against editable Rules and rolls them up into
// per-category scores + an overall disposition.

export interface CaseworkUser {
  username: string;
  roles: string[];
  is_admin: boolean;
}

export type ReviewStatus = "pending" | "running" | "done" | "failed";
export type Disposition = "PASS" | "REVISE" | "REJECT";

export interface ReviewListItem {
  id: number;
  slug: string;
  status: ReviewStatus;
  stage: string;
  case_title: string;
  case_state: string;
  source_count: number;
  sources_converted: number;
  overall_score: number | null;
  disposition: Disposition | null;
  case_type: string;
  created_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
}

export interface RuleResult {
  key: string;
  title: string;
  category: string;
  kind: "deterministic" | "llm";
  condition_text: string;
  applies_to: string[];
  weight: number;
  is_gate: boolean;
  gate_min: number;
  gate_failed: boolean;
  score: number;
  confidence: "high" | "medium" | "low";
  variance: number;
  std: number;
  issues: string[];
  suggestions: string[];
  rationale: string;
  description: string;
  good_examples: string;
  bad_examples: string;
}

export interface CategoryScore {
  category: string;
  score: number;
  rules: number;
}

export interface SourceSummary {
  title: string;
  source_type: string;
  conversion_status: string;
  conversion_note: string;
  markdown_chars: number;
  markdown: string;
  url: string[];
}

export interface ReviewResult {
  slug: string;
  title: string;
  state: string;
  case_type: { type: string; label: string; rationale: string };
  overall_score: number;
  disposition: Disposition;
  rules: RuleResult[];
  categories: CategoryScore[];
  gate_failures: { key: string; title: string; score: number; gate_min: number }[];
  gates_pass: boolean;
  narrative: string;
  judge_error: string | null;
  llm_samples: number;
  thresholds: { pass: number; revise: number };
  model_id_used: string | null;
  source_summary: SourceSummary[];
}

export interface ReviewDetail extends ReviewListItem {
  error: string;
  result: ReviewResult | null;
  updated_at: string;
  started_at: string | null;
}

export interface CaseworkRule {
  id: number;
  key: string;
  title: string;
  category: string;
  description: string;
  good_examples: string;
  bad_examples: string;
  condition_text: string;
  applies_to: string[];
  kind: "deterministic" | "llm";
  detector: string;
  weight: number;
  is_gate: boolean;
  gate_min: number;
  enabled: boolean;
  order: number;
  updated_at: string;
}

export interface ReviewConfig {
  pass_threshold: number;
  revise_threshold: number;
  llm_samples: number;
  updated_at: string;
}

// DRF default pagination envelope (the jawafdehi-api paginates list endpoints).
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
