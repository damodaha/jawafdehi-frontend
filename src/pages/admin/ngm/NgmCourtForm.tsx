import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCourt,
  updateCourt,
  getCourt,
  adminErrorMessage,
  type CourtWrite,
} from "@/services/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save } from "lucide-react";

const str = (v: unknown): string => (v == null ? "" : String(v));

// F7 — create + edit a NGM court. `identifier` is the natural key and is locked
// in edit mode. Create POSTs; edit PUTs (replace).
export default function NgmCourtForm() {
  const params = useParams();
  const navigate = useNavigate();
  const editing = Boolean(params.identifier);
  const identifier = params.identifier ?? "";

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CourtWrite>({
    identifier,
    full_name_english: "",
    full_name_nepali: "",
    court_type: "",
  });

  const set = <K extends keyof CourtWrite>(k: K, v: CourtWrite[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!editing) return;
    let alive = true;
    setLoading(true);
    getCourt<Record<string, unknown>>(identifier)
      .then((c) => {
        if (!alive) return;
        setForm({
          identifier: str(c.identifier),
          full_name_english: str(c.full_name_english),
          full_name_nepali: str(c.full_name_nepali),
          court_type: str(c.court_type),
        });
      })
      .catch((err) => alive && setError(adminErrorMessage(err, "Failed to load court")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [editing, identifier]);

  const canSave = !saving && str(form.identifier).trim() !== "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const payload: CourtWrite = {
      ...form,
      full_name_english: form.full_name_english || null,
      full_name_nepali: form.full_name_nepali || null,
      court_type: form.court_type || null,
    };
    try {
      if (editing) {
        await updateCourt(identifier, payload);
        toast({ title: "Court updated" });
      } else {
        await createCourt(payload);
        toast({ title: "Court created" });
      }
      navigate("/admin/ngm/courts");
    } catch (err) {
      setError(adminErrorMessage(err, "Failed to save court"));
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
          onClick={() => navigate("/admin/ngm/courts")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Courts
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {editing ? "Edit Court" : "New Court"}
        </h1>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1">
          <Label htmlFor="identifier">Identifier</Label>
          <Input
            id="identifier"
            value={str(form.identifier)}
            onChange={(e) => set("identifier", e.target.value)}
            disabled={editing}
            className="font-mono text-xs"
            placeholder="special / district-kathmandu"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="en">Full name (English)</Label>
            <Input
              id="en"
              value={str(form.full_name_english)}
              onChange={(e) => set("full_name_english", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ne">Full name (Nepali)</Label>
            <Input
              id="ne"
              value={str(form.full_name_nepali)}
              onChange={(e) => set("full_name_nepali", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="court_type">Court type</Label>
          <Input
            id="court_type"
            value={str(form.court_type)}
            onChange={(e) => set("court_type", e.target.value)}
            placeholder="supreme / high / district / special"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={!canSave}>
            {saving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {editing ? "Save changes" : "Create court"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/ngm/courts")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
