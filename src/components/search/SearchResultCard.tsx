import {
  ArrowRight,
  Building2,
  FileText,
  Landmark,
  MapPin,
  Scale,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import type {
  ArchiveSearchResult,
  CaseSearchResult,
  DocumentSearchResult,
  EntitySearchResult,
} from "@/types/search";

export function SearchResultCard({ result }: Readonly<{ result: ArchiveSearchResult }>) {
  const navigate = useNavigate();

  return (
    <Link
      draggable={false}
      className="group block rounded-xl border bg-card p-4 transition-colors hover:border-primary/35 hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      to={result.url}
    >
      <article className="flex min-h-20 items-start gap-3">
        <span className="mt-0.5 rounded-full bg-secondary/70 p-2 text-primary">
          <ResultIcon result={result} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge className="capitalize" variant="outline">
              {result.result_type}
            </Badge>
            {result.result_type === "entity" ? (
              <span className="text-xs capitalize text-muted-foreground">
                {result.entity_type}
              </span>
            ) : null}
          </div>
          <h2 className="truncate text-base font-bold leading-6 text-foreground group-hover:text-primary">
            {formatTitle(result)}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {formatDescription(result)}
          </p>
          <p className="mt-2 truncate text-xs leading-5 text-muted-foreground">
            {resultMetadata(result)}
          </p>
          {result.result_type === "case" && result.tags && result.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {result.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/search?tags=${encodeURIComponent(tag)}`);
                  }}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
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
    </Link>
  );
}

function ResultIcon({ result }: Readonly<{ result: ArchiveSearchResult }>) {
  if (result.result_type === "case") return <Scale aria-hidden="true" className="h-5 w-5" />;
  if (result.result_type === "document") return <FileText aria-hidden="true" className="h-5 w-5" />;
  if (result.entity_type === "person") return <UserRound aria-hidden="true" className="h-5 w-5" />;
  if (result.entity_type === "organization") return <Building2 aria-hidden="true" className="h-5 w-5" />;
  if (result.entity_type === "location") return <MapPin aria-hidden="true" className="h-5 w-5" />;
  return <Landmark aria-hidden="true" className="h-5 w-5" />;
}

function resultMetadata(result: ArchiveSearchResult) {
  if (result.result_type === "case") return caseMetadata(result);
  if (result.result_type === "entity") return entityMetadata(result);
  return documentMetadata(result);
}

function caseMetadata(result: CaseSearchResult) {
  const primaryEntity = result.entities.find((entity) => entity.relationship_type === "accused");
  const location = result.entities.find((entity) => entity.relationship_type === "location");
  return [
    humanize(result.state),
    entityName(primaryEntity),
    entityName(location),
    result.date,
  ]
    .filter(Boolean)
    .join(" · ");
}

function entityMetadata(result: EntitySearchResult) {
  return [
    humanize(result.entity_type),
    `${result.role_counts.accused || 0} accused`,
    `${result.related_case_count} related ${result.related_case_count === 1 ? "case" : "cases"}`,
  ].join(" · ");
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
    return `See corruption cases happening in ${locationName}`;
  }
  return result.description;
}
