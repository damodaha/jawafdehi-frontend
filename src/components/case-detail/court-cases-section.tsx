import { Scale } from "lucide-react";
import { CourtCaseCard } from "@/components/CourtCaseCard";
import type { CourtCase } from "@/types/jds";

export type CourtCaseSectionItem = {
  courtCase?: CourtCase;
  id: string;
  isLoading: boolean;
};

interface CourtCasesSectionProps {
  courtCases: CourtCaseSectionItem[];
  title: string;
}

export function CourtCasesSection({
  courtCases,
  title,
}: Readonly<CourtCasesSectionProps>) {
  if (courtCases.length === 0) return null;

  return (
    <section id="court-case" className="mb-12 scroll-mt-28 max-w-4xl">
      <h2 className="mb-6 flex items-center text-2xl md:text-3xl font-semibold tracking-tight text-primary">
        <Scale className="mr-2 h-5 w-5" />
        {title}
      </h2>

      <div className="space-y-4 text-primary/75">
        {courtCases.map(({ courtCase, id, isLoading }) => (
          <CourtCaseCard
            key={id}
            courtCaseId={id}
            courtCase={courtCase}
            isLoading={isLoading}
          />
        ))}
      </div>
    </section>
  );
}
