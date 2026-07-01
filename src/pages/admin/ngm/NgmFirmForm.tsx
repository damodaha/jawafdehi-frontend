import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createFirm,
  updateFirm,
  getFirm,
  adminErrorMessage,
  type FirmWrite,
} from "@/services/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save } from "lucide-react";

const str = (v: unknown): string => (v == null ? "" : String(v));

// F7 — create + edit a blocklisted firm. The record is keyed by its numeric
// `id` (the PK; firm names are not unique). Fields mirror BlacklistedFirmSerializer.
// Create POSTs; edit PATCHes.
export default function NgmFirmForm() {
  const params = useParams();
  const navigate = useNavigate();
  const editing = Boolean(params.id);
  const id = params.id ?? "";

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FirmWrite>({
    firm_name: "",
    proprietor_name: "",
    address: "",
    reason: "",
    recommending_office: "",
    blacklist_date_bs: "",
    blacklist_date_ad: "",
    effective_until_bs: "",
    effective_until_ad: "",
    duration: "",
    nes_id: "",
  });

  const set = <K extends keyof FirmWrite>(k: K, v: FirmWrite[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!editing) return;
    let alive = true;
    setLoading(true);
    getFirm<Record<string, unknown>>(id)
      .then((f) => {
        if (!alive) return;
        setForm({
          firm_name: str(f.firm_name),
          proprietor_name: str(f.proprietor_name),
          address: str(f.address),
          reason: str(f.reason),
          recommending_office: str(f.recommending_office),
          blacklist_date_bs: str(f.blacklist_date_bs),
          blacklist_date_ad: str(f.blacklist_date_ad),
          effective_until_bs: str(f.effective_until_bs),
          effective_until_ad: str(f.effective_until_ad),
          duration: str(f.duration),
          nes_id: str(f.nes_id),
        });
      })
      .catch((err) => alive && setError(adminErrorMessage(err, "Failed to load firm")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [editing, id]);

  const canSave = !saving && str(form.firm_name).trim() !== "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    // Blank optional fields → null so the backend clears rather than stores "".
    const payload: FirmWrite = {
      firm_name: str(form.firm_name).trim(),
      proprietor_name: form.proprietor_name || null,
      address: form.address || null,
      reason: form.reason || null,
      recommending_office: form.recommending_office || null,
      blacklist_date_bs: form.blacklist_date_bs || null,
      blacklist_date_ad: form.blacklist_date_ad || null,
      effective_until_bs: form.effective_until_bs || null,
      effective_until_ad: form.effective_until_ad || null,
      duration: form.duration || null,
      nes_id: form.nes_id || null,
    };
    try {
      if (editing) {
        await updateFirm(id, payload);
        toast({ title: "Firm updated" });
      } else {
        await createFirm(payload);
        toast({ title: "Firm created" });
      }
      navigate("/admin/ngm/firms");
    } catch (err) {
      setError(adminErrorMessage(err, "Failed to save firm"));
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
          onClick={() => navigate("/admin/ngm/firms")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Firms
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {editing ? "Edit Firm" : "New Firm"}
        </h1>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="firm_name">Firm name</Label>
            <Input
              id="firm_name"
              value={str(form.firm_name)}
              onChange={(e) => set("firm_name", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="proprietor_name">Proprietor</Label>
            <Input
              id="proprietor_name"
              value={str(form.proprietor_name)}
              onChange={(e) => set("proprietor_name", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={str(form.address)}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            value={str(form.reason)}
            onChange={(e) => set("reason", e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="recommending_office">Recommending office</Label>
          <Input
            id="recommending_office"
            value={str(form.recommending_office)}
            onChange={(e) => set("recommending_office", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="bl_ad">Blocklisted date (AD)</Label>
            <Input
              id="bl_ad"
              type="date"
              value={str(form.blacklist_date_ad)}
              onChange={(e) => set("blacklist_date_ad", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bl_bs">Blocklisted date (BS)</Label>
            <Input
              id="bl_bs"
              value={str(form.blacklist_date_bs)}
              onChange={(e) => set("blacklist_date_bs", e.target.value)}
              placeholder="2080-09-18"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="eu_ad">Effective until (AD)</Label>
            <Input
              id="eu_ad"
              type="date"
              value={str(form.effective_until_ad)}
              onChange={(e) => set("effective_until_ad", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="eu_bs">Effective until (BS)</Label>
            <Input
              id="eu_bs"
              value={str(form.effective_until_bs)}
              onChange={(e) => set("effective_until_bs", e.target.value)}
              placeholder="2081-03-05"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              value={str(form.duration)}
              onChange={(e) => set("duration", e.target.value)}
              placeholder="e.g. 1 year"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nes_id">NES entity @id (optional)</Label>
            <Input
              id="nes_id"
              value={str(form.nes_id)}
              onChange={(e) => set("nes_id", e.target.value)}
              className="font-mono text-xs"
              placeholder="https://…/entity/…"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={!canSave}>
            {saving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {editing ? "Save changes" : "Create firm"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/ngm/firms")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
