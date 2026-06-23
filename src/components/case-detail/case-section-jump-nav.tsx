import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

export type CaseJumpSection = {
  id: string;
  label: string;
};

interface CaseSectionJumpNavProps {
  activeSection: string;
  className?: string;
  onJump: (sectionId: string) => (event: MouseEvent<HTMLAnchorElement>) => void;
  sections: CaseJumpSection[];
}

export function CaseSectionJumpNav({
  activeSection,
  className,
  onJump,
  sections,
}: Readonly<CaseSectionJumpNavProps>) {
  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Jump to case section"
      className={cn("no-print min-w-0", className)}
    >
      <p className="mb-3 text-sm font-semibold leading-5 text-primary">
        Jump To
      </p>
      <div className="flex gap-5 overflow-x-auto border-b border-primary/10 pb-3 lg:block lg:space-y-3 lg:overflow-visible lg:border-b-0 lg:border-l lg:pb-0 lg:pl-4">
        {sections.map((section) => {
          const isActive = section.id === activeSection;

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={isActive ? "true" : undefined}
              onClick={onJump(section.id)}
              className={cn(
                "block max-w-44 whitespace-nowrap text-sm font-medium leading-6 transition-colors lg:max-w-none lg:whitespace-normal",
                isActive
                  ? "font-semibold text-primary"
                  : "text-primary/50 hover:text-primary"
              )}
            >
              {section.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
