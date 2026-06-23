import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { FloatingShareSidebar } from "@/components/FloatingShareSidebar";
import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Banknote,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  Mail,
  MapPin,
  MessageCircle,
  StickyNote,
  User,
} from "lucide-react";
import { CaseDetailBanner } from "@/components/case-detail/case-detail-banner";
import { CaseDisclaimerBanner } from "@/components/case-detail/case-disclaimer-banner";
import { CaseOverviewSection } from "@/components/case-detail/case-overview-section";
import { CaseSectionJumpNav, type CaseJumpSection } from "@/components/case-detail/case-section-jump-nav";
import { MissingDetailsSection } from "@/components/case-detail/missing-details-section";
import { NotesSection } from "@/components/case-detail/notes-section";
import { CaseTimelineSection } from "@/components/case-detail/case-timeline-section";
import { CourtCasesSection } from "@/components/case-detail/court-cases-section";
import { EvidenceSection } from "@/components/case-detail/evidence-section";
import { InvolvedPartiesSection } from "@/components/case-detail/involved-parties-section";
import { KeyAllegationsSection } from "@/components/case-detail/key-allegations-section";
import { getCaseById, getCourtCase, getDocumentSourceById } from "@/services/jds-api";
import { getEntityById } from "@/services/api";
import type { CourtCase, DocumentSource, JawafEntity } from "@/types/jds";
import type { Entity } from "@/types/nes";
import { useQueries, useQuery } from "@tanstack/react-query";
import { formatCaseDateRange } from "@/utils/date";
import { stripMarkdown } from "@/utils/markdown";
import { getSubjectEntities } from "@/utils/case-entities";
import { ReportCaseDialog } from "@/components/ReportCaseDialog";
import { DisqusComments } from "@/components/DisqusComments";
import { JAWAFDEHI_WHATSAPP_NUMBER, JAWAFDEHI_EMAIL } from "@/config/constants";
import { translateDynamicText } from "@/lib/translate-dynamic-content";
import { trackEvent } from "@/utils/analytics";
import { formatBigo } from "@/utils/number";
import { resolveLegacyCaseSlug } from "@/utils/legacyCaseMap";
import { useIsMobile } from "@/hooks/use-mobile";
import "@/styles/print.css";

function getGroupedEntities(entities: JawafEntity[]) {
  const seen = new Set<number>();

  return entities.reduce((groups, entity) => {
    if (seen.has(entity.id) || entity.type === "location") return groups;

    seen.add(entity.id);

    const type = entity.type || "unknown";

    if (!groups[type]) groups[type] = [];
    groups[type].push(entity);

    return groups;
  }, {} as Record<string, JawafEntity[]>);
}

