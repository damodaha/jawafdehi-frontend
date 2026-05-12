import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Edit2, ExternalLink, FileText, Plus, RefreshCw, Search, Trash2, Upload, X, Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCaseworkerAuth } from "@/context/CaseworkerAuthContext";
import {
  createLLMProvider,
  createMCPServer,
  createPrompt,
  createPublicChatConfig,
  createRAGSkillProfile,
  createSkill,
  deletePrompt,
  deleteRAGSkillProfile,
  deleteSkill,
  importKnowledgeSource,
  listKnowledgeCollections,
  listKnowledgeSources,
  listLLMProviders,
  listMCPServers,
  listPrompts,
  listPublicChatConfigs,
  listRAGSkillProfiles,
  listSkills,
  testLLMConnection,
  testMCPConnection,
  updateLLMProvider,
  updateKnowledgeCollection,
  updateKnowledgeSource,
  updatePrompt,
  updatePublicChatConfig,
  updateRAGSkillProfile,
  updateSkill,
} from "@/services/caseworker-api";
import type { KnowledgeCollection, KnowledgeImportManifest, KnowledgeSource, KnowledgeSourceImportPayload, LLMProvider, MCPServer, Prompt, PublicChatConfig, RAGSkillProfile, Skill } from "@/types/caseworker";

type Tab = "prompts" | "skills" | "knowledge" | "public-chat" | "llm" | "mcp";

function rows<T>(data: { results?: T[] } | T[]): T[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "") || "public_docs";
}

function errorMessage(error: unknown) {
  const responseDetail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof responseDetail === "string" && responseDetail.trim()) {
    return responseDetail;
  }
  return error instanceof Error ? error.message : "Import failed";
}

const SOURCE_TYPE_OPTIONS = [
  { value: "document", label: "Document" },
  { value: "annual_report", label: "Annual Report" },
  { value: "case_evidence", label: "Case Evidence" },
  { value: "court_decision", label: "Court Decision" },
  { value: "law_journal", label: "Law Journal" },
  { value: "faq", label: "FAQ" },
  { value: "methodology", label: "Methodology" },
  { value: "webpage", label: "Webpage" },
  { value: "json", label: "JSON" },
] as const;

const SOURCE_TYPE_VALUES = new Set(SOURCE_TYPE_OPTIONS.map((option) => option.value));

