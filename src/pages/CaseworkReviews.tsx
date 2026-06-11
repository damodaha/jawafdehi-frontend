import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CaseworkLayout from "@/components/CaseworkLayout";
import { listReviews, submitReview, apiErrorMessage } from "@/services/casework-api";
import type { ReviewListItem } from "@/types/casework";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dispositionColor, statusColor, fmtDate, fmtDur, scoreBand } from "@/lib/casework-ui";
import { Loader2, Plus, RefreshCw } from "lucide-react";

export default function CaseworkReviews() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rerunningSlug, setRerunningSlug] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await listReviews();
      setItems(data);
    } catch {
      setErr("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while any review is still in progress.
  useEffect(() => {
    const anyRunning = items.some((i) => i.status === "pending" || i.status === "running");
    if (!anyRunning) return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [items, load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = slug.trim().replace(/^\/+|\/+$/g, "");
    if (!s) return;
    setSubmitting(true);
    setErr("");
    try {
      const review = await submitReview(s);
      setSlug("");
      await load();
      navigate(`/portal/reviews/${review.id}`);
    } catch (e: unknown) {
      setErr(apiErrorMessage(e, "Submit failed."));
    } finally {
      setSubmitting(false);
    }
  };

  // Re-run: submit a fresh review for an already-reviewed case slug.
  const onRerun = async (gslug: string) => {
    setRerunningSlug(gslug);
    setErr("");
    try {
      const review = await submitReview(gslug);
      navigate(`/portal/reviews/${review.id}`);
    } catch (e: unknown) {
      setErr(apiErrorMessage(e, "Re-run failed."));
    } finally {
      setRerunningSlug(null);
    }
  };

  // Group reviews by case slug (stacked-by-case list).
  const groups = new Map<string, ReviewListItem[]>();
  for (const it of items) {
    if (!groups.has(it.slug)) groups.set(it.slug, []);
    groups.get(it.slug)!.push(it);
  }

  return (
    <CaseworkLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Case reviews</h1>
          <p className="text-sm text-muted-foreground">
            Submit a Jawafdehi case slug to run a multi-dimensional quality review.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex gap-2 items-start">
          <div className="flex-1">
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="case slug, e.g. case-081-cr-0136-oxygen-plant"
            />
            {err && <p className="text-sm text-red-600 mt-1">{err}</p>}
          </div>
          <Button type="submit" disabled={submitting || !slug.trim()}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Review
          </Button>
        </form>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews…
          </div>
        ) : groups.size === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet. Submit a case slug above.</p>
        ) : (
          <div className="space-y-3">
            {[...groups.entries()].map(([gslug, rows]) => (
              <div key={gslug} className="bg-white border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-slate-500 truncate">{gslug}</div>
                    <div className="text-sm font-medium truncate">{rows[0].case_title || "—"}</div>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {rows.length} review{rows.length === 1 ? "" : "s"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={rerunningSlug === gslug}
                      title="Run a fresh review for this case against the current rules"
                      onClick={() => onRerun(gslug)}
                    >
                      {rerunningSlug === gslug ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      )}
                      Re-run
                    </Button>
                  </div>
                </div>
                <ul className="divide-y">
                  {rows.map((r) => (
                    <li
                      key={r.id}
                      className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/portal/reviews/${r.id}`)}
                    >
                      <span className="text-xs font-mono text-slate-400 w-12">#{r.id}</span>
                      <span className="text-xs text-slate-500 w-40 hidden md:inline">
                        🕓 {fmtDate(r.completed_at || r.created_at)}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(r.status)}`}
                      >
                        {r.status === "running" || r.status === "pending"
                          ? r.stage || r.status
                          : r.status}
                      </span>
                      {r.case_type && (
                        <span className="text-xs text-slate-500 hidden sm:inline">{r.case_type}</span>
                      )}
                      <span className="flex-1" />
                      {r.overall_score != null && (
                        <span
                          className="text-sm font-bold w-10 text-right"
                          style={{ color: scoreBand(r.overall_score) }}
                        >
                          {r.overall_score}
                        </span>
                      )}
                      {r.disposition && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${dispositionColor(
                            r.disposition
                          )}`}
                        >
                          {r.disposition}
                        </span>
                      )}
                      {r.duration_seconds != null && (
                        <span className="text-xs text-slate-400 w-14 text-right hidden lg:inline">
                          {fmtDur(r.duration_seconds)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </CaseworkLayout>
  );
}
