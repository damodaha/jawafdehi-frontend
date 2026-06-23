import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
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
  const navRef = useRef<HTMLElement | null>(null);
  const [navHeight, setNavHeight] = useState(240);

  useEffect(() => {
    const node = navRef.current;
    if (!node) return;

    const updateHeight = () => setNavHeight(node.offsetHeight);

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, [sections.length]);

  if (sections.length === 0) return null;

  const stickyStyle = {
    "--case-jump-sticky-top": `max(7rem, calc(50vh - ${Math.round(navHeight / 2)}px))`,
  } as CSSProperties;

  return (
    <nav
      ref={navRef}
      aria-label="Jump to case section"
      className={cn(
        "no-print min-w-0 lg:sticky lg:top-[var(--case-jump-sticky-top)]",
        className
      )}
      style={stickyStyle}
    >
      <div className="flex gap-5 overflow-x-auto pb-3 lg:block lg:space-y-4 lg:overflow-visible lg:pb-0">
        {sections.map((section) => {
          const isActive = section.id === activeSection;

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={isActive ? "true" : undefined}
              onClick={onJump(section.id)}
              className={cn(
                "block max-w-48 whitespace-nowrap text-base font-medium leading-7 transition-colors lg:max-w-none lg:whitespace-normal",
                isActive
                  ? "font-semibold text-primary"
                  : "text-primary/55 hover:text-primary"
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
