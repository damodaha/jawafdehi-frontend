import { FileText } from "lucide-react";
import { DocumentSourceCard } from "@/components/DocumentSourceCard";
import type { DocumentSource, EvidenceEntry } from "@/types/jds";

interface EvidenceSectionProps {
  evidence: EvidenceEntry[];
  resolvedSources: Record<string, DocumentSource>;
  title: string;
}

export function EvidenceSection({
  evidence,
  resolvedSources,
  title,
}: Readonly<EvidenceSectionProps>) {
  if (evidence.length === 0) return null;

  return (
    <section id="evidence" className="mb-12 scroll-mt-28 max-w-4xl">
      <h2 className="mb-6 flex items-center text-2xl md:text-3xl font-semibold tracking-tight text-primary">
        <FileText className="mr-2 h-5 w-5" />
        {title}
      </h2>

      <div className="text-primary/75">
        {evidence.map((evidenceItem, index) => {
          const source = resolvedSources[String(evidenceItem.source_id)] ?? evidenceItem.source ?? null;

          return (
            <DocumentSourceCard
              key={`${evidenceItem.source_id}-${index}`}
              source={source}
              sourceId={evidenceItem.source_id}
              itemNumber={index + 1}
              evidenceDescription={evidenceItem.description}
            />
          );
        })}
      </div>
    </section>
  );
}
