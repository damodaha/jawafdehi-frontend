export interface CaseworkerUser {
  id: number;
  username: string;
  email: string;
  role: "caseworker" | "administrator"; // derived from is_staff on the backend
}

export interface Skill {
  id: number;
  name: string;
  display_name: string | null;
  description: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: number;
  name: string;
  display_name: string | null;
  description: string;
  prompt: string;
  skills: number[];
  model: string;
  temperature: number;
  max_tokens: number;
  created_at: string;
  updated_at: string;
}

export interface MCPServer {
  id: number;
  name: string;
  display_name: string | null;
  url: string;
  auth_type: "bearer" | "api_key";
  status: "connected" | "disconnected" | "error";
  created_at: string;
  updated_at: string;
}

export interface Summary {
  id: number;
  case_number: string;
  prompt: number | null;
  prompt_name: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DraftVersion {
  id: number;
  content: string;
  created_at: string;
}

export interface Draft {
  id: number;
  case_number: string;
  prompt: number | null;
  prompt_name: string | null;
  content: string;
  status: "draft" | "posted" | "archived";
  external_reference_id: string | null;
  versions: DraftVersion[];
  created_at: string;
  updated_at: string;
}

export interface LLMProvider {
  id: number;
  name: string;
  display_name: string;
  provider_type: "openai" | "anthropic" | "google" | "ollama" | "azure" | "custom";
  model: string;
  base_url: string;
  api_version: string;
  deployment_name: string;
  extra_config: Record<string, unknown>;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  is_default: boolean;
  structured_output_mode: "auto" | "provider_native" | "tool_calling";
  created_at: string;
  updated_at: string;
}

export interface KnowledgeCollection {
  id: number;
  name: string;
  display_name: string;
  description: string;
  access_level: "private" | "public";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeSource {
  id: number;
  collection: number;
  collection_name: string;
  title: string;
  source_type: string;
  source_url: string;
  chunk_count?: number;
  storage_path: string;
  checksum: string;
  metadata: Record<string, unknown>;
  access_level: "private" | "public";
  is_active: boolean;
  owner: number | null;
  allowed_users: number[];
  allowed_groups: number[];
  case: number | null;
  document_source: number | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeImportManifest {
  collection: {
    name: string;
    display_name?: string;
    description?: string;
    access_level?: "private" | "public";
    is_active?: boolean;
  } | string;
  source: {
    title: string;
    source_type?: string;
    source_url?: string;
    url?: string;
    storage_path?: string;
    checksum?: string;
    metadata?: Record<string, unknown>;
    access_level?: "private" | "public";
    is_active?: boolean;
  };
  document?: {
    text?: string;
    markdown?: string;
    content?: string;
    content_file?: string;
    markdown_file?: string;
    text_file?: string;
    section_title?: string;
    metadata?: Record<string, unknown>;
    pages?: Array<{
      page?: number;
      page_start?: number;
      page_end?: number;
      text?: string;
      content?: string;
      section_title?: string;
      metadata?: Record<string, unknown>;
    }>;
  };
  chunking?: {
    strategy?: "recursive" | "page_recursive";
    chunk_size?: number;
    chunk_overlap?: number;
    min_chunk_chars?: number;
    separators?: string[];
  };
  embedding?: boolean | {
    auto?: boolean;
    model?: string;
    batch_size?: number;
    metadata?: Record<string, unknown>;
  };
  chunks?: Array<{
    text?: string;
    content?: string;
    chunk_index?: number;
    page?: number;
    page_start?: number;
    page_end?: number;
    section_title?: string;
    table_title?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface KnowledgeImportResult {
  collection: KnowledgeCollection;
  source: KnowledgeSource;
  chunks_imported: number;
  embeddings_imported?: number;
}

export interface KnowledgeSourceImportPayload {
  collection_name: string;
  collection_display_name?: string;
  source_title?: string;
  source_type?: string;
  access_level?: "private" | "public";
  embed?: boolean;
  source_url?: string;
  text?: string;
  markdown?: string;
  manifest?: KnowledgeImportManifest | Record<string, unknown>;
  file?: File;
  pages?: string;
  page_start?: number;
  page_end?: number;
  expand_catalog?: boolean;
  convert_linked_documents?: boolean;
}

export interface KnowledgeSourceImportResult {
  collection: KnowledgeCollection;
  source: KnowledgeSource | null;
  sources_imported: number;
  chunks_imported: number;
  embeddings_imported: number;
  failures: Array<{ item?: string; error: string }>;
}

export interface RAGSkillProfile {
  id: number;
  name: string;
  display_name: string;
  description: string;
  skill: number;
  collections: number[];
  trigger_keywords: string[];
  priority: number;
  max_results: number;
  min_keyword_matches: number;
  requires_citations: boolean;
  is_active: boolean;
  source_path: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PublicChatConfig {
  id: number;
  name: string;
  is_active: boolean;
  enabled: boolean;
  prompt: number;
  llm_provider: number | null;
  quota_scope: "ip_session" | "session" | "ip";
  quota_limit: number;
  quota_window_seconds: number;
  max_question_chars: number;
  max_history_turns: number;
  max_history_chars: number;
  max_tool_calls: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  type: "user" | "assistant" | "info" | "error" | "success";
  message: string;
  timestamp: string;
  isUser?: boolean;
}

export interface ChatTab {
  id: number;
  name: string;
  messages: ChatMessage[];
}
