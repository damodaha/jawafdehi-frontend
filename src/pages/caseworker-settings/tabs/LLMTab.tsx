import { useEffect, useState } from "react";
import { Bot, Check, Edit2, Plus, RefreshCw, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLLMProvider, listLLMProviders, testLLMConnection, updateLLMProvider } from "@/services/caseworker-api";
import type { LLMProvider } from "@/types/caseworker";
import { AlertBanner, EmptyState, StatusPill, ToggleRow } from "../components";
import { providerTypes, structuredOutputModes } from "../utils";

export function LLMTab() {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<LLMProvider | null>(null);
  const [form, setForm] = useState<Partial<LLMProvider> & { api_key?: string }>({});
  const [extraConfigText, setExtraConfigText] = useState("{}");
  const [testing, setTesting] = useState<number | null>(null);
  const [status, setStatus] = useState<Record<number, boolean | null>>({});
  const [statusError, setStatusError] = useState<Record<number, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    listLLMProviders().then((data) => setProviders(data.results ?? []));
  }, []);

  const blank = (): Partial<LLMProvider> & { api_key: string } => ({
    name: "anthropic-default",
    display_name: "Anthropic Default",
    provider_type: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    base_url: "",
    api_version: "",
    deployment_name: "",
    extra_config: {},
    temperature: 0.7,
    max_tokens: 2000,
    is_active: true,
    is_default: false,
    structured_output_mode: "auto",
    api_key: "",
  });

  const startEdit = (p: LLMProvider) => {
    setEditing(p);
    setCreating(false);
    setForm(p);
    setExtraConfigText(JSON.stringify(p.extra_config ?? {}, null, 2));
    setError("");
  };

  const cancel = () => {
    setCreating(false);
    setEditing(null);
    setForm({});
    setExtraConfigText("{}");
    setError("");
  };

  const save = async () => {
    setError("");
    try {
      let extra_config: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(extraConfigText || "{}") as unknown;
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
          throw new Error("Extra config must be a JSON object.");
        }
        extra_config = parsed as Record<string, unknown>;
      } catch {
        setError("Extra config must be valid JSON object syntax.");
        return;
      }
      const payload = { ...form, extra_config };
      const saved = creating
        ? await createLLMProvider(payload as Partial<LLMProvider> & { api_key: string })
        : editing
          ? await updateLLMProvider(editing.id, payload)
          : null;
      if (saved) setProviders((current) => creating ? [...current, saved] : current.map((item) => item.id === saved.id ? saved : item));
      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const test = async (id: number) => {
    setTesting(id);
    try {
      const result = await testLLMConnection(id);
      setStatus((current) => ({ ...current, [id]: result.connected }));
      setStatusError((current) => ({ ...current, [id]: result.error ?? "" }));
    } catch {
      setStatus((current) => ({ ...current, [id]: false }));
      setStatusError((current) => ({ ...current, [id]: "Connection test request failed." }));
    } finally {
      setTesting(null);
    }
  };

  const isOpen = creating || Boolean(editing);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">LLM Providers</p>
          <p className="text-sm text-muted-foreground">{providers.length} provider{providers.length !== 1 ? "s" : ""} configured for model-backed answers.</p>
        </div>
        <Button size="sm" variant="primary" onClick={() => { setForm(blank()); setExtraConfigText("{}"); setCreating(true); setEditing(null); setError(""); }}><Plus className="mr-1 h-4 w-4" /> Add Provider</Button>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => !open && cancel()}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{creating ? "Add LLM Provider" : "Edit LLM Provider"}</DialogTitle>
            <DialogDescription>Configure provider credentials, model routing, and structured output behavior.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="llm-name">Name</Label>
                <Input id="llm-name" value={form.name ?? ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="openai-public-answer" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="llm-display-name">Display Name</Label>
                <Input id="llm-display-name" value={form.display_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))} placeholder="OpenAI Public Answer" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="llm-provider-type">Provider</Label>
                <select
                  id="llm-provider-type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.provider_type ?? "anthropic"}
                  onChange={(e) => setForm((p) => ({ ...p, provider_type: e.target.value as LLMProvider["provider_type"] }))}
                >
                  {providerTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="llm-model">Model</Label>
                <Input id="llm-model" value={form.model ?? ""} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} placeholder="claude-3-5-sonnet-20241022" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="llm-api-key">API Key</Label>
                <Input id="llm-api-key" type="password" value={form.api_key ?? ""} onChange={(e) => setForm((p) => ({ ...p, api_key: e.target.value }))} placeholder={editing ? "Leave blank to keep existing" : "sk-..."} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="llm-base-url">Base URL / Endpoint</Label>
                <Input id="llm-base-url" value={form.base_url ?? ""} onChange={(e) => setForm((p) => ({ ...p, base_url: e.target.value }))} placeholder="https://api.openai.com/v1" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="llm-deployment">Deployment Name</Label>
                <Input id="llm-deployment" value={form.deployment_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, deployment_name: e.target.value }))} placeholder="Azure deployment name" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="llm-api-version">API Version</Label>
                <Input id="llm-api-version" value={form.api_version ?? ""} onChange={(e) => setForm((p) => ({ ...p, api_version: e.target.value }))} placeholder="2024-08-01-preview" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="llm-structured-mode">Structured Output</Label>
                <select
                  id="llm-structured-mode"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.structured_output_mode ?? "auto"}
                  onChange={(e) => setForm((p) => ({ ...p, structured_output_mode: e.target.value as LLMProvider["structured_output_mode"] }))}
                >
                  {structuredOutputModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="llm-temperature">Temperature</Label>
                <Input id="llm-temperature" type="number" min={0} max={2} step={0.1} value={form.temperature ?? 0.7} onChange={(e) => setForm((p) => ({ ...p, temperature: parseFloat(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="llm-max-tokens">Max Tokens</Label>
                <Input id="llm-max-tokens" type="number" min={100} value={form.max_tokens ?? 2000} onChange={(e) => setForm((p) => ({ ...p, max_tokens: parseInt(e.target.value) }))} />
              </div>
              <ToggleRow
                label="Active"
                checked={form.is_active ?? true}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, is_active: checked }))}
              />
              <ToggleRow
                label="Default Provider"
                checked={form.is_default ?? false}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, is_default: checked }))}
              />
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="llm-extra-config">Extra Config JSON</Label>
                <Textarea id="llm-extra-config" value={extraConfigText} onChange={(e) => setExtraConfigText(e.target.value)} rows={4} className="font-mono text-xs" placeholder='{"timeout": 30}' />
              </div>
            </div>
            {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancel}><X className="mr-1 h-4 w-4" /> Cancel</Button>
            <Button variant="primary" onClick={save}><Check className="mr-1 h-4 w-4" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {providers.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No LLM providers configured"
          description="Add a provider to enable model-backed caseworker and public chat answers."
          action={<Button size="sm" variant="primary" onClick={() => { setForm(blank()); setExtraConfigText("{}"); setCreating(true); setEditing(null); setError(""); }}><Plus className="mr-1 h-4 w-4" /> Add Provider</Button>}
        />
      ) : (
        <div className="space-y-2">
          {providers.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/30">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm">{p.display_name || p.name}</p>
                  {p.is_default ? <StatusPill tone="blue">Default</StatusPill> : null}
                  {p.is_active ? <StatusPill tone="green">Active</StatusPill> : <StatusPill>Inactive</StatusPill>}
                  {status[p.id] === true ? <StatusPill tone="green"><Zap className="mr-1 h-3 w-3" /> Connected</StatusPill> : null}
                  {status[p.id] === false ? <StatusPill tone="red">Failed</StatusPill> : null}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{p.provider_type} / {p.model}</p>
                {p.base_url && <p className="text-xs text-muted-foreground font-mono truncate">{p.base_url}</p>}
                {status[p.id] === false && statusError[p.id] && (
                  <p className="mt-1 text-xs text-red-700">{statusError[p.id]}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => test(p.id)} disabled={testing === p.id}>
                  <RefreshCw className={`h-3 w-3 mr-1 ${testing === p.id ? "animate-spin" : ""}`} /> Test
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Edit ${p.provider_type} provider`} onClick={() => startEdit(p)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
