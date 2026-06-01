import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Search } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";

import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { SearchTabs } from "@/components/search/SearchTabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { searchArchive } from "@/services/search-api";
import type {
  ArchiveSearchParams,
  ArchiveSearchSort,
  ArchiveSearchType,
} from "@/types/search";

const validTypes = new Set<ArchiveSearchType>([
  "all",
  "case",
  "entity",
  "document",
  "person",
  "organization",
  "location",
]);
const validSorts = new Set<ArchiveSearchSort>([
  "relevance",
  "newest",
  "oldest",
  "title",
]);

export default function ArchiveSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => readParams(searchParams), [searchParams]);
  const [query, setQuery] = useState(params.q || "");

  useEffect(() => setQuery(params.q || ""), [params.q]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["archive-search", params],
    queryFn: () => searchArchive(params),
    staleTime: 5 * 60 * 1000,
  });

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([name, value]) => {
      if (value === undefined || value === "") next.delete(name);
      else next.set(name, String(value));
    });
    setSearchParams(next);
  };

  const updateFilter = (name: string, value?: string) => {
    updateParams({ [name]: value, page: 1 });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ q: query.trim() || undefined, page: 1 });
  };

  const activeType = params.type || "all";
  const hasActiveFilters = Boolean(
    params.type !== "all" || params.status || params.role || params.case_type,
  );

  return (
    <main id="main-content" className="min-h-screen bg-background py-8 md:py-12">
      <Helmet>
        <title>Archive Search | Jawafdehi Nepal</title>
        <meta
          content="Search Jawafdehi's public archive across accountability cases, tracked entities, locations, and evidence documents."
          name="description"
        />
        <link href="https://jawafdehi.org/search" rel="canonical" />
      </Helmet>

      <div className="container mx-auto px-4">
        <header className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Public accountability archive
          </p>
          <h1 className="mt-3 text-3xl font-extrabold text-primary md:text-4xl">
            Archive Search
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Search Jawafdehi&apos;s public accountability archive across cases,
            people, offices, locations, allegations, and evidence documents.
          </p>
        </header>

        <form className="mt-7 flex max-w-5xl flex-col gap-3 sm:flex-row" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="archive-search">
            Search the Jawafdehi archive
          </label>
          <div className="relative flex-1">
            <Search aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 rounded-full pl-12"
              id="archive-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cases, people, offices, locations, or allegations"
              value={query}
            />
          </div>
          <Button className="h-12 px-6" type="submit">
            Search Archive
          </Button>
        </form>

        <div className="mt-7 flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">
          <SearchTabs
            activeType={activeType}
            counts={data?.counts || { all: 0, cases: 0, entities: 0, documents: 0 }}
            onChange={(type) => updateFilter("type", type)}
          />
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="archive-sort">
              Sort
            </label>
            <Select
              onValueChange={(sort) => updateFilter("sort", sort)}
              value={params.sort || "relevance"}
            >
              <SelectTrigger className="h-11 w-[160px]" id="archive-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-7 grid gap-7 lg:grid-cols-[250px_minmax(0,1fr)]">
          <SearchFilters
            activeType={activeType}
            caseType={params.case_type}
            facets={data?.facets || { type: [], status: [], role: [], case_type: [] }}
            onChange={updateFilter}
            onClear={() => updateParams({ type: "all", status: undefined, role: undefined, case_type: undefined, page: 1 })}
            role={params.role}
            status={params.status}
          />

          <section aria-label="Archive search results">
            <div className="mb-4 flex min-h-6 items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Searching archive..." : `${data?.count || 0} results`}
              </p>
              {hasActiveFilters ? (
                <Button
                  className="h-9 px-3 text-xs lg:hidden"
                  onClick={() => updateParams({ type: "all", status: undefined, role: undefined, case_type: undefined, page: 1 })}
                  variant="ghost"
                >
                  Clear filters
                </Button>
              ) : null}
            </div>

            {isError ? (
              <Alert className="mb-5" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between gap-4">
                  <span>Archive search could not be loaded.</span>
                  <Button onClick={() => refetch()} size="sm" variant="outline">
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}

            {isLoading ? (
              <div aria-live="polite" className="space-y-3" role="status">
                <span className="sr-only">Searching archive</span>
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton className="h-40 rounded-xl" key={item} />
                ))}
              </div>
            ) : data?.results.length ? (
              <div className="space-y-3">
                {data.results.map((result) => (
                  <SearchResultCard key={`${result.result_type}-${result.id}`} result={result} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <h2 className="text-lg font-bold text-foreground">No archive records found</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Try a broader term or remove one of the filters.
                </p>
              </div>
            )}

            {data && data.count > data.page_size ? (
              <div className="mt-7 flex items-center justify-between gap-4">
                <Button
                  disabled={data.page <= 1}
                  onClick={() => updateParams({ page: data.page - 1 })}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page <span className="tabular-nums">{data.page}</span>
                </span>
                <Button
                  disabled={data.page * data.page_size >= data.count}
                  onClick={() => updateParams({ page: data.page + 1 })}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function readParams(searchParams: URLSearchParams): ArchiveSearchParams {
  const requestedType = searchParams.get("type") as ArchiveSearchType | null;
  const requestedSort = searchParams.get("sort") as ArchiveSearchSort | null;
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  return {
    q: searchParams.get("q") || undefined,
    type: requestedType && validTypes.has(requestedType) ? requestedType : "all",
    status: searchParams.get("status") || undefined,
    role: searchParams.get("role") || undefined,
    case_type: searchParams.get("case_type") || undefined,
    tags: searchParams.get("tags") || undefined,
    sort: requestedSort && validSorts.has(requestedSort) ? requestedSort : "relevance",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    page_size: 10,
  };
}

