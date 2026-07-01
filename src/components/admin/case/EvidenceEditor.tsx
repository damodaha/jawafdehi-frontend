import { useState } from "react";
import { listSources, adminErrorMessage } from "@/services/admin-api";
import { EVIDENCE_TIERS, type EvidenceRow } from "@/lib/jawafdehi-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";

interface Props {
  rows: EvidenceRow[];
  onChange: (rows: EvidenceRow[]) => void;
}

function sourceTitle(s: Record<string, unknown>): string {
  return String(s.title ?? s.name ?? `Source #${s.id}`);
}

// F5 — evidence linker. Links existing DocumentSources by id with a tier; the
// parent diffs into a replace op on /evidence (§3). Includes a source search
// (GET /api/sources/?search=) and a manual "by id" add.
export default function EvidenceEditor({ rows, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");

  const update = (i: number, patch: Partial<EvidenceRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  const addRow = (source_id: number) => {
    if (!Number.isFinite(source_id) || source_id <= 0) return;
    if (rows.some((r) => r.source_id === source_id)) return; // no dupes
    onChange([...rows, { source_id, tier: "PRIMARY" }]);
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchErr(null);
    try {
      const page = await listSources<Record<string, unknown>>({
        search: query.trim(),
        page_size: 15,
      });
      setResults(page.results ?? []);
    } catch (err) {
      setSearchErr(adminErrorMessage(err, "Search failed"));
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border bg-white p-4">
      <Label className="text-sm font-semibold">Evidence (document sources)</Label>
      <p className="text-xs text-muted-foreground">
        Link existing document sources with a tier (PRIMARY / LEGAL / SECONDARY).
      </p>

      <div className="rounded-md bg-slate-50 p-3 space-y-2">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runSearch();
              }
            }}
            placeholder="Search document sources…"
          />
          <Button type="button" variant="outline" onClick={runSearch} disabled={searching}>
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        {searchErr && <p className="text-xs text-red-600">{searchErr}</p>}
        {results.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-auto">
            {results.map((s) => {
              const id = Number(s.id);
              return (
                <li key={id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-mono text-xs text-muted-foreground">#{id}</span>{" "}
                    {sourceTitle(s)}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      addRow(id);
                      setResults([]);
                      setQuery("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            type="number"
            className="max-w-[10rem]"
            placeholder="…or add by id"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              addRow(Number(manualId));
              setManualId("");
            }}
            disabled={!manualId.trim()}
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No evidence linked yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div
              key={r.source_id}
              className="grid items-center gap-2 rounded border p-2 sm:grid-cols-[1fr_10rem_auto]"
            >
              <span className="font-mono text-sm">Source #{r.source_id}</span>
              <Select
                value={r.tier}
                onValueChange={(v) => update(i, { tier: v as EvidenceRow["tier"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TIERS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => remove(i)}
                title="Unlink"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
