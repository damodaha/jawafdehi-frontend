import { useState } from "react";
import { Link } from "react-router-dom";
import { getMaterialByIri, adminErrorMessage } from "@/services/admin-api";
import { parseMaterialIri } from "@/lib/ngm-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Plus, Search } from "lucide-react";

// NGM materials have NO list endpoint today — the read plane only resolves a
// material by its @id IRI (GET /api/ngm/materials/?iri=… or the path form).
// Materials enter the lake via bulk ingestion, so the admin surface here is a
// single-material lookup, not a browse table. A browse view waits on a list
// endpoint (tracked as a backend follow-up).
export default function NgmMaterials() {
  const [iri, setIri] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iri.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getMaterialByIri<Record<string, unknown>>(iri.trim());
      setResult(data);
    } catch (err) {
      setError(adminErrorMessage(err, "Material not found"));
    } finally {
      setLoading(false);
    }
  };

  // The edit route is keyed on the resolved doc's own @id (source/ident tail),
  // which is canonical even if the looked-up IRI used a different host.
  const resultId =
    typeof result?.["@id"] === "string" ? (result["@id"] as string) : "";
  const editParts = resultId ? parseMaterialIri(resultId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">NGM Materials</h1>
          <p className="text-sm text-muted-foreground">
            Materials are JSON-LD keyed by <code>@id</code>; there is no list
            endpoint yet, so look one up by IRI — or create a new one.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/ngm/materials/new">
            <Plus className="mr-1 h-4 w-4" /> New material
          </Link>
        </Button>
      </div>

      <form onSubmit={lookup} className="flex gap-2">
        <Input
          value={iri}
          onChange={(e) => setIri(e.target.value)}
          placeholder="https://jawafdehi.org/material/<source>/<ident>"
          className="max-w-xl font-mono text-xs"
        />
        <Button type="submit" variant="secondary" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-1 h-4 w-4" />
          )}
          Look up
        </Button>
      </form>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {result != null && (
        <div className="space-y-2">
          {editParts && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/admin/ngm/materials/edit/${editParts.source}/${editParts.ident}`}>
                <Pencil className="mr-1 h-4 w-4" /> Edit this material
              </Link>
            </Button>
          )}
          <pre className="overflow-auto rounded-md border bg-white p-4 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