const CaseDetail = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { id } = useParams();
  const trackedCaseIdRef = useRef<string | null>(null);
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState("allegations");

  // Legacy /case/<numeric> URLs: resolve to canonical slug and replace.
  // Mirrors worker.ts behaviour for environments without the Cloudflare edge
  // (local dev, preview deploys, direct hits that bypass the worker).
  const legacyTargetSlug = resolveLegacyCaseSlug(id);

  const { data: caseData, isLoading, isError } = useQuery({
    queryKey: ["case", id],
    queryFn: () => getCaseById(id!),
    enabled: id != null && legacyTargetSlug == null,
    staleTime: 5 * 60 * 1000,
  });

  // Subject entities: accused for CORRUPTION cases, else any named (non-location)
  // entity so cases without an accused (e.g. TAX_EVASION) still name a subject.
  const bannerEntities = getSubjectEntities(caseData?.entities, (e) => e.type);
  const accusedCount = bannerEntities.length;
  const BANNER_ACCUSED_LIMIT = 5;
  const collapsedAccused = accusedCount > BANNER_ACCUSED_LIMIT;
  const visibleAccusedEntities = collapsedAccused ? bannerEntities.slice(0, BANNER_ACCUSED_LIMIT) : bannerEntities;
  const hiddenAccusedCount = accusedCount - visibleAccusedEntities.length;

  const sourceQueries = useQueries({
    queries: (caseData?.evidence ?? []).map((evidence) => ({
      queryKey: ["source", evidence.source_id],
      queryFn: () => getDocumentSourceById(evidence.source_id),
      staleTime: 10 * 60 * 1000,
      retry: false,
    })),
  });

  const uniqueNesIds = caseData
    ? [...new Set(caseData.entities.filter((e) => e.nes_id).map((e) => e.nes_id!))]
    : [];

  const entityQueries = useQueries({
    queries: uniqueNesIds.map((nesId) => ({
      queryKey: ["nes-entity", nesId],
      queryFn: () => getEntityById(nesId),
      staleTime: 10 * 60 * 1000,
      retry: false,
    })),
  });

  const courtCaseQueries = useQueries({
    queries: (caseData?.court_cases ?? []).map((courtCaseId) => ({
      queryKey: ["court-case", courtCaseId],
      queryFn: () => getCourtCase(courtCaseId),
      staleTime: 10 * 60 * 1000,
      retry: false,
    })),
  });

  useEffect(() => {
    const loadedCaseId = caseData?.id?.toString();

    if (!id || !loadedCaseId || isError) {
      return;
    }

    if (loadedCaseId !== id || trackedCaseIdRef.current === loadedCaseId) {
      return;
    }

    trackEvent("case_view", { case_id: loadedCaseId, slug: `/case/${id}` });
    trackedCaseIdRef.current = loadedCaseId;
  }, [id, caseData?.id, isError]);

  const resolvedSources: Record<string, DocumentSource> = {};
  (caseData?.evidence ?? []).forEach((evidence, i) => {
    const data = sourceQueries[i]?.data ?? evidence.source;
    if (data) resolvedSources[String(evidence.source_id)] = data;
  });

  const resolvedEntities: Record<string, Entity> = {};
  uniqueNesIds.forEach((nesId, i) => {
    const data = entityQueries[i]?.data;
    if (data) resolvedEntities[nesId] = data;
  });

  const groupedEntities = caseData ? getGroupedEntities(caseData.entities) : {};

  const hasInvolvedParties = Object.keys(groupedEntities).length > 0;
  const hasTimeline = (caseData?.timeline || []).length > 0;
  const hasCourtCases = (caseData?.court_cases ?? []).length > 0;
  const hasEvidence = (caseData?.evidence ?? []).length > 0;
  const hasMissingDetails = Boolean(caseData?.missing_details);
  const hasNotes = Boolean(caseData?.notes);

  const jumpSections = useMemo<CaseJumpSection[]>(() => {
    const sections: Array<CaseJumpSection | false> = [
      { id: "allegations", label: t("caseDetail.allegations") },
      hasInvolvedParties && { id: "parties-involved", label: t("caseDetail.partiesInvolved") },
      hasTimeline && { id: "timeline", label: t("caseDetail.timeline") },
      { id: "overview", label: t("caseDetail.overview") },
      hasCourtCases && { id: "court-case", label: t("caseDetail.courtCase", "Court Case") },
      hasEvidence && { id: "evidence", label: t("caseDetail.evidence") },
      hasMissingDetails && { id: "missing-details", label: t("caseDetail.missingDetails") },
    ];

    return sections.filter((section): section is CaseJumpSection => Boolean(section));
  }, [
    hasCourtCases,
    hasEvidence,
    hasInvolvedParties,
    hasMissingDetails,
    hasTimeline,
    t,
  ]);

  useEffect(() => {
    if (!caseData || jumpSections.length === 0) return;

    setActiveSection((currentSection) =>
      jumpSections.some((section) => section.id === currentSection) ? currentSection : jumpSections[0].id
    );

    const sectionElements = jumpSections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (sectionElements.length === 0) return;

    let animationFrame = 0;

    const updateActiveSection = () => {
      animationFrame = 0;

      const readingLine = window.innerHeight * 0.5;
      let currentSectionId = sectionElements[0].id;

      for (const element of sectionElements) {
        if (element.getBoundingClientRect().top <= readingLine) {
          currentSectionId = element.id;
        } else {
          break;
        }
      }

      const isAtPageBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
      if (isAtPageBottom) {
        currentSectionId = sectionElements[sectionElements.length - 1].id;
      }

      setActiveSection((currentSection) =>
        currentSection === currentSectionId ? currentSection : currentSectionId
      );
    };

    const scheduleUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [caseData, jumpSections]);

  const handleJumpToSection = (sectionId: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const target = document.getElementById(sectionId);
    if (!target) return;

    setActiveSection(sectionId);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${sectionId}`);
  };

  // Legacy /case/<numeric> URLs: replace with the canonical slug. This must
  // happen after all hooks have run so we don't violate rules-of-hooks.
  if (legacyTargetSlug) {
    return <Navigate to={`/case/${legacyTargetSlug}`} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-clip bg-background">
        <main id="main-content" className="flex-1 py-6 md:py-12">
          <div className="container mx-auto max-w-5xl px-6">
            <Skeleton className="mb-6 h-10 w-32" />

            <div className="space-y-8">
              <div>
                <Skeleton className="mb-4 h-8 w-3/4" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>

              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !caseData) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-clip bg-background">
        <main id="main-content" className="flex-1 py-6 md:py-12">
          <div className="container mx-auto max-w-5xl px-6">
            <Button variant="ghost" asChild className="mb-6">
              <Link to="/cases">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("caseDetail.backToCases")}
              </Link>
            </Button>

            <Alert variant="destructive" className="items-start">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <AlertDescription className="break-words">
                {isError ? t("caseDetail.failedToLoad") : t("caseDetail.notFound")}
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  const canonicalUrl = `https://jawafdehi.org/case/${id}`;
  const plainDescription = stripMarkdown(caseData.description).substring(0, 160);
  const metaDescription =
    plainDescription || caseData.key_allegations?.slice(0, 2).join(". ").substring(0, 160) || "";

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background">
      <Helmet>
        <title>{caseData.title} | Jawafdehi</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:site_name" content="Jawafdehi Nepal" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={`${caseData.title} | Jawafdehi`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content="https://jawafdehi.org/og-favicon.png" />
        <meta property="og:locale" content="en_US" />
        <meta property="article:published_time" content={caseData.created_at} />
        <meta property="article:modified_time" content={caseData.updated_at} />
        {caseData.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${caseData.title} | Jawafdehi`} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content="https://jawafdehi.org/og-favicon.png" />
        <link
          rel="alternate"
          type="application/json"
          href={`https://portal.jawafdehi.org/api/cases/${id}/`}
          title="Case data (JSON API)"
        />
        <link
          rel="alternate"
          type="application/json+oembed"
          href={`https://jawafdehi.org/oembed/?url=${encodeURIComponent(canonicalUrl)}&format=json`}
          title={`${caseData.title} oEmbed`}
        />
      </Helmet>

      <CaseDetailBanner
        caseData={caseData}
        resolvedEntities={resolvedEntities}
        actions={<ReportCaseDialog caseId={id || ""} caseTitle={caseData.title} />}
      />

      <main id="main-content" className="flex-1 py-6 sm:py-8">
        <div className="container mx-auto px-6">
          <div className="min-w-0">
            <div className="min-w-0">
              <FloatingShareSidebar url={canonicalUrl} title={caseData.title} description={plainDescription} />

              <CaseDisclaimerBanner>{t("footer.disclaimer")}</CaseDisclaimerBanner>

              {caseData.state === "IN_REVIEW" && (
                <Alert className="no-print mb-5 items-start border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 sm:mb-6">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <AlertDescription className="break-words text-sm text-yellow-800 dark:text-yellow-200">
                    {t("caseDetail.inReviewBanner")}
                  </AlertDescription>
                </Alert>
              )}

              <div id="print-content" className="print-content min-w-0">
                <div className="mb-8 hidden print:block">
                  <h1 className="mb-6 text-4xl font-bold text-foreground">{caseData.title}</h1>

                  {caseData.banner_url && (
                    <img
                      src={caseData.banner_url}
                      alt={caseData.title}
                      className="mb-6 h-64 w-full rounded-lg object-cover"
                    />
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start text-muted-foreground">
                      <User className="mr-2 h-5 w-5 flex-shrink-0" />
                      <div className="flex flex-wrap gap-1 text-sm">
                        {visibleAccusedEntities.map((e, index, arr) => {
                          const entity = e.nes_id ? resolvedEntities[e.nes_id] : null;
                          let displayName =
                            entity?.names?.[0]?.en?.full ||
                            entity?.names?.[0]?.ne?.full ||
                            e.display_name ||
                            e.nes_id ||
                            t("common.notAvailable");

                          displayName = translateDynamicText(displayName, currentLang);

                          return (
                            <span key={e.id}>
                              <Link to={`/entity/${e.id}`} className="text-primary hover:underline">
                                {displayName}
                              </Link>
                              {index < arr.length - 1 && ", "}
                            </span>
                          );
                        })}

                        {collapsedAccused && (
                          <span className="text-muted-foreground">
                            {t("caseDetail.andMoreAccused", { count: hiddenAccusedCount })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="mr-2 h-5 w-5" />
                      <div className="flex flex-wrap gap-1 text-sm">
                        {(() => {
                          const locations = caseData.entities.filter((e) => e.type === "location");

                          return locations.length > 0
                            ? locations.map((e, index) => {
                                const entity = e.nes_id ? resolvedEntities[e.nes_id] : null;
                                let displayName =
                                  entity?.names?.[0]?.en?.full ||
                                  entity?.names?.[0]?.ne?.full ||
                                  e.display_name ||
                                  e.nes_id ||
                                  t("common.notAvailable");

                                displayName = translateDynamicText(displayName, currentLang);

                                return (
                                  <span key={e.id}>
                                    <Link to={`/entity/${e.id}`} className="text-primary hover:underline">
                                      {displayName}
                                    </Link>
                                    {index < locations.length - 1 && ", "}
                                  </span>
                                );
                              })
                            : t("common.notAvailable");
                        })()}
                      </div>
                    </div>

                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="mr-2 h-5 w-5" />
                      <span className="text-sm">
                        {t("caseDetail.period")}:{" "}
                        {formatCaseDateRange(
                          caseData.case_start_date,
                          caseData.case_end_date,
                          t("cases.status.ongoing")
                        )}
                      </span>
                    </div>

                    {caseData.bigo != null && caseData.bigo > 0 && (
                      <div className="flex items-center text-muted-foreground">
                        <Banknote className="mr-2 h-5 w-5" />
                        <span className="text-sm">
                          {t("caseDetail.embezzledAmount")}: {formatBigo(caseData.bigo)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="mb-8 hidden print:block" />

                <div className="grid min-w-0 gap-6 print:block lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[13rem_minmax(0,1fr)] xl:gap-10">
                  <aside className="hidden lg:block min-w-0 lg:col-start-1 lg:row-start-1">
                    <CaseSectionJumpNav
                      activeSection={activeSection}
                      onJump={handleJumpToSection}
                      sections={jumpSections}
                    />
                  </aside>

                  <div className="min-w-0 w-full lg:col-start-2">
                    <KeyAllegationsSection
                      allegations={caseData.key_allegations || []}
                      emptyLabel={t("common.notAvailable")}
                      title={t("caseDetail.allegations")}
                    />

                    {hasInvolvedParties && (
                      <InvolvedPartiesSection
                        groupedEntities={groupedEntities}
                        language={currentLang}
                        resolvedEntities={resolvedEntities}
                        title={t("caseDetail.partiesInvolved")}
                        translateRelation={(relationType) =>
                          t(`caseDetail.relationTypes.${relationType}`, {
                            defaultValue: t("caseDetail.relationTypes.unknown"),
                          })
                        }
                      />
                    )}

                    {hasTimeline && (
                      <CaseTimelineSection
                        className="mb-12 print:static print:mb-8"
                        language={currentLang}
                        timeline={caseData.timeline || []}
                        title={t("caseDetail.timeline")}
                      />
                    )}

                    <CaseOverviewSection description={caseData.description} title={t("caseDetail.overview")} />

                    <CourtCasesSection
                      courtCases={(caseData.court_cases ?? []).map((courtCaseId, index) => {
                        const query = courtCaseQueries[index];

                        return {
                          courtCase: query?.data as CourtCase | undefined,
                          id: courtCaseId,
                          isLoading: query?.isLoading ?? false,
                        };
                      })}
                      title={t("caseDetail.courtCase", "Court Case")}
                    />

                    <EvidenceSection
                      evidence={caseData.evidence}
                      resolvedSources={resolvedSources}
                      title={t("caseDetail.evidence")}
                    />

                    <MissingDetailsSection
                      html={caseData.missing_details}
                      title={t("caseDetail.missingDetails")}
                    />

                    <NotesSection
                      html={caseData.notes}
                      title={t("caseDetail.notes")}
                    />
                  </div>
                </div>
              </div>

              <div className="no-print flex flex-col gap-5 rounded-lg border border-border/80 bg-background/90 p-4 shadow-sm ring-1 ring-primary/5 sm:p-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold tracking-tight text-primary sm:text-lg">
                      {t("caseDetail.contact")}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t("caseDetail.contactHelp", "Send verified updates, source links, or correction requests.")}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <a
                      href={`mailto:${JAWAFDEHI_EMAIL}`}
                      className="group flex min-w-0 items-center gap-3 rounded-md border border-border/70 bg-muted/25 px-3 py-2.5 text-sm transition-colors hover:border-primary/30 hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary group-hover:bg-primary/12">
                        <Mail className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-muted-foreground">
                          {t("caseDetail.emailLabel")}
                        </span>
                        <span className="block truncate font-medium text-primary/80">
                          {JAWAFDEHI_EMAIL}
                        </span>
                      </span>
                    </a>

                    <a
                      href={`https://wa.me/${JAWAFDEHI_WHATSAPP_NUMBER.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-w-0 items-center gap-3 rounded-md border border-border/70 bg-muted/25 px-3 py-2.5 text-sm transition-colors hover:border-primary/30 hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary group-hover:bg-primary/12">
                        <MessageCircle className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-muted-foreground">
                          {t("caseDetail.whatsappLabel")}
                        </span>
                        <span className="block truncate font-medium text-primary/80">
                          {JAWAFDEHI_WHATSAPP_NUMBER}
                        </span>
                      </span>
                    </a>
                  </div>
                </div>

                <Button variant="outline" size="lg" asChild className="h-11 w-full shrink-0 border-primary/20 bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 hover:text-primary-foreground sm:w-auto">
                  <a
                    href={`https://portal.jawafdehi.org/admin/cases/case/${id}/change/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{t("caseDetail.editCase")}</span>
                  </a>
                </Button>
              </div>

              <DisqusComments caseId={id || ""} caseTitle={caseData.title} caseUrl={canonicalUrl} />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Share Button */}
      {isMobile && (
        <div className="no-print pointer-events-auto fixed bottom-5 left-3 z-40 sm:left-6">
          <ShareButton
            url={canonicalUrl}
            title={caseData.title}
            description={plainDescription}
            variant="outline"
            size="lg"
            showLabel
            className="border-2 shadow-lg hover:shadow-xl"
          />
        </div>
      )}
    </div>
  );
};

export default CaseDetail;
