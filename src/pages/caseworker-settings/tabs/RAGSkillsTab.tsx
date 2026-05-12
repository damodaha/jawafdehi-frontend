import { useEffect, useState } from "react";
import { Check, Edit2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRAGSkillProfile, createSkill, deleteRAGSkillProfile, listRAGSkillProfiles, updateRAGSkillProfile, updateSkill } from "@/services/caseworker-api";
import type { KnowledgeCollection, RAGSkillProfile, Skill } from "@/types/caseworker";
import { AlertBanner, EmptyState, StatusPill, ToggleRow } from "../components";
import { rows, slugify } from "../utils";

export function RAGSkillsTab({
  skills,
  knowledgeCollections,
  onProfilesChange,
  onSkillsChange,
}: {
  skills: Skill[];
  knowledgeCollections: KnowledgeCollection[];
  onProfilesChange?: (profiles: RAGSkillProfile[]) => void;
  onSkillsChange?: (skills: Skill[]) => void;
}) {
  const [profiles, setProfiles] = useState<RAGSkillProfile[]>([]);
  const [editing, setEditing] = useState<RAGSkillProfile | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<RAGSkillProfile>>({});
  const [triggerText, setTriggerText] = useState("");
  const [instructionText, setInstructionText] = useState("");
  const [sourceLocationsText, setSourceLocationsText] = useState("");
  const [allowedToolsText, setAllowedToolsText] = useState("convert_to_markdown");
  const [metadataText, setMetadataText] = useState("{}");
  const [error, setError] = useState("");
  const publicCollections = knowledgeCollections.filter(
    (collection) => collection.access_level === "public" && collection.is_active,
  );

  useEffect(() => {
    listRAGSkillProfiles().then((data) => {
      const loaded = rows(data);
      setProfiles(loaded);
      onProfilesChange?.(loaded);
    });
  }, [onProfilesChange]);

  const blank = (): Partial<RAGSkillProfile> => ({
    name: "",
    display_name: "",
    description: "",
    collections: [],
    trigger_keywords: [],
    priority: 100,
    max_results: 5,
    min_keyword_matches: 1,
    requires_citations: true,
    is_active: true,
    source_path: "",
    metadata: {},
  });

  const startCreate = () => {
    setForm(blank());
    setTriggerText("");
    setInstructionText("");
    setSourceLocationsText("");
    setAllowedToolsText("convert_to_markdown");
    setMetadataText("{}");
    setCreating(true);
    setEditing(null);
    setError("");
  };

  const startEdit = (profile: RAGSkillProfile) => {
    setEditing(profile);
    setCreating(false);
    setForm(profile);
    setTriggerText((profile.trigger_keywords ?? []).join("\n"));
    setInstructionText(skills.find((skill) => skill.id === profile.skill)?.content ?? "");
    const metadata = profile.metadata ?? {};
    const sourceLocations = Array.isArray(metadata.source_locations) ? metadata.source_locations : [];
    const allowedTools = Array.isArray(metadata.allowed_mcp_tools) ? metadata.allowed_mcp_tools : [];
    setSourceLocationsText(sourceLocations.filter((item): item is string => typeof item === "string").join("\n"));
    setAllowedToolsText(allowedTools.filter((item): item is string => typeof item === "string").join("\n") || "convert_to_markdown");
    setMetadataText(JSON.stringify(profile.metadata ?? {}, null, 2));
    setError("");
  };

  const cancel = () => {
    setCreating(false);
    setEditing(null);
    setForm({});
    setTriggerText("");
    setInstructionText("");
    setSourceLocationsText("");
    setAllowedToolsText("convert_to_markdown");
    setMetadataText("{}");
    setError("");
  };

  const save = async () => {
    setError("");
    try {
      const trigger_keywords = triggerText
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
      if (trigger_keywords.length === 0) {
        setError("Add at least one trigger keyword.");
        return;
      }
      if (!instructionText.trim()) {
        setError("Add RAG instructions.");
        return;
      }
      let metadata: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(metadataText || "{}") as unknown;
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
          throw new Error("Metadata must be a JSON object.");
        }
        metadata = parsed as Record<string, unknown>;
      } catch {
        setError("Metadata must be valid JSON object syntax.");
        return;
      }
      const source_locations = sourceLocationsText
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
      const allowed_mcp_tools = allowedToolsText
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
      metadata = {
        ...metadata,
        source_locations,
        allowed_mcp_tools,
      };

      const payload: Partial<RAGSkillProfile> = {
        ...form,
        trigger_keywords,
        metadata,
        priority: Number(form.priority ?? 100),
        max_results: Number(form.max_results ?? 5),
        min_keyword_matches: Number(form.min_keyword_matches ?? 1),
      };

      const skillPayload: Partial<Skill> = {
        name: slugify(form.name || form.display_name || "rag-skill"),
        display_name: form.display_name || form.name || "RAG Skill",
        description: form.description || "",
        content: instructionText,
        is_active: form.is_active ?? true,
      };
      const existingSkill = skills.find((item) => item.name === skillPayload.name);
      const skill = editing
        ? await updateSkill(editing.skill, skillPayload)
        : existingSkill
          ? await updateSkill(existingSkill.id, skillPayload)
          : await createSkill(skillPayload);
      onSkillsChange?.(
        skills.some((item) => item.id === skill.id)
          ? skills.map((item) => item.id === skill.id ? skill : item)
          : [...skills, skill],
      );

      payload.skill = skill.id;
      const saved = creating
        ? await createRAGSkillProfile(payload)
        : editing
          ? await updateRAGSkillProfile(editing.id, payload)
          : null;

      if (saved) {
        setProfiles((current) => {
          const next = creating ? [...current, saved] : current.map((item) => item.id === saved.id ? saved : item);
          onProfilesChange?.(next);
          return next;
        });
      }
      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteRAGSkillProfile(id);
      setProfiles((current) => {
        const next = current.filter((item) => item.id !== id);
        onProfilesChange?.(next);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const toggleCollection = (id: number) => {
    const selected = form.collections ?? [];
    setForm((current) => ({
      ...current,
      collections: selected.includes(id)
        ? selected.filter((collectionId) => collectionId !== id)
        : [...selected, id],
    }));
  };

  const skillLabel = (id: number) => {
    const skill = skills.find((item) => item.id === id);
    return skill?.display_name ?? skill?.name ?? `Skill ${id}`;
  };

  const isOpen = creating || Boolean(editing);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Retrieval Skills</p>
          <p className="text-sm text-muted-foreground">{profiles.length} skill{profiles.length !== 1 ? "s" : ""} routes public document and evidence questions.</p>
        </div>
        <Button size="sm" variant="primary" onClick={startCreate}><Plus className="mr-1 h-4 w-4" /> New Skill</Button>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => !open && cancel()}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{creating ? "Create Retrieval Skill" : "Edit Retrieval Skill"}</DialogTitle>
            <DialogDescription>Route questions to source locations, cached collections, MCP tools, and citation rules.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="rag-name">Name (slug)</Label>
                <Input id="rag-name" value={form.name ?? ""} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="ciaa-annual-reports" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rag-display-name">Display Name</Label>
                <Input id="rag-display-name" value={form.display_name ?? ""} onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))} placeholder="CIAA Annual Reports" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="rag-description">Description</Label>
                <Input id="rag-description" value={form.description ?? ""} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="rag-instructions">Instructions</Label>
                <Textarea
                  id="rag-instructions"
                  value={instructionText}
                  onChange={(event) => setInstructionText(event.target.value)}
                  rows={7}
                  className="font-mono text-xs"
                  placeholder="When this skill is selected, explain where to look, which source pages or tools to use, and how to answer from evidence with citations."
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="rag-source-locations">Source Locations</Label>
                <Textarea
                  id="rag-source-locations"
                  value={sourceLocationsText}
                  onChange={(event) => setSourceLocationsText(event.target.value)}
                  rows={3}
                  className="font-mono text-xs"
                  placeholder={"https://ciaa.gov.np/reports\nhttps://example.org/report.pdf"}
                />
                <p className="text-xs text-muted-foreground">Use one public URL per line. The skill can convert these through allowed MCP tools.</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="rag-allowed-tools">Allowed MCP Tools</Label>
                <Textarea
                  id="rag-allowed-tools"
                  value={allowedToolsText}
                  onChange={(event) => setAllowedToolsText(event.target.value)}
                  rows={2}
                  className="font-mono text-xs"
                  placeholder="convert_to_markdown"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="rag-priority">Priority</Label>
                  <Input id="rag-priority" type="number" min={1} value={form.priority ?? 100} onChange={(event) => setForm((current) => ({ ...current, priority: Number(event.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rag-max-results">Results</Label>
                  <Input id="rag-max-results" type="number" min={1} value={form.max_results ?? 5} onChange={(event) => setForm((current) => ({ ...current, max_results: Number(event.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rag-min-matches">Matches</Label>
                  <Input id="rag-min-matches" type="number" min={1} value={form.min_keyword_matches ?? 1} onChange={(event) => setForm((current) => ({ ...current, min_keyword_matches: Number(event.target.value) }))} />
                </div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="rag-triggers">Trigger Keywords</Label>
                <Textarea id="rag-triggers" value={triggerText} onChange={(event) => setTriggerText(event.target.value)} rows={4} placeholder={"ciaa annual report\nannual report 2081/82\npublic knowledge"} />
                <p className="text-xs text-muted-foreground">Use one keyword or phrase per line. Commas also work.</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Optional Public Knowledge Cache</Label>
                {publicCollections.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">No indexed public knowledge cache configured. This skill can still use source locations and allowed MCP tools.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {publicCollections.map((collection) => (
                      <label key={collection.id} className="flex min-h-12 items-start gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40">
                        <input type="checkbox" checked={(form.collections ?? []).includes(collection.id)} onChange={() => toggleCollection(collection.id)} className="mt-1" />
                        <span>
                          <span className="block font-medium">{collection.display_name}</span>
                          <span className="block text-xs font-mono text-muted-foreground">{collection.name}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <ToggleRow
                label="Require citations"
                checked={form.requires_citations ?? true}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, requires_citations: checked }))}
              />
              <ToggleRow
                label="Active"
                checked={form.is_active ?? true}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, is_active: checked }))}
              />
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="rag-metadata">Metadata JSON</Label>
                <Textarea id="rag-metadata" value={metadataText} onChange={(event) => setMetadataText(event.target.value)} rows={3} className="font-mono text-xs" placeholder='{"source": "manual-ui"}' />
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

      {profiles.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No retrieval skills yet"
          description="Create one to route public document and evidence questions to the right sources."
          action={<Button size="sm" variant="primary" onClick={startCreate}><Plus className="mr-1 h-4 w-4" /> New Skill</Button>}
        />
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/30">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{profile.display_name || profile.name}</p>
                  {profile.is_active ? <StatusPill tone="green">Active</StatusPill> : <StatusPill>Inactive</StatusPill>}
                  {profile.requires_citations ? <StatusPill tone="blue">Cited</StatusPill> : null}
                </div>
                <p className="font-mono text-xs text-muted-foreground">/{profile.name} · {skillLabel(profile.skill)}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{profile.description}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">Triggers: {(profile.trigger_keywords ?? []).join(", ")}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Edit ${profile.display_name || profile.name}`} onClick={() => startEdit(profile)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" aria-label={`Delete ${profile.display_name || profile.name}`} onClick={() => remove(profile.id)}>
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
