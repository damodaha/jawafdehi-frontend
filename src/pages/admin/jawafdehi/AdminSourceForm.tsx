import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createSource,
  getSource,
  updateSource,
  deleteSource,
  adminErrorMessage,
  type SourceWriteFields,
} from "@/services/admin-api";
import { SOURCE_TYPES, SOURCE_LINK_ROLES } from "@/lib/jawafdehi-forms";
import DeleteButton from "@/components/admin/DeleteButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Save, X } from "lucide-react";

const str = (v: unknown): string => (v == null ? "" : String(v));

interface LinkRow {
  link: string;
  role: string;
}

// Create + edit a document source. Both go over multipart so an optional file
// can ride alongside the metadata (the create route accepts an uploaded file;
// an upload lands as a RAW source link). URL links carry an explicit role.
export default function AdminSourceForm() {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.id ?? "";
  const editing = id !== "";

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState<string>("");
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!editing) return;
    let alive = true;
    setLoading(true);
    getSource<Record<string, unknown>>(id)
      .then((s) => {
        if (!alive) return;
        setTitle(str(s.title));
        setDescription(str(s.description));
        setSourceType(str(s.source_type));
        const urls = Array.isArray(s.urls) ? (s.urls as unknown[]) : [];
        setLinks(
          urls
            .filter((u): u is { link?: unknown; role?: unknown } =>
              Boolean(u) && typeof u === "object",
            )
            .map((u) => ({ link: str(u.link), role: str(u.role) || "PERMALINK" })),
        );
      })
      .catch((err) => alive && setError(adminErrorMessage(err, "Failed to load source")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [editing, id]);

  const addLink = () =>
    setLinks((ls) => [...ls, { link: "", role: "PERMALINK" }]);
  const setLink = (i: number, patch: Partial<LinkRow>) =>
    setLinks((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLink = (i: number) =>
    setLinks((ls) => ls.filter((_, idx) => idx !== i));

  const cleanLinks = links.filter((l) => l.link.trim() !== "");
  const canSave = !saving && title.trim() !== "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);

    const fields: SourceWriteFields = {
      title: title.trim(),
      description: description.trim() || undefined,
      source_type: sourceType || undefined,
      urls: cleanLinks.length
        ? cleanLinks.map((l) => ({ link: l.link.trim(), role: l.role }))
        : undefined,
    };

    try {
      if (editing) {
        await updateSource(id, fields, file);
        toast({ title: "Source updated" });
      } else {
        await createSource(fields, file);
        toast({ title: "Source created" });
      }
      navigate("/admin/jawafdehi/sources");
    } catch (err) {
      setError(adminErrorMessage(err, "Failed to save source"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2"
          onClick={() => navigate("/admin/jawafdehi/sources")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Sources
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {editing ? "Edit Source" : "New Source"}
        </h1>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-1">
          <Label>Source type</Label>
          <Select value={sourceType} onValueChange={setSourceType}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Links</Label>
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={l.link}
                onChange={(e) => setLink(i, { link: e.target.value })}
                placeholder="https://…"
                className="flex-1 text-xs"
              />
              <Select value={l.role} onValueChange={(v) => setLink(i, { role: v })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_LINK_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLink(i)}
                aria-label="Remove link"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addLink}>
            <Plus className="mr-1 h-4 w-4" /> Add link
          </Button>
        </div>

        <div className="space-y-1">
          <Label htmlFor="file">
            {editing ? "Replace file (optional)" : "File (optional)"}
          </Label>
          <Input
            id="file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            An uploaded file is stored and linked as a RAW source link.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={!canSave}>
            {saving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {editing ? "Save changes" : "Create source"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/jawafdehi/sources")}
          >
            Cancel
          </Button>
          {editing && (
            <div className="ml-auto">
              <DeleteButton
                resourceLabel="source"
                onDelete={() => deleteSource(id)}
                onDeleted={() => navigate("/admin/jawafdehi/sources")}
              />
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
