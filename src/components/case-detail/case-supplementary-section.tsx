import type { ComponentType } from "react";
import { ResponsiveTable } from "@/components/ResponsiveTable";

interface CaseSupplementarySectionProps {
  Icon: ComponentType<{ className?: string }>;
  html: string | null | undefined;
  id: string;
  title: string;
}

export function CaseSupplementarySection({
  Icon,
  html,
  id,
  title,
}: Readonly<CaseSupplementarySectionProps>) {
  if (!html) return null;

  return (
    <section id={id} className="mb-12 scroll-mt-28 border-t border-border pt-5">
      <h2 className="mb-3 flex items-center text-lg font-semibold text-primary">
        <Icon className="mr-2 h-4 w-4" />
        {title}
      </h2>
      <div className="overflow-hidden text-base leading-8 text-primary/75">
        <ResponsiveTable html={html} />
      </div>
    </section>
  );
}
