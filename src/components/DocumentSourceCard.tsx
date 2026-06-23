import { Archive, ChevronDown, Download, ExternalLink, FileText, Files, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { DocumentPreviewDialog, type PreviewDocument } from "@/components/DocumentPreviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  DocumentSource,
  DocumentSourceType,
  SourceLink,
  SourceLinkRole,
} from "@/types/jds";
import { DocumentSourceTypeKeys } from "@/types/jds";
import { getSourceTypeBadgeClass } from "@/utils/source-type-badge";

interface DocumentSourceCardProps {
  source: DocumentSource | null;
  sourceId: string | number;
  itemNumber: number;
  evidenceDescription?: string;
}

// URL scheme validation - only allow http/https
const isAllowedScheme = (u: string) => /^https?:\/\//i.test(u.trim());

const KNOWN_ROLES: SourceLinkRole[] = [
  "RAW",
  "PERMALINK",
  "MARKDOWN",
  "SOURCE_PAGE",
  "ALTERNATE",
];

// web.archive.org / archive.org snapshot URLs are permalinks by nature. Some
// records mis-tag these as RAW (importer bug), so we override the stated role
// from the URL itself to keep the UI correct regardless of bad data.
const isArchiveUrl = (link: string) =>
  /^https?:\/\/(web\.)?archive\.org\//i.test(link.trim());

