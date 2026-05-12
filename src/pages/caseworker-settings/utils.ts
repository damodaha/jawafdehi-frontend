import type { LLMProvider } from "@/types/caseworker";

export type Tab = "prompts" | "skills" | "knowledge" | "public-chat" | "llm" | "mcp";

export function rows<T>(data: { results?: T[] } | T[]): T[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "") || "public_docs";
}

export function errorMessage(error: unknown) {
  const responseDetail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof responseDetail === "string" && responseDetail.trim()) {
    return responseDetail;
  }
  return error instanceof Error ? error.message : "Import failed";
}

export const providerTypes: LLMProvider["provider_type"][] = ["anthropic", "openai", "google", "ollama", "azure", "custom"];
export const structuredOutputModes: LLMProvider["structured_output_mode"][] = ["auto", "provider_native", "tool_calling"];

export function providerLabel(provider: LLMProvider) {
  const label = provider.display_name || provider.name;
  return label + " (" + provider.provider_type + " - " + provider.model + ")";
}
