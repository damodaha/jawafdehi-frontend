import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";

import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination";
import { SearchBar } from "@/components/ui/search-bar";
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
  ArchiveSearchFacets,
  ArchiveSearchParams,
  ArchiveSearchResponse,
  ArchiveSearchSort,
  ArchiveSearchType,
} from "@/types/search";

type RefinementName = "type" | "entity_type" | "role" | "case_type" | "tags";

const validSorts = new Set<ArchiveSearchSort>([
  "relevance",
  "newest",
  "oldest",
  "title",
]);
const emptyFacets: ArchiveSearchFacets = {
  type: [],
  entity_type: [],
  role: [],
  case_type: [],
  tags: [],
};

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

  const toggleRefinement = (name: RefinementName, value: string) => {
    const next = new URLSearchParams(searchParams);
    const selected = new Set(next.getAll(name));
    if (selected.has(value)) selected.delete(value);
    else selected.add(value);
    next.delete(name);
    selected.forEach((item) => next.append(name, item));
    next.set("page", "1");
    setSearchParams(next);
  };

  const clearRefinements = () => {
    const next = new URLSearchParams(searchParams);
    (["type", "entity_type", "role", "case_type", "tags"] as RefinementName[]).forEach(
      (name) => next.delete(name),
    );
    next.set("page", "1");
    setSearchParams(next);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ q: query.trim() || undefined, page: 1 });
  };

  const selectedRefinements = {
    type: params.type || [],
    entity_type: params.entity_type || [],
    role: params.role || [],
    case_type: params.case_type || [],
    tags: params.tags || [],
  };
  const activeRefinementCount = Object.values(selectedRefinements).reduce(
    (count, values) => count + values.length,
    0,
  );
  const facets = data?.facets || emptyFacets;
  const selectedItems = getSelectedItems(facets, selectedRefinements);
  const searchFilters = (
    <SearchFilters
      facets={facets}
      onClear={clearRefinements}
      onToggle={toggleRefinement}
      selected={selectedRefinements}
    />
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

          <h1 className="mt-3 text-3xl font-extrabold text-primary md:text-4xl">
            Archive Search
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Search Jawafdehi&apos;s public accountability archive across cases,
            people, offices, locations, allegations, and evidence documents.
          </p>
        </header>

        <form
          className="mt-7 flex w-full flex-col gap-3 lg:flex-row lg:items-center"
          onSubmit={submitSearch}
        >
          <label className="sr-only" htmlFor="archive-search">
            Search the Jawafdehi archive
          </label>
          <SearchBar
            className="lg:max-w-[min(64rem,calc(100%-16rem))]"
            id="archive-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cases, people, offices, locations, or allegations"
            submitLabel="Search archive"
            value={query}
          />
          <div className="flex items-center gap-3 lg:ml-auto lg:justify-end">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="archive-sort">
              Sort
            </label>
            <Select
              onValueChange={(sort) => updateFilter("sort", sort)}
              value={params.sort || "relevance"}
            >
              <SelectTrigger className="h-11 w-[160px] rounded-full px-4" id="archive-sort">
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
        </form>

        <div className="mt-3 flex min-h-8 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="Selected filters">
            {selectedItems.length
              ? selectedItems.map((item) => (
                  <button
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    key={`${item.name}-${item.value}`}
                    onClick={() => toggleRefinement(item.name, item.value)}
                    type="button"
                  >
                    <span className="truncate">{item.label}</span>
                    <X aria-hidden="true" className="h-3 w-3 shrink-0" />
                  </button>
                ))
              : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Searching archive..." : `${data?.count || 0} results`}
          </p>
        </div>

        <div className="mt-5 lg:hidden">
          <details className="rounded-xl border bg-card">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-foreground">
              Filters{activeRefinementCount ? ` (${activeRefinementCount})` : ""}
            </summary>
            <div className="border-t p-3">{searchFilters}</div>
          </details>
        </div>

        <div className="mt-7 grid gap-7 lg:grid-cols-[250px_minmax(0,1fr)]">
          <div className="hidden lg:block">{searchFilters}</div>

          <section aria-label="Archive search results">
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

            <ArchiveSearchResults isLoading={isLoading} data={data} />

            {data && data.count > data.page_size ? (
              <PaginationControls
                onPageChange={(page) => updateParams({ page })}
                page={data.page}
                pageSize={data.page_size}
                totalItems={data.count}
              />
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function readParams(searchParams: URLSearchParams): ArchiveSearchParams {
  const requestedSort = searchParams.get("sort") as ArchiveSearchSort | null;
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  return {
    q: searchParams.get("q") || undefined,
    type: (["case", "entity", "document"].includes(searchParams.get("type") || "") ? searchParams.get("type") as ArchiveSearchType : undefined),
    entity_type: searchParams.getAll("entity_type"),
    role: searchParams.getAll("role"),
    case_type: searchParams.getAll("case_type"),
    tags: searchParams.getAll("tags"),
    sort: requestedSort && validSorts.has(requestedSort) ? requestedSort : "relevance",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    page_size: 10,
  };
}

function ArchiveSearchResults({
  isLoading,
  data,
}: Readonly<{
  isLoading: boolean;
  data: ArchiveSearchResponse | undefined;
}>) {
  if (isLoading) {
    return (
      <div aria-live="polite" className="space-y-3" role="status">
        <span className="sr-only">Searching archive</span>
        {[1, 2, 3, 4].map((item) => (
          <Skeleton className="h-32 rounded-xl" key={item} />
        ))}
      </div>
    );
  }

  if (!data?.results.length) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <h2 className="text-lg font-bold text-foreground">No archive records found</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Try a broader term or remove one of the filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.results.map((result) => (
        <SearchResultCard key={`${result.result_type}-${result.id}`} result={result} />
      ))}
    </div>
  );
}

function getSelectedItems(
  facets: ArchiveSearchFacets,
  selected: Record<RefinementName, string[]>,
) {
  return (Object.keys(selected) as RefinementName[]).flatMap((name) =>
    selected[name].map((value) => ({
      name,
      value,
      label:
        facets[name].find((item) => item.name === value)?.display_name ||
        humanize(value),
    })),
  );
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}
