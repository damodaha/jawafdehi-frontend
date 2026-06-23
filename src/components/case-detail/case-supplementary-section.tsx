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
    <section id={id} className="mb-12 scroll-mt-28 border-t border-border pt-5 max-w-4xl">
      <h2 className="mb-4 flex items-center text-2xl md:text-3xl font-semibold tracking-tight text-primary">
        <Icon className="mr-2 h-5 w-5" />
        {title}
      </h2>
      <div className="overflow-hidden max-w-4xl text-base md:text-lg leading-[1.7] text-primary/75">
        <ResponsiveTable html={html} />
      </div>
    </section>
  );
}