const getHostname = (link: string) => {
  try {
    return new URL(link).hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
};

const getFileExtension = (link: string) => {
  try {
    const pathname = new URL(link).pathname;
    return pathname.split(".").pop()?.toLowerCase() ?? "";
  } catch {
    return "";
  }
};

const normalizeRole = (
  role: string | null | undefined,
  link: string,
): SourceLinkRole => {
  if (isArchiveUrl(link)) return "PERMALINK";
  return role && (KNOWN_ROLES as string[]).includes(role) ? (role as SourceLinkRole) : "RAW";
};

/**
 * Build a clean, role-tagged list of links from a source's `urls` field.
 *
 * `urls` is the canonical source of links: each entry is a `{link, role}` dict
 * with an explicit role (RAW/MARKDOWN/PERMALINK). Invalid or non-http(s)
 * entries are dropped.
 */
const resolveLinks = (source: DocumentSource | null): SourceLink[] => {
  if (!source || !Array.isArray(source.urls)) return [];

  return source.urls
    .filter((u): u is SourceLink => Boolean(u?.link) && isAllowedScheme(u.link))
    .map((u) => ({ link: u.link.trim(), role: normalizeRole(u.role, u.link) }));
};

/**
 * Split links into prominent primary links, de-emphasized secondary links
 * (markdown text version(s) + alternate-format renderings), and so on.
 *
 * The backend over-tags the markdown text version's S3 URL: the same URL often
 * appears BOTH as MARKDOWN and again as RAW/PERMALINK. Any non-markdown link
 * pointing at a markdown URL is therefore the text version itself, not a separate
 * source — collapse it into the text version (rendered once, as small text). The
 * remaining links are then deduped by URL so a link tagged twice (e.g.
 * RAW + PERMALINK on the same href) renders a single button.
 *
 * ALTERNATE links (an alternate file format of the RAW document, e.g. a .doc
 * next to the canonical .pdf) are split out into their own small secondary row,
 * since they are redundant content the reader rarely needs.
 */
const partitionLinks = (links: SourceLink[]) => {
  const markdownHrefs = new Set<string>();
  const markdownLinks = links.filter((l) => {
    if (l.role !== "MARKDOWN" || markdownHrefs.has(l.link)) return false;
    markdownHrefs.add(l.link);
    return true;
  });

  const rawLinks: SourceLink[] = [];
  const sourcePageLinks: SourceLink[] = [];
  const permalinkLinks: SourceLink[] = [];
  const alternateLinks: SourceLink[] = [];
  const seen = new Set<string>();
  for (const l of links) {
    if (l.role === "MARKDOWN" || markdownHrefs.has(l.link)) continue;
    if (seen.has(l.link)) continue;
    seen.add(l.link);
    if (l.role === "ALTERNATE") {
      alternateLinks.push(l);
    } else if (l.role === "SOURCE_PAGE") {
      sourcePageLinks.push(l);
    } else if (l.role === "PERMALINK") {
      permalinkLinks.push(l);
    } else {
      rawLinks.push(l);
    }
  }

  return { rawLinks, sourcePageLinks, permalinkLinks, alternateLinks, markdownLinks };
};

type SourceAction = {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  previewType?: PreviewDocument["type"];
};

const getPreviewType = (link: SourceLink): PreviewDocument["type"] | undefined => {
  const extension = getFileExtension(link.link);

  if (link.role === "MARKDOWN" || extension === "md" || extension === "markdown") return "markdown";
  if (extension === "pdf") return "pdf";

  return undefined;
};

const getFileActionLabelKey = (link: SourceLink) => {
  const extension = getFileExtension(link.link);

  if (extension === "pdf") return "documentSource.role.pdf";
  if (extension === "docx") return "documentSource.role.downloadDocx";
  if (extension === "doc") return "documentSource.role.downloadDoc";
  if (extension === "md" || extension === "markdown") return "documentSource.role.markdownFile";

  return "documentSource.role.openFile";
};

export function DocumentSourceCard({
  source,
  sourceId,
  itemNumber,
  evidenceDescription,
}: DocumentSourceCardProps) {
  const { t } = useTranslation();
  const [previewDocument, setPreviewDocument] = useState<PreviewDocument | null>(null);
  const links = resolveLinks(source);
  const { rawLinks, sourcePageLinks, permalinkLinks, alternateLinks, markdownLinks } = partitionLinks(links);
  const isNewsSource = source?.source_type === "MEDIA_NEWS";
  const visibleOriginalLink = sourcePageLinks[0] ?? rawLinks[0] ?? null;
  const sourceHost = getHostname(visibleOriginalLink?.link ?? permalinkLinks[0]?.link ?? markdownLinks[0]?.link ?? "");
  const visibleActions: SourceAction[] = [];
  const menuActions: SourceAction[] = [];

  if (visibleOriginalLink) {
    const previewType = getPreviewType(visibleOriginalLink);

    visibleActions.push({
      href: visibleOriginalLink.link,
      icon: previewType ? FileText : ExternalLink,
      label: t("documentSource.role.raw"),
      previewType,
    });
  }

  if (isNewsSource && permalinkLinks[0]) {
    visibleActions.push({
      href: permalinkLinks[0].link,
      icon: LinkIcon,
      label: t("documentSource.role.permalink"),
    });
  }

  if (markdownLinks[0]) {
    visibleActions.push({
      href: markdownLinks[0].link,
      icon: FileText,
      label: t("documentSource.role.markdown"),
      previewType: "markdown",
    });
  }

  sourcePageLinks.slice(1).forEach((link, index) => {
    const previewType = getPreviewType(link);

    menuActions.push({
      href: link.link,
      icon: previewType ? FileText : ExternalLink,
      label: t("documentSource.role.rawN", { n: index + 2 }),
      previewType,
    });
  });

  rawLinks.forEach((link, index) => {
    if (!sourcePageLinks[0] && index === 0) return;

    const labelKey = getFileActionLabelKey(link);

    menuActions.push({
      href: link.link,
      icon: labelKey.includes("download") ? Download : Files,
      label: rawLinks.length > 1 ? t(`${labelKey}N`, { n: index + 1, defaultValue: t(labelKey) }) : t(labelKey),
      previewType: getPreviewType(link),
    });
  });

  permalinkLinks.forEach((link, index) => {
    if (isNewsSource && index === 0) return;

    menuActions.push({
      href: link.link,
      icon: Archive,
      label:
        permalinkLinks.length > 1
          ? t("documentSource.role.permalinkN", { n: index + 1 })
          : t("documentSource.role.permalink"),
    });
  });

  markdownLinks.slice(1).forEach((link, index) => {
    menuActions.push({
      href: link.link,
      icon: FileText,
      label:
        markdownLinks.length > 1
          ? t("documentSource.role.markdownFileN", { n: index + 2 })
          : t("documentSource.role.markdownFile"),
      previewType: "markdown",
    });
  });

  alternateLinks.forEach((link, index) => {
    const labelKey = getFileActionLabelKey(link);

    menuActions.push({
      href: link.link,
      icon: labelKey.includes("download") ? Download : Files,
      label:
        alternateLinks.length > 1
          ? t(`${labelKey}N`, { n: index + 1, defaultValue: t(labelKey) })
          : t(labelKey),
      previewType: getPreviewType(link),
    });
  });

  // Get source type label with i18n support and fallback for legacy types
  const sourceTypeLabel = source?.source_type
    ? DocumentSourceTypeKeys[source.source_type as DocumentSourceType]
      ? t(DocumentSourceTypeKeys[source.source_type as DocumentSourceType])
      : source.source_type
    : null;
  const sourceTypeClass = getSourceTypeBadgeClass(source?.source_type);
  const openPreview = (action: SourceAction) => {
    if (!action.previewType) return;

    setPreviewDocument({
      title: action.label,
      type: action.previewType,
      url: action.href,
    });
  };

  return (
    <>
      <article className="border-b border-border/70 py-3 last:border-b-0">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {itemNumber}
          </span>
          <div className="min-w-0 flex-1">
            <div className="min-w-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="font-medium leading-snug text-foreground break-words">
                    {source?.title || t("documentSource.fallbackTitle", { id: sourceId })}
                  </h3>
                  {sourceTypeLabel && (
                    <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-xs font-medium ${sourceTypeClass}`}>
                      {sourceTypeLabel}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {source?.description && source.description.trim() !== '.' && source.description.trim() && (
              <p className="mt-1 text-sm leading-5 text-muted-foreground break-words">
                {source.description}
              </p>
            )}

            {evidenceDescription && evidenceDescription.trim() !== '.' && evidenceDescription.trim() && (
              <p className="mt-2 text-sm leading-6 text-muted-foreground break-words">
                {evidenceDescription}
              </p>
            )}

            {(visibleActions.length > 0 || menuActions.length > 0) && (
              <div className="mt-3 flex min-w-0 flex-col gap-2 rounded-lg bg-muted/35 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 text-xs leading-5 text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wide text-foreground/70">
                    {t("documentSource.sourceLinks")}
                  </span>
                  {sourceHost && (
                    <span className="ml-2 break-all">
                      {t("documentSource.sourceDomain", { host: sourceHost })}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {visibleActions.map((action) => {
                    const Icon = action.icon;
                    const ariaLabel = action.previewType
                      ? t("documentPreview.previewAria", { title: action.label })
                      : `${action.label} ${t("documentSource.opensInNewTab")}`;

                    if (action.previewType) {
                      return (
                        <Button
                          key={`${action.label}-${action.href}`}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs font-semibold"
                          aria-label={ariaLabel}
                          onClick={() => openPreview(action)}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {action.label}
                        </Button>
                      );
                    }

                    return (
                      <Button
                        key={`${action.label}-${action.href}`}
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-semibold"
                      >
                        <a
                          href={action.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={ariaLabel}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {action.label}
                        </a>
                      </Button>
                    );
                  })}

                  {menuActions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-semibold">
                          {t("documentSource.more")}
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {menuActions.map((action) => {
                          const Icon = action.icon;
                          const ariaLabel = action.previewType
                            ? t("documentPreview.previewAria", { title: action.label })
                            : `${action.label} ${t("documentSource.opensInNewTab")}`;

                          if (action.previewType) {
                            return (
                              <DropdownMenuItem
                                key={`${action.label}-${action.href}`}
                                aria-label={ariaLabel}
                                className="gap-2"
                                onSelect={(event) => {
                                  event.preventDefault();
                                  openPreview(action);
                                }}
                              >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                                {action.label}
                              </DropdownMenuItem>
                            );
                          }

                          return (
                            <DropdownMenuItem key={`${action.label}-${action.href}`} asChild>
                              <a
                                href={action.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={ariaLabel}
                                className="gap-2"
                              >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                                {action.label}
                              </a>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      <DocumentPreviewDialog
        document={previewDocument}
        open={Boolean(previewDocument)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewDocument(null);
          }
        }}
      />
    </>
  );
}
