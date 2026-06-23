import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { CourtCase, CourtCaseHearing } from "@/types/jds";
import { formatDateWithBS } from "@/utils/date";

// ── Court identifier parsing ──────────────────────────────────────────────

const COURT_NAMES_EN: Record<string, string> = {
  special: "Special Court",
  supreme: "Supreme Court",
  high: "High Court",
  district: "District Court",
  appellate: "Appellate Court",
};

const COURT_NAMES_NE: Record<string, string> = {
  special: "विशेष अदालत",
  supreme: "सर्वोच्च अदालत",
};

function parseCourtIdentifier(
  courtIdentifier: string,
  lang: string
): { courtName: string; caseNumber: string } {
  const colonIdx = courtIdentifier.indexOf(":");
  if (colonIdx === -1) {
    return { courtName: courtIdentifier, caseNumber: "" };
  }

  const prefix = courtIdentifier.slice(0, colonIdx).toLowerCase();
  const caseNumber = courtIdentifier.slice(colonIdx + 1);

  let courtName: string;
  if (lang === "ne" && COURT_NAMES_NE[prefix]) {
    courtName = COURT_NAMES_NE[prefix];
  } else {
    courtName = COURT_NAMES_EN[prefix] ?? courtIdentifier.slice(0, colonIdx);
  }

  return { courtName, caseNumber };
}

// ── Defendant/Plaintiff from entities ────────────────────────────────────

function getPartiesByRole(courtCase: CourtCase): {
  plaintiffs: string[];
  defendants: string[];
} {
  const plaintiffs: string[] = [];
  const defendants: string[] = [];

  for (const entity of courtCase.entities) {
    const side = entity.side?.toLowerCase();
    if (side === "plaintiff" || side === "वादी") {
      plaintiffs.push(entity.name);
    } else if (side === "defendant" || side === "प्रतिवादी") {
      defendants.push(entity.name);
    }
  }

  // Fall back to string fields if entities list is empty
  if (plaintiffs.length === 0 && courtCase.plaintiff) {
    plaintiffs.push(courtCase.plaintiff);
  }
  if (defendants.length === 0 && courtCase.defendant) {
    defendants.push(courtCase.defendant);
  }

  return { plaintiffs, defendants };
}

// ── Component ─────────────────────────────────────────────────────────────

interface CourtCaseCardProps {
  courtCaseId: string;
  courtCase?: CourtCase;
  isLoading: boolean;
}

export function CourtCaseCard({ courtCaseId, courtCase, isLoading }: CourtCaseCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { courtName, caseNumber } = parseCourtIdentifier(courtCaseId, lang);

  return (
    <div className="rounded-lg border border-border  p-4">
      {/* Court name + case number header */}
      <div className="mb-3 min-w-0">
        <h3 className="break-words text-lg font-semibold leading-snug text-primary/90 md:text-xl">
          {courtName}
        </h3>
        {caseNumber && (
          <p className="mt-1 break-words text-sm font-normal leading-relaxed text-primary/65">
            {t("caseDetail.courtCaseNumber", "Case No.")}: {caseNumber}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : courtCase ? (
        <div className="space-y-3">
          {/* Metadata row */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-base md:text-md font-normal leading-[1.7] text-primary/75 break-words">
            {courtCase.case_type && (
              <span className="break-words">
                <span className="font-medium text-primary/90">{t("caseDetail.courtCaseType", "Case Type")}:</span>{" "}
                {courtCase.case_type}
              </span>
            )}
            {courtCase.category && (
              <span className="break-words">
                <span className="font-medium text-primary/90">{t("caseDetail.courtCategory", "Category")}:</span>{" "}
                {courtCase.category}
              </span>
            )}
            {courtCase.division && (
              <span className="break-words">
                <span className="font-medium text-primary/90">{t("caseDetail.courtDivision", "Division")}:</span>{" "}
                {courtCase.division}
              </span>
            )}
            {courtCase.registration_date_ad && (
              <span className="break-words">
                <span className="font-medium text-primary/90">{t("caseDetail.courtRegistered", "Registered")}:</span>{" "}
                {formatDateWithBS(courtCase.registration_date_ad)}
              </span>
            )}
            {courtCase.case_status && (
              <span className="break-words">
                <span className="font-medium text-primary/90">{t("caseDetail.courtStatus", "Status")}:</span>{" "}
                {courtCase.case_status}
              </span>
            )}
          </div>

          {/* Parties row */}
          {(() => {
            const { plaintiffs, defendants } = getPartiesByRole(courtCase);
            if (plaintiffs.length === 0 && defendants.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-base md:text-md font-normal leading-[1.7] text-primary/75 break-words">
                {plaintiffs.length > 0 && (
                  <span className="break-words">
                    <span className="font-medium text-primary/90">{t("caseDetail.courtPlaintiff", "Plaintiff")}:</span>{" "}
                    {plaintiffs.join(", ")}
                  </span>
                )}
                {defendants.length > 0 && (
                  <span className="break-words">
                    <span className="font-medium text-primary/90">{t("caseDetail.courtDefendant", "Defendant")}:</span>{" "}
                    {defendants.join(", ")}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Hearings collapsible */}
          {courtCase.hearings.length > 0 && (
            <Collapsible className="mt-3">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                >
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                  {t("caseDetail.courtHearings", "Hearings")} ({courtCase.hearings.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="table-scroll-wrapper overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="whitespace-nowrap px-3 py-2.5 text-left text-sm font-semibold text-primary/90">
                          {t("caseDetail.courtHearingDate", "सुनवाइ मिती")}
                        </th>
                        <th className="px-3 py-2.5 text-left text-sm font-semibold text-primary/90">
                          {t("caseDetail.courtHearingJudges", "Judges")}
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-left text-sm font-semibold text-primary/90">
                          {t("caseDetail.courtHearingStatus", "Status")}
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-left text-sm font-semibold text-primary/90">
                          {t("caseDetail.courtHearingDecision", "Decision")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...courtCase.hearings]
                        .sort((a, b) => a.hearing_date_ad.localeCompare(b.hearing_date_ad))
                        .map((hearing: CourtCaseHearing) => (
                          <tr key={hearing.id} className="border-b border-border/50 last:border-0">
                            <td className="whitespace-nowrap px-3 py-2.5 text-sm font-normal leading-relaxed text-primary/75">
                              {formatDateWithBS(hearing.hearing_date_ad)}
                            </td>
                            <td className="px-3 py-2.5 text-sm font-normal leading-relaxed text-primary/75">
                              {hearing.judge_names
                                ? hearing.judge_names.split("\n").map((line, i, arr) => (
                                    <span key={i}>
                                      {line}
                                      {i < arr.length - 1 && <br />}
                                    </span>
                                  ))
                                : null}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-sm font-normal leading-relaxed text-primary/75">
                              {hearing.case_status}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-sm font-normal leading-relaxed text-primary/75">
                              {hearing.decision_type || ""}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("caseDetail.courtCaseUnavailable", "Court case details unavailable.")}
        </p>
      )}
    </div>
  );
}
