import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CaseworkLayout from "@/components/CaseworkLayout";
import {
  listReviews,
  submitReview,
  buildSubmitPayload,
  apiErrorMessage,
} from "@/services/casework-api";
import type { ReviewListItem } from "@/types/casework";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dispositionColor, statusColor, fmtDate, fmtDur, scoreBand } from "@/lib/casework-ui";
import { Loader2, Plus, RefreshCw } from "lucide-react";

const PAGE_SIZE = 20;

// Get the HTTP status off an axios error without pulling in axios types here.
function errStatus(e: unknown): number | undefined {
  return (e as { response?: { status?: number } })?.response?.status;
}
function conflictReviewId(e: unknown): number | undefined {
  return (e as { response?: { data?: { review_id?: number } } })?.response?.data?.review_id;
}

// Merge freshly-fetched rows into the accumulated list: update existing rows in
// place (by id) and add new ones, keeping newest-first (id desc mirrors the
// backend's -created_at, -id ordering). Used so polling can refresh page 1
// without discarding pages already loaded via "Load more".
function mergeReviews(prev: ReviewListItem[], fresh: ReviewListItem[]): ReviewListItem[] {
  const byId = new Map(prev.map((r) => [r.id, r]));
  for (const r of fresh) byId.set(r.id, r);
  return [...byId.values()].sort((a, b) => b.id - a.id);
}

export default function CaseworkReviews() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [nextPage, setNextPage] = useState(2);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rerunningSlug, setRerunningSlug] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [conflictId, setConflictId] = useState<number | null>(null);

  // Load the first page (also used by polling to refresh in-progress rows).
  const loadFirst = useCallback(async () => {
    try {
      const page = await listReviews({ page: 1, page_size: PAGE_SIZE });
      setCount(page.count);
      setHasNext(Boolean(page.next));
      setNextPage(2);
      setItems((prev) => (prev.length ? mergeReviews(prev, page.results) : page.results));
    } catch {
      setErr("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const page = await listReviews({ page: nextPage, page_size: PAGE_SIZE });
      setCount(page.count);
      setHasNext(Boolean(page.next));
      setNextPage((p) => p + 1);
      setItems((prev) => mergeReviews(prev, page.results));
    } catch {
      setErr("Failed to load more reviews.");
    } finally {
      setLoadingMore(false);
    }
  }, [nextPage]);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  // Poll the first page while any loaded review is still in progress; newly
  // submitted reviews sort to the top, so page 1 covers status changes.
  useEffect(() => {
    const anyRunning = items.some((i) => i.status === "pending" || i.status === "running");
    if (!anyRunning) return;
    const t = setInterval(loadFirst, 3000);
    return () => clearInterval(t);
  }, [items, loadFirst]);

  const runSubmit = async (
    payload: Parameters<typeof submitReview>[0],
    onDone: () => void,
    fallback: string
  ) => {
    setErr("");
    setConflictId(null);
    try {
      const review = await submitReview(payload);
      navigate(`/portal/reviews/${review.id}`);
    } catch (e: unknown) {
      setErr(apiErrorMessage(e, fallback));
      if (errStatus(e) === 409) setConflictId(conflictReviewId(e) ?? null);
    } finally {
      onDone();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSubmitting(true);
    await runSubmit(
      buildSubmitPayload(input),
      () => {
        setSubmitting(false);
        setInput("");
        loadFirst();
      },
      "Submit failed."
    );
  };

  // Re-run: submit a fresh review for an already-reviewed case slug.
  const onRerun = async (gslug: string) => {
    setRerunningSlug(gslug);
    await runSubmit({ slug: gslug }, () => setRerunningSlug(null), "Re-run failed.");
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
            Submit a case slug, court case number, or case URL to run a multi-dimensional
            quality review.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex gap-2 items-start">
          <div className="flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="slug, court case no. (special:081-CR-0136), or case URL"
            />
            {err && (
              <p className="text-sm text-red-600 mt-1">
                {err}
                {conflictId != null && (
                  <>
                    {" "}
                    <button
                      type="button"
                      className="underline font-medium"
                      onClick={() => navigate(`/portal/reviews/${conflictId}`)}
                    >
                      View existing review
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
          <Button type="submit" disabled={submitting || !input.trim()}>
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
          <p className="text-sm text-muted-foreground">
            No reviews yet. Submit a case above.
          </p>
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

            {hasNext && (
              <div className="flex justify-center pt-1">
                <Button variant="outline" size="sm" disabled={loadingMore} onClick={loadMore}>
                  {loadingMore ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : null}
                  Load more
                </Button>
              </div>
            )}
            <p className="text-center text-xs text-slate-400">
              Showing {items.length} of {count} review{count === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>
    </CaseworkLayout>
  );
}
