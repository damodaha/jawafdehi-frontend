import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCourtCase,
  updateCourtCase,
  getCourtCase,
  listCourts,
  adminErrorMessage,
  type CourtCaseWrite,
} from "@/services/admin-api";
import { isValidEntityIri } from "@/lib/ngm-forms";
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

interface CourtOption {
  identifier: string;
  full_name_english?: string | null;
  full_name_nepali?: string;
}

const str = (v: unknown): string => (v == null ? "" : String(v));

// Create + edit a NGM court case. The natural key is (court, case_number); in
// edit mode both come from the route and are locked (they're the PK).
export default function NgmCourtCaseForm() {
  const params = useParams();
  const navigate = useNavigate();
  const editing = Boolean(params.court && params.caseNumber);

  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CourtCaseWrite>({
    case_number: params.caseNumber ?? "",
    court_identifier: params.court ?? "",
    registration_date_bs: "",
    registration_date_ad: "",
    case_type: "",
    case_status: "",
    plaintiff: "",
    defendant: "",
    nes_id: "",
  });

  const set = <K extends keyof CourtCaseWrite>(k: K, v: CourtCaseWrite[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    listCourts<CourtOption>()
      .then((res) => setCourts(res.results ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!editing) return;
    let alive = true;
    setLoading(true);
    getCourtCase<Record<string, unknown>>(params.court!, params.caseNumber!)
      .then((c) => {
        if (!alive) return;
        setForm({
          case_number: str(c.case_number),
          court_identifier: str(c.court_identifier),
          registration_date_bs: str(c.registration_date_bs),
          registration_date_ad: str(c.registration_date_ad),
          case_type: str(c.case_type),
          case_status: str(c.case_status),
          plaintiff: str(c.plaintiff),
          defendant: str(c.defendant),
          nes_id: str(c.nes_id),
        });
      })
      .catch((err) => alive && setError(adminErrorMessage(err, "Failed to load case")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [editing, params.court, params.caseNumber]);

  const nesIdValid = !form.nes_id || isValidEntityIri(form.nes_id);
  const canSave =
    !saving &&
    form.case_number.trim() !== "" &&
    form.court_identifier.trim() !== "" &&
    nesIdValid;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);

    // Send empty optional strings as null so the backend stores NULL, not "".
    const payload: CourtCaseWrite = {
      ...form,
      registration_date_bs: form.registration_date_bs || null,
      registration_date_ad: form.registration_date_ad || null,
      case_type: form.case_type || null,
      case_status: form.case_status || null,
      plaintiff: form.plaintiff || null,
      defendant: form.defendant || null,
      nes_id: form.nes_id || null,
    };

    try {
      if (editing) {
        await updateCourtCase(params.court!, params.caseNumber!, payload);
        toast({ title: "Case updated" });
      } else {
        await createCourtCase(payload);
        toast({ title: "Case created" });
      }
      navigate("/admin/ngm/courtcases");
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
          onClick={() => navigate("/admin/ngm/courtcases")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Court cases
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {editing ? "Edit Court Case" : "New Court Case"}
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
            <Label>Court</Label>
            <Select
              value={form.court_identifier}
              onValueChange={(v) => set("court_identifier", v)}
              disabled={editing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a court" />
              </SelectTrigger>
              <SelectContent>
                {courts.map((c) => (
                  <SelectItem key={c.identifier} value={c.identifier}>
                    {c.full_name_english || c.full_name_nepali || c.identifier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="case_number">Case number</Label>
            <Input
              id="case_number"
              value={form.case_number}
              onChange={(e) => set("case_number", e.target.value)}
              disabled={editing}
              placeholder="082-OA-0503"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="reg_bs">Registration date (BS)</Label>
            <Input
              id="reg_bs"
              value={str(form.registration_date_bs)}
              onChange={(e) => set("registration_date_bs", e.target.value)}
              placeholder="2082-03-15"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reg_ad">Registration date (AD)</Label>
            <Input
              id="reg_ad"
              type="date"
              value={str(form.registration_date_ad)}
              onChange={(e) => set("registration_date_ad", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="case_type">Case type</Label>
            <Input
              id="case_type"
              value={str(form.case_type)}
              onChange={(e) => set("case_type", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="case_status">Case status</Label>
            <Input
              id="case_status"
              value={str(form.case_status)}
              onChange={(e) => set("case_status", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="plaintiff">Plaintiff</Label>
          <Textarea
            id="plaintiff"
            value={str(form.plaintiff)}
            onChange={(e) => set("plaintiff", e.target.value)}
            rows={2}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="defendant">Defendant</Label>
          <Textarea
            id="defendant"
            value={str(form.defendant)}
            onChange={(e) => set("defendant", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="nes_id">NES entity IRI (optional)</Label>
          <Input
            id="nes_id"
            value={str(form.nes_id)}
            onChange={(e) => set("nes_id", e.target.value)}
            className="font-mono text-xs"
            placeholder="https://jawafdehi.org/entity/person/ram-bahadur"
          />
          {!nesIdValid && (
            <p className="text-xs text-red-600">
              Must be a canonical entity @id IRI
              (https://&lt;base&gt;/entity/&lt;prefix&gt;/&lt;slug&gt;).
            </p>
          )}
        </div>

        <div className="flex gap-2">
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
            onClick={() => navigate("/admin/ngm/courtcases")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
