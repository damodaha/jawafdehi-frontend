import { useEffect, useState } from "react";
import { Check, Edit2, MessageSquare, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPrompt, deletePrompt, listPrompts, updatePrompt } from "@/services/caseworker-api";
import type { Prompt, Skill } from "@/types/caseworker";
import { AlertBanner, EmptyState } from "../components";
import { rows } from "../utils";

export function PromptsTab({ skills }: { skills: Skill[] }) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [editing, setEditing] = useState<Prompt | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Prompt>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    listPrompts().then((data) => setPrompts(rows(data)));
  }, []);

  const blank = (): Partial<Prompt> => ({
    name: "",
    display_name: "",
    description: "",
    prompt: "",
    skills: [],
    model: "claude-opus-4-6",
    temperature: 0.2,
    max_tokens: 1000,
  });

  const startEdit = (p: Prompt) => {
    setEditing(p);
    setCreating(false);
    setForm(p);
    setError("");
  };

  const save = async () => {
    setError("");
    try {
      if (creating) {
        const created = await createPrompt(form);
        setPrompts((current) => [...current, created]);
      } else if (editing) {
        const updated = await updatePrompt(editing.id, form);
        setPrompts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      }
      setCreating(false);
      setEditing(null);
      setForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const remove = async (id: number) => {
    try {
      await deletePrompt(id);
      setPrompts((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const toggleSkill = (id: number) => {
    const selected = form.skills ?? [];
    setForm((current) => ({
      ...current,
      skills: selected.includes(id)
        ? selected.filter((skillId) => skillId !== id)
        : [...selected, id],
    }));
  };

  const isOpen = creating || Boolean(editing);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Prompt Library</p>
          <p className="text-sm text-muted-foreground">{prompts.length} prompt{prompts.length !== 1 ? "s" : ""} configured for caseworker and public chat flows.</p>
        </div>
        <Button size="sm" variant="primary" onClick={() => { setForm(blank()); setCreating(true); setEditing(null); setError(""); }}>
          <Plus className="mr-1 h-4 w-4" /> New Prompt
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setCreating(false); setEditing(null); setForm({}); setError(""); } }}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{creating ? "Create Prompt" : "Edit Prompt"}</DialogTitle>
            <DialogDescription>Define the model instruction, placeholder contract, and optional skill links.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="prompt-name">Name (slug)</Label>
                <Input id="prompt-name" value={form.name ?? ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="case-summarizer" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prompt-display-name">Display Name</Label>
                <Input id="prompt-display-name" value={form.display_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))} placeholder="Case Summarizer" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="prompt-description">Description</Label>
                <Input id="prompt-description" value={form.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="prompt-content">System Prompt</Label>
                <Textarea
                  id="prompt-content"
                  value={form.prompt ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
                  rows={8}
                  placeholder="You are a caseworker assistant. Summarize case {case_data} based on: {query}"
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">Use <code className="rounded bg-muted px-0.5">{"{case_data}"}</code> and <code className="rounded bg-muted px-0.5">{"{query}"}</code> as placeholders.</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="prompt-model">Model</Label>
                <Input id="prompt-model" value={form.model ?? ""} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} placeholder="claude-3-5-sonnet-20241022" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="prompt-temperature">Temperature</Label>
                  <Input id="prompt-temperature" type="number" min={0} max={2} step={0.1} value={form.temperature ?? 0.7} onChange={(e) => setForm((p) => ({ ...p, temperature: parseFloat(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prompt-max-tokens">Max Tokens</Label>
                  <Input id="prompt-max-tokens" type="number" min={100} max={100000} value={form.max_tokens ?? 2000} onChange={(e) => setForm((p) => ({ ...p, max_tokens: parseInt(e.target.value) }))} />
                </div>
              </div>
            </div>
            {skills.length > 0 ? (
              <div className="space-y-2">
                <Label>Loaded Skills</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {skills.map((skill) => (
                    <label key={skill.id} className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40">
                      <input type="checkbox" checked={(form.skills ?? []).includes(skill.id)} onChange={() => toggleSkill(skill.id)} />
                      {skill.display_name ?? skill.name}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); setForm({}); setError(""); }}><X className="mr-1 h-4 w-4" /> Cancel</Button>
            <Button variant="primary" onClick={save}><Check className="mr-1 h-4 w-4" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {prompts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No prompts yet"
          description="Create a prompt to control how the assistant answers specific caseworker or public chat tasks."
          action={<Button size="sm" variant="primary" onClick={() => { setForm(blank()); setCreating(true); setEditing(null); setError(""); }}><Plus className="mr-1 h-4 w-4" /> New Prompt</Button>}
        />
      ) : (
        <div className="space-y-2">
          {prompts.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/30">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{p.display_name ?? p.name}</p>
                <p className="text-xs text-muted-foreground font-mono">/{p.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Edit ${p.display_name ?? p.name}`} onClick={() => startEdit(p)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" aria-label={`Delete ${p.display_name ?? p.name}`} onClick={() => remove(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
