import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCase,
  getCase,
  patchCase,
  deleteCase,
  adminErrorMessage,
} from "@/services/admin-api";
import { diffToPatchOps } from "@/lib/nes-jsonld";
import { CASE_TYPES, CASE_STATES, slugify } from "@/lib/jawafdehi-forms";
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
import { ArrowLeft, Loader2, Save } from "lucide-react";

// Keys the dedicated inputs own — the extra-properties JSON must not set these
// (it would silently shadow a field). Also the immutable/server keys.
const MANAGED_KEYS = new Set([
  "id",
  "case_id",
  "slug",
  "title",
  "case_type",
  "state",
  "short_description",
  "created_at",
  "updated_at",
]);

const str = (v: unknown): string => (v == null ? "" : String(v));

// Create + edit a Jawafdehi corruption case (DISTINCT from an NGM court case).
// Create POSTs the full object; edit sends an RFC-6902 patch (diff of the
// loaded doc vs the edited one), mirroring the NES entity editor.
export default function AdminCaseForm() {
  const params = useParams();
  const navigate = useNavigate();
  const slug = params.slug ?? "";
  const editing = slug !== "";

  const [loaded, setLoaded] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slugField, setSlugField] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [caseType, setCaseType] = useState<string>(CASE_TYPES[0]);
  const [state, setState] = useState<string>(CASE_STATES[0]);
  const [shortDescription, setShortDescription] = useState("");
  const [extraJson, setExtraJson] = useState("");

  const hydrate = useCallback((c: Record<string, unknown>) => {
    setTitle(str(c.title));
    setSlugField(str(c.slug));
    if (typeof c.case_type === "string") setCaseType(c.case_type);
    if (typeof c.state === "string") setState(c.state);
    setShortDescription(str(c.short_description));
    const extra: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(c)) {
      if (MANAGED_KEYS.has(k)) continue;
      extra[k] = v;
    }
    setExtraJson(Object.keys(extra).length ? JSON.stringify(extra, null, 2) : "");
  }, []);

  useEffect(() => {
    if (!editing) return;
    let alive = true;
    setLoading(true);
    getCase<Record<string, unknown>>(slug)
      .then((c) => {
        if (!alive) return;
        setLoaded(c);
        hydrate(c);
      })
      .catch((err) => alive && setError(adminErrorMessage(err, "Failed to load case")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [editing, slug, hydrate]);

  const onTitle = (v: string) => {
    setTitle(v);
    if (!editing && !slugTouched) setSlugField(slugify(v));
  };

  // Parse the extra-properties JSON box (the free-form long tail of the case).
  const { parsedExtra, extraError } = useMemo(() => {
    if (!extraJson.trim()) return { parsedExtra: {}, extraError: null as string | null };
    try {
      const parsed = JSON.parse(extraJson);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { parsedExtra: {}, extraError: "Extra properties must be a JSON object." };
      }
      const clash = Object.keys(parsed).find((k) => MANAGED_KEYS.has(k));
      if (clash) {
        return {
          parsedExtra: {},
          extraError: `"${clash}" is set by the fields above — remove it from extra properties.`,
        };
      }
      return { parsedExtra: parsed as Record<string, unknown>, extraError: null };
    } catch {
      return { parsedExtra: {}, extraError: "Extra properties must be valid JSON." };
    }
  }, [extraJson]);

  // The "after" object the form describes (used for both create and the edit diff).
  const after = useMemo((): Record<string, unknown> => {
    const obj: Record<string, unknown> = {
      title: title.trim(),
      case_type: caseType,
      state,
    };
    if (slugField.trim()) obj.slug = slugField.trim();
    if (shortDescription.trim()) obj.short_description = shortDescription.trim();
    Object.assign(obj, parsedExtra);
    return obj;
  }, [title, caseType, state, slugField, shortDescription, parsedExtra]);

  // In edit mode, the patch is the diff of the managed+extra keys vs the loaded
  // doc. We diff only the keys the form manages so untouched server fields (id,
  // timestamps, …) are never emitted as ops.
  const patchOps = useMemo(() => {
    if (!editing || !loaded || extraError) return [];
    const before: Record<string, unknown> = {};
    const keys = new Set([...Object.keys(after), "short_description", "slug"]);
    for (const k of keys) if (k in loaded) before[k] = loaded[k];
    return diffToPatchOps(before, after);
  }, [editing, loaded, after, extraError]);

  const canSave =
    !saving &&
    !extraError &&
    title.trim() !== "" &&
    (editing ? patchOps.length > 0 : true);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const updated = await patchCase<Record<string, unknown>>(slug, patchOps);
        setLoaded(updated);
        hydrate(updated);
        toast({ title: "Case updated" });
      } else {
        const created = await createCase<Record<string, unknown>>(after);
        toast({ title: "Case created" });
        const newSlug = str(created.slug) || slugField.trim();
        navigate(newSlug ? `/admin/jawafdehi/cases/${newSlug}/edit` : "/admin/jawafdehi/cases");
      }
    } catch (err) {
      setError(adminErrorMessage(err, "Failed to save case"));
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
          onClick={() => navigate("/admin/jawafdehi/cases")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Cases
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {editing ? "Edit Case" : "New Case"}
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
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Oxygen plant procurement scandal"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slugField}
            onChange={(e) => {
              setSlugTouched(true);
              setSlugField(e.target.value);
            }}
            disabled={editing}
            placeholder="oxygen-plant-procurement"
            className="font-mono text-xs"
          />
          {editing && (
            <p className="text-xs text-muted-foreground">
              The slug is the case key and can&apos;t be changed here.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Case type</Label>
            <Select value={caseType} onValueChange={setCaseType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CASE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>State</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CASE_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="short_description">Short description</Label>
          <Textarea
            id="short_description"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="extra">
            Extra properties (JSON, optional) — description, tags,
            key_allegations, dates…
          </Label>
          <Textarea
            id="extra"
            value={extraJson}
            onChange={(e) => setExtraJson(e.target.value)}
            rows={10}
            className="font-mono text-xs"
            placeholder={'{\n  "tags": ["procurement"],\n  "key_allegations": ["…"]\n}'}
          />
          {extraError && <p className="text-xs text-red-600">{extraError}</p>}
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={!canSave}>
            {saving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {editing ? "Save changes" : "Create case"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/jawafdehi/cases")}
          >
            Cancel
          </Button>
          {editing && (
            <div className="ml-auto">
              <DeleteButton
                resourceLabel="case"
                onDelete={() => deleteCase(slug)}
                onDeleted={() => navigate("/admin/jawafdehi/cases")}
              />
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
