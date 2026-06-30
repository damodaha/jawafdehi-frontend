import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createNesEntity,
  adminErrorMessage,
  type CreateEntityPayload,
} from "@/services/admin-api";
import {
  ALL_ENTITY_TYPES,
  PREFIX_RE,
  SLUG_RE,
  slugify,
} from "@/lib/nes-jsonld";
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
import { ArrowLeft, Loader2 } from "lucide-react";

// Create a NES entity using the backend "authoring shape": prefix + slug +
// @type + bilingual name, plus optional free-form schema.org properties
// (description, sameAs, …) entered as JSON and merged in verbatim.
export default function NesEntityCreate() {
  const navigate = useNavigate();
  const [prefix, setPrefix] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [type, setType] = useState<string>("Person");
  const [nameEn, setNameEn] = useState("");
  const [nameNe, setNameNe] = useState("");
  const [extraJson, setExtraJson] = useState("");
  const [changeDescription, setChangeDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-derive the slug from the English name until the user edits it.
  const onNameEn = (v: string) => {
    setNameEn(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const prefixValid = prefix === "" || PREFIX_RE.test(prefix);
  const slugValid = slug === "" || SLUG_RE.test(slug);
  const nameValid = nameEn.trim() !== "" || nameNe.trim() !== "";

  // Keys the form owns. If the extra-properties JSON sets any of these it would
  // silently override the identity/name inputs — and an "@id" specifically
  // flips the backend into full-JSON-LD mode (ignoring prefix/slug/type). Reject
  // them so the form's fields stay authoritative.
  const RESERVED_EXTRA_KEYS = new Set([
    "@id",
    "@type",
    "@context",
    "type",
    "prefix",
    "entity_prefix",
    "slug",
    "name",
    "change_description",
  ]);

  let extraError: string | null = null;
  let parsedExtra: Record<string, unknown> = {};
  if (extraJson.trim()) {
    try {
      const parsed = JSON.parse(extraJson);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        parsedExtra = parsed as Record<string, unknown>;
        const clash = Object.keys(parsedExtra).find((k) =>
          RESERVED_EXTRA_KEYS.has(k),
        );
        if (clash) {
          extraError = `"${clash}" is set by the fields above — remove it from extra properties.`;
        }
      } else {
        extraError = "Extra properties must be a JSON object.";
      }
    } catch {
      extraError = "Extra properties must be valid JSON.";
    }
  }

  const canSubmit =
    prefix.trim() !== "" &&
    prefixValid &&
    slug.trim() !== "" &&
    slugValid &&
    nameValid &&
    !extraError &&
    !submitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const name: Record<string, string> = {};
    if (nameEn.trim()) name.en = nameEn.trim();
    if (nameNe.trim()) name.ne = nameNe.trim();

    const payload: CreateEntityPayload = {
      prefix: prefix.trim(),
      slug: slug.trim(),
      type,
      name,
      ...parsedExtra,
      change_description: changeDescription.trim() || "Created via admin panel",
    };

    try {
      const created = await createNesEntity(payload);
      toast({ title: "Entity created", description: created["@id"] });
      // Route to the edit view of the new entity (ref = prefix/slug).
      navigate(`/admin/nes/entities/edit/${prefix.trim()}/${slug.trim()}`);
    } catch (err) {
      setError(adminErrorMessage(err, "Failed to create entity"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2"
          onClick={() => navigate("/admin/nes/entities")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Entities
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">New NES Entity</h1>
        <p className="text-sm text-muted-foreground">
          Identity (prefix + slug + type) and bilingual name. The{" "}
          <code>@id</code> IRI is built from prefix/slug.
        </p>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="prefix">Prefix</Label>
            <Input
              id="prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="person, organization, location/district…"
            />
            {!prefixValid && (
              <p className="text-xs text-red-600">
                Lowercase letters/digits/_ segments joined by “/”.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="ram-bahadur"
            />
            {!slugValid && (
              <p className="text-xs text-red-600">
                Lowercase, alphanumeric, hyphen-separated.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label>Type (@type)</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_ENTITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="name-en">Name (English)</Label>
            <Input
              id="name-en"
              value={nameEn}
              onChange={(e) => onNameEn(e.target.value)}
              placeholder="Ram Bahadur"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name-ne">Name (Nepali)</Label>
            <Input
              id="name-ne"
              value={nameNe}
              onChange={(e) => setNameNe(e.target.value)}
              placeholder="राम बहादुर"
            />
          </div>
        </div>
        {!nameValid && (
          <p className="-mt-3 text-xs text-red-600">
            At least one of English / Nepali name is required.
          </p>
        )}

        <div className="space-y-1">
          <Label htmlFor="extra">Extra properties (JSON, optional)</Label>
          <Textarea
            id="extra"
            value={extraJson}
            onChange={(e) => setExtraJson(e.target.value)}
            rows={6}
            className="font-mono text-xs"
            placeholder={'{\n  "description": {"en": "…"},\n  "sameAs": ["https://…"]\n}'}
          />
          {extraError && <p className="text-xs text-red-600">{extraError}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="change">Change description</Label>
          <Input
            id="change"
            value={changeDescription}
            onChange={(e) => setChangeDescription(e.target.value)}
            placeholder="Created via admin panel"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={!canSubmit}>
            {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Create entity
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/nes/entities")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
