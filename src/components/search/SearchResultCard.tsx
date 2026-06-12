import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ArchiveSearchResult,
  CaseSearchResult,
  DocumentSearchResult,
  EntitySearchResult,
} from "@/types/search";
import { cn } from "@/lib/utils";
import { getCaseById } from "@/services/jds-api";
import { toggleArchiveSearchParam } from "@/utils/archive-search-params";
import { getSubjectEntities } from "@/utils/case-entities";

export function SearchResultCard({ result }: Readonly<{ result: ArchiveSearchResult }>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const metadata = resultMetadata(result);
  const caseSlug = result.result_type === "case" ? result.slug : undefined;
  const [imageFailed, setImageFailed] = useState(false);
  const { data: caseImageUrl, isFetching: isImageLoading } = useQuery({
    queryKey: ["case", caseSlug],
    queryFn: () => getCaseById(caseSlug!),
    enabled: Boolean(caseSlug),
    retry: false,
    select: (caseData) => caseData.thumbnail_url || caseData.banner_url || null,
    staleTime: 5 * 60 * 1000,
  });
  const reserveImageSpace =
    result.result_type === "case" &&
    Boolean(caseSlug) &&
    (isImageLoading || Boolean(caseImageUrl && !imageFailed));

  useEffect(() => setImageFailed(false), [caseImageUrl]);

  return (
    <div
      className="group relative block overflow-hidden rounded-xl border bg-card p-4 transition-colors hover:border-primary/35 hover:bg-muted/35 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
    >
      {reserveImageSpace ? (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 hidden w-64 overflow-hidden sm:block lg:w-72"
        >
          {caseImageUrl && !imageFailed ? (
            <img
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              decoding="async"
              loading="lazy"
              onError={() => setImageFailed(true)}
              src={caseImageUrl}
            />
          ) : (
            <Skeleton className="h-full w-full rounded-none" />
          )}
          <div className="absolute inset-y-0 right-0 w-2/5 bg-gradient-to-r from-transparent to-card" />
          <div className="absolute inset-0 bg-gradient-to-b from-card/5 to-card/10" />
        </div>
      ) : null}

      <article
        className={cn(
          "relative z-10 flex min-h-20 items-start gap-3 transition-[padding] duration-200",
          reserveImageSpace && "sm:pl-64 lg:pl-72",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge className="capitalize" variant="outline">
              {resultLabel(result)}
            </Badge>
          </div>
          <h2 className="truncate text-base font-bold leading-6 text-foreground group-hover:text-primary">
            <Link to={result.url} className="focus:outline-none">
              <span className="absolute inset-0" aria-hidden="true" />
              {formatTitle(result)}
            </Link>
          </h2>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {formatDescription(result)}
          </p>
          {metadata ? (
            <p className="mt-2 truncate text-xs leading-5 text-muted-foreground">
              {metadata}
            </p>
          ) : null}
          {result.result_type === "case" && result.tags && result.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {result.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.preventDefault();
                    setSearchParams(
                      toggleArchiveSearchParam(searchParams, "tags", tag),
                    );
                  }}
                  className="relative z-10 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        <ArrowRight
          aria-hidden="true"
          className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
        />
      </article>
    </div>
  );
}

export function SearchResultCardSkeleton({
  showTags = false,
}: Readonly<{ showTags?: boolean }>) {
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden rounded-xl border bg-card p-4"
    >
      {showTags ? (
        <div className="absolute inset-y-0 left-0 hidden w-64 overflow-hidden sm:block lg:w-72">
          <Skeleton className="h-full w-full rounded-none" />
          <div className="absolute inset-y-0 right-0 w-2/5 bg-gradient-to-r from-transparent to-card" />
        </div>
      ) : null}
      <div
        className={cn(
          "relative z-10 flex min-h-20 items-start gap-3",
          showTags && "sm:pl-64 lg:pl-72",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-4/5 max-w-xl" />
          <div className="mt-2 space-y-1.5">
            <Skeleton className="h-3.5 w-full max-w-2xl" />
            <Skeleton className="h-3.5 w-3/5 max-w-md" />
          </div>
          <Skeleton className="mt-3 h-3 w-2/5 max-w-xs" />
          {showTags ? (
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ) : null}
        </div>
        <Skeleton className="mt-2 h-4 w-4 shrink-0" />
      </div>
    </div>
  );
}

function resultLabel(result: ArchiveSearchResult) {
  if (result.result_type === "entity") {
    return `Entity · ${humanize(result.entity_type)}`;
  }
  return result.result_type;
}

function resultMetadata(result: ArchiveSearchResult) {
  if (result.result_type === "case") return caseMetadata(result);
  if (result.result_type === "entity") return entityMetadata(result);
  return documentMetadata(result);
}

function caseMetadata(result: CaseSearchResult) {
  // Subject entity: accused for CORRUPTION cases, else any named (non-location)
  // entity so cases without an accused (e.g. TAX_EVASION) still name a subject.
  const [primaryEntity] = getSubjectEntities(result.entities, e => e.relationship_type);
  const location = result.entities.find((entity) => entity.relationship_type === "location");
  return [entityName(primaryEntity), entityName(location)].filter(Boolean).join(" · ");
}

function entityMetadata(result: EntitySearchResult) {
  const accusedCount = result.role_counts.accused || 0;
  return [
    result.entity_type !== "location" && accusedCount > 0
      ? `${accusedCount} accused`
      : "",
    `${result.related_case_count} related ${result.related_case_count === 1 ? "case" : "cases"}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function documentMetadata(result: DocumentSearchResult) {
  const names = result.related_entities.map(entityName).filter(Boolean).join(", ");
  return [humanize(result.source_type || "Document"), names].filter(Boolean).join(" · ");
}

function entityName(entity?: { display_name: string | null; nes_id: string | null }) {
  return entity?.display_name || entity?.nes_id || "";
}

function humanize(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function formatTitle(result: ArchiveSearchResult) {
  if (result.result_type === "entity" && result.entity_type === "location") {
    const parts = result.title.split("/");
    const rawName = parts[parts.length - 1];
    return rawName.charAt(0).toUpperCase() + rawName.slice(1).replaceAll("_", " ");
  }
  return result.title;
}

function formatDescription(result: ArchiveSearchResult) {
  if (result.result_type === "entity" && result.entity_type === "location") {
    const locationName = formatTitle(result);
    return `Browse documented cases connected to ${locationName}.`;
  }
  return result.description;
}
