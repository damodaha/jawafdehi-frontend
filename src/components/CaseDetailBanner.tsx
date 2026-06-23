import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CaseStatusBadge, CaseTagBadge, CaseTypeBadge } from "@/components/CaseBadge";
import { getCaseStatusLabelKey } from "@/lib/case-badges";
import type { CaseDetail, JawafEntity } from "@/types/jds";
import type { Entity } from "@/types/nes";
import { formatCaseDateRange } from "@/utils/date";
import { getPrimaryName } from "@/utils/nes-helpers";
import { translateDynamicText } from "@/lib/translate-dynamic-content";
import { formatBigo } from "@/utils/number";
import { getCaseTypeLabelKey } from "@/utils/case-entities";

interface CaseDetailBannerProps {
  caseData: CaseDetail;
  resolvedEntities: Record<string, Entity>;
  homeLabel?: string;
  casesLabel?: string;
  actions?: ReactNode;
}

const PLACEHOLDER_IMAGE = "/assets/placeholder.png";

const COURT_NAME_MAP: Record<string, { en: string; ne: string }> = {
  supreme: {
    en: "Supreme Court",
    ne: "सर्वोच्च अदालत",
  },
  special: {
    en: "Special Court",
    ne: "विशेष अदालत",
  },
};

function isValidCaseImage(url?: string | null) {
  const trimmedUrl = url?.trim();

  return Boolean(trimmedUrl) && !trimmedUrl?.includes("/admin/");
}

function getCaseBannerSrc(caseData: CaseDetail) {
  if (isValidCaseImage(caseData.banner_url)) {
    return caseData.banner_url!.trim();
  }

  if (isValidCaseImage(caseData.thumbnail_url)) {
    return caseData.thumbnail_url!.trim();
  }

  return PLACEHOLDER_IMAGE;
}

