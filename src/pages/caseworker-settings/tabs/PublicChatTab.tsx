import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPublicChatConfig, listPublicChatConfigs, updatePublicChatConfig } from "@/services/caseworker-api";
import type { LLMProvider, Prompt, PublicChatConfig } from "@/types/caseworker";
import { StatusPill, ToggleRow } from "../components";
import { providerLabel, rows } from "../utils";

export function PublicChatTab({
  prompts,
  providers,
}: {
  prompts: Prompt[];
  providers: LLMProvider[];
}) {
  const [configs, setConfigs] = useState<PublicChatConfig[]>([]);
  const [form, setForm] = useState<Partial<PublicChatConfig>>({});
  const active = configs[0] ?? null;

  useEffect(() => {
    listPublicChatConfigs().then((data) => {
      const loaded = rows(data);
      setConfigs(loaded);
      if (loaded[0]) setForm(loaded[0]);
    });
  }, []);

  const save = async () => {
    const saved = active
      ? await updatePublicChatConfig(active.id, form)
      : await createPublicChatConfig({
        name: "default",
        is_active: true,
        enabled: true,
        quota_scope: "ip_session",
        quota_limit: 10,
        quota_window_seconds: 86400,
        max_question_chars: 1000,
        max_history_turns: 6,
        max_history_chars: 4000,
        max_tool_calls: 8,
        llm_provider: null,
        ...form,
      });
    setConfigs([saved]);
    setForm(saved);
  };

  const numberField = (field: keyof PublicChatConfig, label: string, helpText?: string) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type="number" min={1} value={Number(form[field] ?? 1)} onChange={(event) => setForm((current) => ({ ...current, [field]: Number(event.target.value) }))} />
      {helpText ? <p className="text-xs leading-5 text-muted-foreground">{helpText}</p> : null}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Public Chat Controls</p>
            <p className="text-sm text-muted-foreground">Manage the default prompt, provider, quota, and safety limits for guest chat.</p>
          </div>
          <StatusPill tone={form.enabled ?? true ? "green" : "slate"}>{form.enabled ?? true ? "Enabled" : "Disabled"}</StatusPill>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Prompt</Label>
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.prompt ?? ""} onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value ? Number(event.target.value) : undefined }))}>
            <option value="">Select prompt</option>
            {prompts.map((prompt) => <option key={prompt.id} value={prompt.id}>{prompt.display_name ?? prompt.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Answer Provider</Label>
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.llm_provider ?? ""} onChange={(event) => setForm((current) => ({ ...current, llm_provider: event.target.value ? Number(event.target.value) : null }))}>
            <option value="">Use default active provider</option>
            {providers.map((provider) => <option key={provider.id} value={provider.id}>{providerLabel(provider)}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Quota Scope</Label>
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.quota_scope ?? "ip_session"} onChange={(event) => setForm((current) => ({ ...current, quota_scope: event.target.value as PublicChatConfig["quota_scope"] }))}>
            <option value="ip_session">IP + Session</option>
            <option value="session">Session</option>
            <option value="ip">IP</option>
          </select>
        </div>
        <ToggleRow
          label="Enabled"
          checked={form.enabled ?? true}
          onCheckedChange={(checked) => setForm((current) => ({ ...current, enabled: checked }))}
          description="Controls whether the public chat endpoint is available."
        />
        {numberField("quota_limit", "Quota Limit")}
        {numberField("quota_window_seconds", "Quota Window Seconds")}
        {numberField("max_question_chars", "Max Question Characters")}
        {numberField("max_history_turns", "Max History Turns")}
        {numberField("max_history_chars", "Max History Characters")}
        {numberField(
          "max_tool_calls",
          "Max Agent Tool Calls",
          "Maximum read-tool calls the public chat agent may make per answer. Higher values help complex report questions but increase latency and cost.",
        )}
      </div>
      <Button size="sm" variant="primary" onClick={save}><Check className="mr-1 h-4 w-4" /> Save Public Chat Config</Button>
    </div>
  );
}