function SourceTypeControl({
  value,
  onChange,
  idPrefix,
}: {
  value: string;
  onChange: (value: string) => void;
  idPrefix: string;
}) {
  const selectedValue = SOURCE_TYPE_VALUES.has(value as (typeof SOURCE_TYPE_OPTIONS)[number]["value"]) ? value : "custom";
  const customValue = selectedValue === "custom" ? value : "";

  return (
    <div className="space-y-1">
      <Label htmlFor={`${idPrefix}-select`}>Source Type</Label>
      <Select
        value={selectedValue}
        onValueChange={(nextValue) => {
          if (nextValue === "custom") {
            onChange(SOURCE_TYPE_VALUES.has(value as (typeof SOURCE_TYPE_OPTIONS)[number]["value"]) ? "" : value);
            return;
          }
          onChange(nextValue);
        }}
      >
        <SelectTrigger id={`${idPrefix}-select`}>
          <SelectValue placeholder="Choose source type" />
        </SelectTrigger>
        <SelectContent>
          {SOURCE_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom...</SelectItem>
        </SelectContent>
      </Select>
      {selectedValue === "custom" ? (
        <Input
          id={`${idPrefix}-custom`}
          value={customValue}
          onChange={(event) => onChange(event.target.value)}
          placeholder="custom_source_type"
        />
      ) : null}
      <p className="text-xs text-muted-foreground">Used as metadata for search filtering; the importer will not guess it.</p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function PromptsTab({ skills }: { skills: Skill[] }) {
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{prompts.length} prompt{prompts.length !== 1 ? "s" : ""} configured</p>
        <Button size="sm" onClick={() => { setForm(blank()); setCreating(true); setEditing(null); setError(""); }}>
          <Plus className="mr-1 h-4 w-4" /> New Prompt
        </Button>
      </div>

      {isOpen ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium">{creating ? "Create Prompt" : "Edit Prompt"}</p>
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
                rows={5}
                placeholder="You are a caseworker assistant. Summarize case {case_data} based on: {query}"
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">Use <code className="bg-muted px-0.5 rounded">{"{case_data}"}</code> and <code className="bg-muted px-0.5 rounded">{"{query}"}</code> as placeholders.</p>
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
                  <label key={skill.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <input type="checkbox" checked={(form.skills ?? []).includes(skill.id)} onChange={() => toggleSkill(skill.id)} />
                    {skill.display_name ?? skill.name}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Check className="mr-1 h-4 w-4" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setEditing(null); setForm({}); setError(""); }}><X className="mr-1 h-4 w-4" /> Cancel</Button>
          </div>
        </div>
      ) : null}

      {prompts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No prompts yet. Create one to get started.</p>
      ) : (
        <div className="space-y-2">
          {prompts.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-2 p-3 border border-border rounded-lg">
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

function SkillsTab({ onSkillsChange }: { onSkillsChange?: (skills: Skill[]) => void }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Skill>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    listSkills().then((data) => {
      const loaded = rows(data);
      setSkills(loaded);
      onSkillsChange?.(loaded);
    });
  }, [onSkillsChange]);

  const blank = (): Partial<Skill> => ({
    name: "",
    display_name: "",
    description: "",
    content: "",
    is_active: true,
  });

  const startEdit = (s: Skill) => {
    setEditing(s);
    setCreating(false);
    setForm(s);
    setError("");
  };

  const save = async () => {
    setError("");
    try {
      if (creating) {
        const created = await createSkill(form);
        setSkills((current) => {
          const next = [...current, created];
          onSkillsChange?.(next);
          return next;
        });
      } else if (editing) {
        const updated = await updateSkill(editing.id, form);
        setSkills((current) => {
          const next = current.map((item) => (item.id === updated.id ? updated : item));
          onSkillsChange?.(next);
          return next;
        });
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
      await deleteSkill(id);
      setSkills((current) => {
        const next = current.filter((item) => item.id !== id);
        onSkillsChange?.(next);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const isOpen = creating || Boolean(editing);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{skills.length} skill{skills.length !== 1 ? "s" : ""} configured</p>
        <Button size="sm" onClick={() => { setForm(blank()); setCreating(true); setEditing(null); setError(""); }}>
          <Plus className="mr-1 h-4 w-4" /> New Skill
        </Button>
      </div>

      {isOpen ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium">{creating ? "Create Skill" : "Edit Skill"}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="skill-name">Name (slug)</Label>
              <Input id="skill-name" value={form.name ?? ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="case-researcher" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="skill-display-name">Display Name</Label>
              <Input id="skill-display-name" value={form.display_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))} placeholder="Case Researcher" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="skill-description">Description</Label>
              <Input id="skill-description" value={form.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="skill-content">Skill Definition (Markdown/Instructions)</Label>
              <Textarea
                id="skill-content"
                value={form.content ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={8}
                placeholder="Instructions for the agent on how to use this skill..."
                className="font-mono text-xs"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
              Active
            </label>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Check className="mr-1 h-4 w-4" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setEditing(null); setForm({}); setError(""); }}><X className="mr-1 h-4 w-4" /> Cancel</Button>
          </div>
        </div>
      ) : null}

      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No skills yet. Create one to get started.</p>
      ) : (
        <div className="space-y-2">
          {skills.map((s) => (
            <div key={s.id} className="flex items-start justify-between gap-2 p-3 border border-border rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{s.display_name ?? s.name}</p>
                <p className="text-xs text-muted-foreground font-mono">/{s.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.description}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Edit ${s.display_name ?? s.name}`} onClick={() => startEdit(s)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" aria-label={`Delete ${s.display_name ?? s.name}`} onClick={() => remove(s.id)}>
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

function KnowledgeTab({
  collections,
  onCollectionsChange,
}: {
  collections: KnowledgeCollection[];
  onCollectionsChange: (collections: KnowledgeCollection[]) => void;
}) {
  const [mode, setMode] = useState<"url" | "upload" | "text" | "manifest">("url");
  const [importOpen, setImportOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("public-docs");
  const [collectionDisplayName, setCollectionDisplayName] = useState("Public Docs");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceType, setSourceType] = useState("document");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [embed, setEmbed] = useState(false);
  const [expandCatalog, setExpandCatalog] = useState(true);
  const [convertLinkedDocuments, setConvertLinkedDocuments] = useState(false);
  const [pages, setPages] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState("");
  const [documentFormat, setDocumentFormat] = useState<"text" | "markdown">("markdown");
  const [manifestText, setManifestText] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [editingCollection, setEditingCollection] = useState<KnowledgeCollection | null>(null);
  const [collectionForm, setCollectionForm] = useState({
    display_name: "",
    description: "",
    access_level: "public" as "private" | "public",
    is_active: true,
  });
  const [editingSource, setEditingSource] = useState<KnowledgeSource | null>(null);
  const [sourceForm, setSourceForm] = useState({
    title: "",
    source_type: "document",
    source_url: "",
    access_level: "public" as "private" | "public",
    is_active: true,
  });
  const [importing, setImporting] = useState(false);
  const [savingCollection, setSavingCollection] = useState(false);
  const [savingSource, setSavingSource] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const publicCollections = collections.filter((collection) => collection.access_level === "public");
  const selectedCollection = collections.find((collection) => collection.id === selectedCollectionId) ?? collections[0] ?? null;

  useEffect(() => {
    if (!selectedCollectionId && collections.length > 0) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId]);

  useEffect(() => {
    if (!selectedCollectionId) {
      setSources([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setSourcesLoading(true);
      listKnowledgeSources({ collection: selectedCollectionId, search: sourceSearch || undefined })
        .then((data) => setSources(rows(data)))
        .catch((err) => setError(errorMessage(err)))
        .finally(() => setSourcesLoading(false));
    }, sourceSearch ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [selectedCollectionId, sourceSearch]);

  const upsertCollection = (collection: KnowledgeCollection) => {
    onCollectionsChange(
      collections.some((item) => item.id === collection.id)
        ? collections.map((item) => item.id === collection.id ? collection : item)
        : [...collections, collection],
    );
  };

  const refreshSources = async (collectionId = selectedCollectionId) => {
    if (!collectionId) return;
    setSourcesLoading(true);
    try {
      const data = await listKnowledgeSources({ collection: collectionId, search: sourceSearch || undefined });
      setSources(rows(data));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSourcesLoading(false);
    }
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    setError("");
    setSelectedFile(file);
    setMode("upload");
    setSourceTitle((current) => current || file.name.replace(/\.[^.]+$/, ""));
  };

  const handleManifestFile = async (file: File | null) => {
    if (!file) return;
    setError("");
    const text = await file.text();
    if (file.name.toLowerCase().endsWith(".json")) {
      setMode("manifest");
      setManifestText(text);
      return;
    }
    setMode("upload");
    setSelectedFile(file);
    setSourceTitle((current) => current || file.name.replace(/\.[^.]+$/, ""));
  };

  const useCollectionForImport = (collection: KnowledgeCollection) => {
    setCollectionName(collection.name);
    setCollectionDisplayName(collection.display_name || collection.name);
    setIsPublic(collection.access_level === "public");
    setImportOpen(true);
  };

  const startEditCollection = (collection: KnowledgeCollection) => {
    setEditingCollection(collection);
    setCollectionForm({
      display_name: collection.display_name,
      description: collection.description || "",
      access_level: collection.access_level,
      is_active: collection.is_active,
    });
    setError("");
    setSuccess("");
  };

  const saveCollection = async () => {
    if (!editingCollection) return;
    setError("");
    setSuccess("");
    setSavingCollection(true);
    try {
      const updated = await updateKnowledgeCollection(editingCollection.id, collectionForm);
      upsertCollection(updated);
      setEditingCollection(updated);
      setSuccess(`Updated ${updated.display_name}.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingCollection(false);
    }
  };

  const startEditSource = (source: KnowledgeSource) => {
    setEditingSource(source);
    setSourceForm({
      title: source.title,
      source_type: source.source_type || "document",
      source_url: source.source_url || "",
      access_level: source.access_level,
      is_active: source.is_active,
    });
    setError("");
    setSuccess("");
  };

  const saveSource = async () => {
    if (!editingSource) return;
    setError("");
    setSuccess("");
    setSavingSource(true);
    try {
      const updated = await updateKnowledgeSource(editingSource.id, sourceForm);
      setSources((current) => current.map((source) => source.id === updated.id ? { ...source, ...updated } : source));
      setEditingSource(updated);
      setSuccess(`Updated ${updated.title}.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingSource(false);
    }
  };

  const save = async () => {
    setError("");
    setSuccess("");
    setImporting(true);
    try {
      let payload: KnowledgeSourceImportPayload = {
        collection_name: slugify(collectionName),
        collection_display_name: collectionDisplayName || collectionName,
        source_title: sourceTitle,
        source_type: sourceType || "document",
        access_level: isPublic ? "public" as const : "private" as const,
        embed,
        pages: pages.trim() || undefined,
        expand_catalog: expandCatalog,
        convert_linked_documents: convertLinkedDocuments,
      };

      if (mode === "manifest") {
        const parsed = JSON.parse(manifestText || "{}") as unknown;
        payload = { ...payload, manifest: parsed as KnowledgeImportManifest };
      } else if (mode === "url") {
        if (!sourceUrl.trim()) {
          setError("Source URL is required.");
          return;
        }
        payload = { ...payload, source_url: sourceUrl.trim() };
      } else if (mode === "upload") {
        if (!selectedFile) {
          setError("Choose a file to upload.");
          return;
        }
        payload = { ...payload, file: selectedFile };
      } else {
        if (!documentText.trim()) {
          setError("Document text is required.");
          return;
        }
        payload = documentFormat === "markdown"
          ? { ...payload, markdown: documentText }
          : { ...payload, text: documentText };
      }

      const result = await importKnowledgeSource(payload);
      upsertCollection(result.collection);
      setSelectedCollectionId(result.collection.id);
      void refreshSources(result.collection.id);
      const failureText = result.failures.length
        ? ` ${result.failures.length} item${result.failures.length !== 1 ? "s" : ""} failed.`
        : "";
      setSuccess(
        `Imported ${result.sources_imported} source${result.sources_imported !== 1 ? "s" : ""}, ${result.chunks_imported} chunk${result.chunks_imported !== 1 ? "s" : ""}, and ${result.embeddings_imported} embedding${result.embeddings_imported !== 1 ? "s" : ""} into ${result.collection.display_name}.${failureText}`,
      );
      setImportOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Knowledge Library</p>
          <p className="text-xs text-muted-foreground">Manage collections and the documents the public chat agent can retrieve.</p>
        </div>
        <Button size="sm" onClick={() => setImportOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Import Source
        </Button>
      </div>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Knowledge Collections</p>
            <p className="text-xs text-muted-foreground">{publicCollections.length} public collection{publicCollections.length !== 1 ? "s" : ""} available for public chat RAG</p>
          </div>
          {collections.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">No collections imported yet.</p>
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => setSelectedCollectionId(collection.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedCollectionId === collection.id ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/40"}`}
                >
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{collection.display_name}</p>
                    {collection.access_level === "public" ? <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">Public</span> : null}
                    {!collection.is_active ? <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">Inactive</span> : null}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">/{collection.name}</p>
                  {collection.description ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{collection.description}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); useCollectionForImport(collection); }}>
                      Use
                    </Button>
                    <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); startEditCollection(collection); }}>
                      <Edit2 className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-background">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">{selectedCollection?.display_name ?? "Documents"}</p>
                <p className="text-xs text-muted-foreground">{sources.length} document{sources.length !== 1 ? "s" : ""}{selectedCollection ? ` in /${selectedCollection.name}` : ""}</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" value={sourceSearch} onChange={(event) => setSourceSearch(event.target.value)} placeholder="Search documents" />
              </div>
            </div>
            {sourcesLoading ? (
              <p className="px-4 py-8 text-sm text-muted-foreground">Loading documents...</p>
            ) : sources.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">No documents found</p>
                <p className="text-xs text-muted-foreground">Import a source into this collection to make it searchable.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sources.map((source) => (
                  <div key={source.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{source.title}</p>
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{source.source_type || "document"}</span>
                        {source.access_level === "public" ? <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">Public</span> : null}
                        {!source.is_active ? <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">Inactive</span> : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{source.source_url || "No public URL"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{source.chunk_count ?? 0} chunk{source.chunk_count === 1 ? "" : "s"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {source.source_url ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={source.source_url} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-1 h-3.5 w-3.5" />
                            Open
                          </a>
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" onClick={() => startEditSource(source)}>
                        <Edit2 className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Knowledge Source</DialogTitle>
            <DialogDescription>Add a URL, upload, pasted content, or manifest. Catalog URLs expand into individual documents.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="inline-flex flex-wrap rounded-lg border border-border bg-background p-1">
              {(["url", "upload", "text", "manifest"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {item === "url" ? "Source URL" : item === "upload" ? "Upload File" : item === "text" ? "Paste Text" : "Manifest JSON"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="knowledge-collection-name">Collection Name</Label>
                <Input id="knowledge-collection-name" value={collectionName} onChange={(event) => setCollectionName(event.target.value)} placeholder="ciaa_annual_reports" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="knowledge-collection-display">Collection Display Name</Label>
                <Input id="knowledge-collection-display" value={collectionDisplayName} onChange={(event) => setCollectionDisplayName(event.target.value)} placeholder="CIAA Annual Reports" />
              </div>
              {collections.length ? (
                <div className="space-y-1 sm:col-span-2">
                  <Label>Use Existing Collection</Label>
                  <Select value={selectedCollectionId ? String(selectedCollectionId) : ""} onValueChange={(value) => {
                    const collection = collections.find((item) => item.id === Number(value));
                    if (collection) useCollectionForImport(collection);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={String(collection.id)}>{collection.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="space-y-1">
                <Label htmlFor="knowledge-source-title">Source Title</Label>
                <Input id="knowledge-source-title" value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} placeholder="Optional; inferred for URLs/files" />
              </div>
              <SourceTypeControl value={sourceType} onChange={setSourceType} idPrefix="knowledge-source-type" />

              {mode === "url" ? (
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="knowledge-source-url">Source URL</Label>
                  <Input id="knowledge-source-url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://ngm-store.jawafdehi.org/indices/2026-05-11/index.ciaa-annual-reports.json" />
                </div>
              ) : null}

              {mode === "upload" ? (
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="knowledge-file">Upload File</Label>
                  <Input id="knowledge-file" type="file" onChange={(event) => handleFile(event.target.files?.[0] ?? null)} />
                  {selectedFile ? <p className="text-xs text-muted-foreground">{selectedFile.name}</p> : null}
                </div>
              ) : null}

              {mode === "text" ? (
                <div className="space-y-2 sm:col-span-2">
                  <div className="inline-flex rounded-lg border border-border bg-background p-1">
                    {(["markdown", "text"] as const).map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setDocumentFormat(format)}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium ${documentFormat === format ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {format === "markdown" ? "Markdown" : "Plain Text"}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="knowledge-document-text">Document Content</Label>
                    <Textarea id="knowledge-document-text" value={documentText} onChange={(event) => setDocumentText(event.target.value)} rows={12} className="font-mono text-xs" placeholder="Paste public knowledge content here." />
                  </div>
                </div>
              ) : null}

              {mode === "manifest" ? (
                <div className="space-y-2 sm:col-span-2">
                  <label className="inline-flex cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload JSON
                    <input type="file" accept=".json,application/json" className="sr-only" onChange={(event) => void handleManifestFile(event.target.files?.[0] ?? null)} />
                  </label>
                  <div className="space-y-1">
                    <Label htmlFor="knowledge-manifest">Manifest JSON</Label>
                    <Textarea id="knowledge-manifest" value={manifestText} onChange={(event) => setManifestText(event.target.value)} rows={14} className="font-mono text-xs" placeholder='{"collection":{"name":"ciaa_annual_reports","access_level":"public"},"source":{"title":"CIAA Annual Report","source_url":"https://...","access_level":"public"},"chunks":[{"text":"..."}]}' />
                  </div>
                </div>
              ) : null}

              <div className="space-y-1">
                <Label htmlFor="knowledge-pages">PDF Pages</Label>
                <Input id="knowledge-pages" value={pages} onChange={(event) => setPages(event.target.value)} placeholder="Optional, e.g. 12-15" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
                Publicly retrievable
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={embed} onChange={(event) => setEmbed(event.target.checked)} />
                Generate embeddings
              </label>
              {mode === "url" ? (
                <>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={expandCatalog} onChange={(event) => setExpandCatalog(event.target.checked)} />
                    Expand catalog/index if detected
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={convertLinkedDocuments} onChange={(event) => setConvertLinkedDocuments(event.target.checked)} />
                    Convert linked documents now
                  </label>
                </>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={importing}>
              {importing ? <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingCollection)} onOpenChange={(open) => !open && setEditingCollection(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>{editingCollection ? `/${editingCollection.name}` : ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-collection-display">Display Name</Label>
              <Input id="edit-collection-display" value={collectionForm.display_name} onChange={(event) => setCollectionForm((current) => ({ ...current, display_name: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-collection-description">Description</Label>
              <Textarea id="edit-collection-description" value={collectionForm.description} onChange={(event) => setCollectionForm((current) => ({ ...current, description: event.target.value }))} rows={3} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={collectionForm.access_level === "public"} onChange={(event) => setCollectionForm((current) => ({ ...current, access_level: event.target.checked ? "public" : "private" }))} />
              Publicly retrievable
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={collectionForm.is_active} onChange={(event) => setCollectionForm((current) => ({ ...current, is_active: event.target.checked }))} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCollection(null)}>Cancel</Button>
            <Button onClick={saveCollection} disabled={savingCollection}>
              {savingCollection ? <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingSource)} onOpenChange={(open) => !open && setEditingSource(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>{editingSource ? editingSource.collection_name : ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-source-title">Title</Label>
              <Input id="edit-source-title" value={sourceForm.title} onChange={(event) => setSourceForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <SourceTypeControl
              value={sourceForm.source_type}
              onChange={(value) => setSourceForm((current) => ({ ...current, source_type: value }))}
              idPrefix="edit-source-type"
            />
            <div className="space-y-1">
              <Label htmlFor="edit-source-url">Source URL</Label>
              <Input id="edit-source-url" value={sourceForm.source_url} onChange={(event) => setSourceForm((current) => ({ ...current, source_url: event.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sourceForm.access_level === "public"} onChange={(event) => setSourceForm((current) => ({ ...current, access_level: event.target.checked ? "public" : "private" }))} />
              Publicly retrievable
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sourceForm.is_active} onChange={(event) => setSourceForm((current) => ({ ...current, is_active: event.target.checked }))} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSource(null)}>Cancel</Button>
            <Button onClick={saveSource} disabled={savingSource}>
              {savingSource ? <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RAGSkillsTab({
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{profiles.length} skill{profiles.length !== 1 ? "s" : ""} configured</p>
        <Button size="sm" onClick={startCreate}><Plus className="mr-1 h-4 w-4" /> New Skill</Button>
      </div>

      {isOpen ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium">{creating ? "Create Skill" : "Edit Skill"}</p>
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
            <div className="grid grid-cols-3 gap-3">
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
                    <label key={collection.id} className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
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
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.requires_citations ?? true} onChange={(event) => setForm((current) => ({ ...current, requires_citations: event.target.checked }))} />
              Require citations
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active ?? true} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
              Active
            </label>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="rag-metadata">Metadata JSON</Label>
              <Textarea id="rag-metadata" value={metadataText} onChange={(event) => setMetadataText(event.target.value)} rows={3} className="font-mono text-xs" placeholder='{"source": "manual-ui"}' />
            </div>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Check className="mr-1 h-4 w-4" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={cancel}><X className="mr-1 h-4 w-4" /> Cancel</Button>
          </div>
        </div>
      ) : null}

      {profiles.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No skills yet. Create one to route public document and evidence questions.</p>
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex items-start justify-between gap-2 rounded-lg border border-border p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{profile.display_name || profile.name}</p>
                  {profile.is_active ? <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">Active</span> : null}
                  {profile.requires_citations ? <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">Cited</span> : null}
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


function PublicChatTab({
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
        <label className="flex items-center gap-2 pt-7 text-sm">
          <input type="checkbox" checked={form.enabled ?? true} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} />
          Enabled
        </label>
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
      <Button size="sm" onClick={save}><Check className="mr-1 h-4 w-4" /> Save Public Chat Config</Button>
    </div>
  );
}

const providerTypes: LLMProvider["provider_type"][] = ["anthropic", "openai", "google", "ollama", "azure", "custom"];
const structuredOutputModes: LLMProvider["structured_output_mode"][] = ["auto", "provider_native", "tool_calling"];

function providerLabel(provider: LLMProvider) {
  const label = provider.display_name || provider.name;
  return `${label} (${provider.provider_type} - ${provider.model})`;
}

function LLMTab() {
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{providers.length} provider{providers.length !== 1 ? "s" : ""} configured</p>
        <Button size="sm" onClick={() => { setForm(blank()); setExtraConfigText("{}"); setCreating(true); setEditing(null); setError(""); }}><Plus className="mr-1 h-4 w-4" /> Add Provider</Button>
      </div>

      {isOpen && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/20">
          <p className="font-medium text-sm">{creating ? "Add LLM Provider" : "Edit LLM Provider"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
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
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
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
            <label className="flex items-center gap-2 text-sm pt-2">
              <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm pt-2">
              <input type="checkbox" checked={form.is_default ?? false} onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))} />
              Default Provider
            </label>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="llm-extra-config">Extra Config JSON</Label>
              <Textarea id="llm-extra-config" value={extraConfigText} onChange={(e) => setExtraConfigText(e.target.value)} rows={4} placeholder='{"timeout": 30}' />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Check className="h-4 w-4 mr-1" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={cancel}><X className="h-4 w-4 mr-1" /> Cancel</Button>
          </div>
        </div>
      )}

      {providers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No LLM providers configured.</p>
      ) : (
        <div className="space-y-2">
          {providers.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 p-3 border border-border rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{p.display_name || p.name}</p>
                  {p.is_default && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Default</span>}
                  {p.is_active && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Active</span>}
                  {status[p.id] === true && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Zap className="h-3 w-3" /> Connected</span>}
                  {status[p.id] === false && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Failed</span>}
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

function MCPTab() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<MCPServer> & { auth_token?: string }>({});
  const [testing, setTesting] = useState<number | null>(null);
  const [status, setStatus] = useState<Record<number, boolean | null>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    listMCPServers().then((data) => setServers(data.results ?? []));
  }, []);

  const cancel = () => {
    setCreating(false);
    setForm({});
    setError("");
  };

  const save = async () => {
    setError("");
    try {
      const created = await createMCPServer(form as Partial<MCPServer> & { auth_token: string });
      setServers((current) => [...current, created]);
      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const test = async (id: number) => {
    setTesting(id);
    try {
      const result = await testMCPConnection(id);
      setStatus((current) => ({ ...current, [id]: result.connected }));
    } catch {
      setStatus((current) => ({ ...current, [id]: false }));
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{servers.length} server{servers.length !== 1 ? "s" : ""} configured</p>
        <Button size="sm" onClick={() => { setCreating(true); setForm({ name: "", display_name: "", url: "", auth_type: "bearer", auth_token: "" }); setError(""); }}><Plus className="mr-1 h-4 w-4" /> Add Server</Button>
      </div>

      {creating && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/20">
          <p className="font-medium text-sm">Add MCP Server</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="mcp-name">Name</Label>
              <Input id="mcp-name" value={form.name ?? ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="case-system" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mcp-display-name">Display Name</Label>
              <Input id="mcp-display-name" value={form.display_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))} placeholder="Case Management System" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="mcp-url">URL</Label>
              <Input id="mcp-url" value={form.url ?? ""} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://api.example.com/mcp" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mcp-auth-type">Auth Type</Label>
              <select
                id="mcp-auth-type"
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={form.auth_type ?? "bearer"}
                onChange={(e) => setForm((p) => ({ ...p, auth_type: e.target.value as MCPServer["auth_type"] }))}
              >
                <option value="bearer">Bearer Token</option>
                <option value="api_key">API Key</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="mcp-auth-token">Auth Token</Label>
              <Input id="mcp-auth-token" type="password" value={form.auth_token ?? ""} onChange={(e) => setForm((p) => ({ ...p, auth_token: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Check className="h-4 w-4 mr-1" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={cancel}><X className="h-4 w-4 mr-1" /> Cancel</Button>
          </div>
        </div>
      )}
      {servers.map((server) => (
        <div key={server.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">{server.display_name ?? server.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{server.url}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => test(server.id)} disabled={testing === server.id}>
            {status[server.id] === true ? <Zap className="mr-1 h-3 w-3" /> : <RefreshCw className={`mr-1 h-3 w-3 ${testing === server.id ? "animate-spin" : ""}`} />}
            Test
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function CaseworkerSettings() {
  const { isAdmin } = useCaseworkerAuth();
  const [tab, setTab] = useState<Tab>("prompts");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [knowledgeCollections, setKnowledgeCollections] = useState<KnowledgeCollection[]>([]);
  const [ragSkillProfiles, setRAGSkillProfiles] = useState<RAGSkillProfile[]>([]);

  useEffect(() => {
    Promise.all([listSkills(), listPrompts(), listLLMProviders(), listKnowledgeCollections(), listRAGSkillProfiles()]).then(([skillsData, promptsData, providersData, knowledgeData, ragSkillData]) => {
      setSkills(rows(skillsData));
      setPrompts(rows(promptsData));
      setProviders(providersData.results ?? []);
      setKnowledgeCollections(rows(knowledgeData));
      setRAGSkillProfiles(rows(ragSkillData));
    });
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/20">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Access denied. Administrator role required.</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "prompts", label: "Prompts" },
    { id: "skills", label: "Skills" },
    { id: "knowledge", label: "Knowledge" },
    { id: "public-chat", label: "Public Chat" },
    { id: "llm", label: "LLM Providers" },
    { id: "mcp", label: "MCP Servers" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <div className="container mx-auto max-w-4xl flex-1 px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/caseworker/dashboard"><ArrowLeft className="mr-1 h-4 w-4" /> Dashboard</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Configure prompts, skills, knowledge, public chat limits, LLM providers, and MCP servers</p>
          </div>
        </div>

        <div className="mb-5 flex gap-1 border-b border-border">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${tab === item.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <SectionCard title={tabs.find((item) => item.id === tab)?.label ?? "Settings"}>
          {tab === "prompts" ? <PromptsTab skills={skills} /> : null}
          {tab === "skills" ? <RAGSkillsTab skills={skills} knowledgeCollections={knowledgeCollections} onProfilesChange={setRAGSkillProfiles} onSkillsChange={setSkills} /> : null}
          {tab === "knowledge" ? <KnowledgeTab collections={knowledgeCollections} onCollectionsChange={setKnowledgeCollections} /> : null}
          {tab === "public-chat" ? <PublicChatTab prompts={prompts} providers={providers} /> : null}
          {tab === "llm" ? <LLMTab /> : null}
          {tab === "mcp" ? <MCPTab /> : null}
        </SectionCard>
      </div>
    </div>
  );
}