export function CaseDetailBanner({
  caseData,
  resolvedEntities,
  homeLabel,
  casesLabel,
  actions,
}: CaseDetailBannerProps) {
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language;
  const normalizedLang = currentLang === "ne" ? "ne" : "en";
  const title = caseData.title;

  const bannerSrc = getCaseBannerSrc(caseData);
  const [imageSrc, setImageSrc] = useState(bannerSrc);

  useEffect(() => {
    setImageSrc(bannerSrc);
  }, [bannerSrc]);

  const statusLabel = t(getCaseStatusLabelKey(caseData.state || "PUBLISHED"));
  const caseTypeLabel = t(getCaseTypeLabelKey(caseData.case_type));

  const dateRange = formatCaseDateRange(
    caseData.case_start_date,
    caseData.case_end_date,
    t("cases.status.ongoing")
  );

  const notAvailableLabel = t("common.notAvailable");

  const locationEntities = useMemo(
    () => caseData.entities.filter((entity) => entity.type === "location"),
    [caseData.entities]
  );

  const formattedCourtCases = useMemo(() => {
    if (!caseData.court_cases?.length) return [];

    return caseData.court_cases
      .map((courtCase) => {
        const colonIndex = courtCase.indexOf(":");

        if (colonIndex === -1) return null;

        const courtId = courtCase.substring(0, colonIndex).trim();
        const caseNumber = courtCase.substring(colonIndex + 1).trim();

        if (!courtId || !caseNumber) return null;

        const courtName = COURT_NAME_MAP[courtId]?.[normalizedLang] || courtId;

        return `${caseNumber} (${courtName})`;
      })
      .filter((courtCase): courtCase is string => Boolean(courtCase));
  }, [caseData.court_cases, normalizedLang]);

  const getEntityDisplayName = (caseEntity: JawafEntity) => {
    const entity = caseEntity.nes_id
      ? resolvedEntities[caseEntity.nes_id]
      : null;

    const fallbackLang = normalizedLang === "ne" ? "en" : "ne";

    const displayName =
      (entity
        ? getPrimaryName(entity.names, normalizedLang) ||
        getPrimaryName(entity.names, fallbackLang)
        : "") ||
      caseEntity.display_name ||
      caseEntity.nes_id ||
      "Unknown";

    return translateDynamicText(displayName, currentLang);
  };

  const metaTitleClass = "mb-1 text-lg font-bold leading-6 text-primary";
  const metaValueClass = "text-[15px] leading-6 text-primary/85";
  const metaLinkClass =
    "font-medium text-primary/85 underline underline-offset-4 transition-colors hover:text-primary";

  return (
    <section className="w-full text-slate-950 no-print">
      <div className="mx-auto w-full max-w-8xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <img
            src={imageSrc}
            alt={title}
            onError={() => {
              if (imageSrc !== PLACEHOLDER_IMAGE) {
                setImageSrc(PLACEHOLDER_IMAGE);
              }
            }}
            className="h-[340px] w-full object-cover object-top sm:h-[440px] lg:h-[520px] xl:h-[560px]"
          />

          <div className="flex flex-col justify-center py-6 lg:py-10">
            <div className="bg-primary px-6 py-5 text-white lg:-ml-20 lg:px-10">
              <nav
                aria-label="breadcrumb"
                className="mb-3 flex min-w-0 items-center gap-2 text-xs font-medium text-white/70"
              >
                <Link
                  to="/"
                  className="shrink-0 transition-colors hover:text-white"
                >
                  {homeLabel || t("nav.home")}
                </Link>

                <span className="shrink-0 text-white/40">/</span>

                <Link
                  to="/cases"
                  className="shrink-0 transition-colors hover:text-white"
                >
                  {casesLabel || t("nav.cases")}
                </Link>

                <span className="shrink-0 text-white/40">/</span>

                <span className="truncate text-white/80">{title}</span>
              </nav>

              <h1 className="max-w-4xl text-xl font-bold leading-snug text-white sm:text-2xl lg:text-[24px]">
                {title}
              </h1>
            </div>

            <div className="px-6 py-6 text-sm lg:px-10 lg:py-7">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <CaseStatusBadge status={caseData.state || "PUBLISHED"}>
                  {statusLabel}
                </CaseStatusBadge>

                <CaseTypeBadge caseType={caseData.case_type}>
                  {caseTypeLabel}
                </CaseTypeBadge>

                {caseData.tags.map((tag) => (
                  <CaseTagBadge key={tag}>
                    {translateDynamicText(tag, currentLang)}
                  </CaseTagBadge>
                ))}
              </div>

              <div className="space-y-2">
                <div>
                  <p className={metaTitleClass}>Location:</p>

                  <div className={metaValueClass}>
                    {locationEntities.length > 0
                      ? locationEntities.map((entity, index) => (
                        <span key={entity.id}>
                          <Link
                            to={`/entity/${entity.id}`}
                            className={metaLinkClass}
                          >
                            {getEntityDisplayName(entity)}
                          </Link>
                          {index < locationEntities.length - 1 && ", "}
                        </span>
                      ))
                      : notAvailableLabel}
                  </div>
                </div>

                <div>
                  <p className={metaTitleClass}>Case Date:</p>
                  <p className={metaValueClass}>{dateRange}</p>
                </div>

                {caseData.bigo != null && caseData.bigo > 0 && (
                  <div>
                    <p className={metaTitleClass}>
                      {t("caseDetail.embezzledAmount")}:
                    </p>
                    <p className="text-[15px] font-bold leading-6 text-accent">
                      {formatBigo(caseData.bigo)}
                    </p>
                  </div>
                )}

                {formattedCourtCases.length > 0 && (
                  <div>
                    <p className={metaTitleClass}>
                      {t("caseDetail.courtCases")}:
                    </p>
                    <p className={metaValueClass}>
                      {formattedCourtCases.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              {actions ? (
                <div className="mt-5 flex flex-wrap items-center gap-3 no-print">
                  {actions}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
