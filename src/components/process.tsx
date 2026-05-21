import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlaskConical,
  RefreshCw,
  Search,
} from "lucide-react";
import { FaFolderOpen } from "react-icons/fa";
import type { IconType } from "react-icons";
import { LuCircleCheckBig } from "react-icons/lu";
import { RiDraftFill } from "react-icons/ri";

import { cn } from "@/lib/utils";

type PipelineStep = {
  number: string;
  title: string;
  description: string;
  icon: IconType;
};

const PIPELINE_STEPS: PipelineStep[] = [
  {
    number: "01",
    title: "Discovery",
    icon: Search,
    description:
      "Our data scraping team archives government documents, CIAA filings, court records, and CIB reports into digital text. The outreach team simultaneously works with investigative journalists, corruption watchdogs, and media organisations to surface cases not yet in the public record.",
  },
  {
    number: "02",
    title: "Research",
    icon: FlaskConical,
    description:
      "Our research team investigates what constitutes corruption in each case, the role it plays in Nepali governance, and the effectiveness of existing anti-corruption frameworks. Every case is contextualised before it is written up.",
  },
  {
    number: "03",
    title: "Compilation",
    icon: FaFolderOpen,
    description:
      "The compilation team structures each case: key allegations, timeline of events, entities involved, and all source documents. Cases are written in plain language so citizens — not just lawyers — can understand them.",
  },
  {
    number: "04",
    title: "AI-Assisted Drafting",
    icon: RiDraftFill,
    description:
      "AI helps our team process large volumes of legal documents faster — summarising filings, extracting key facts, and flagging inconsistencies. Every AI-generated output is reviewed and approved by a human volunteer before publication.",
  },
  {
    number: "05",
    title: "Verification & Publication",
    icon: LuCircleCheckBig,
    description:
      "All cases are cross-referenced against at least two independent sources. Once approved, the case is published to the archive — permanently. Records are never altered without a visible audit trail and never deleted.",
  },
  {
    number: "06",
    title: "Ongoing Tracking",
    icon: RefreshCw,
    description:
      "Published cases are actively monitored for developments: new court orders, verdicts, appeals, and entity responses. Updates are added to the existing case record so the full history is always visible.",
  },
];

const stickyTops = [
  "md:top-[88px]",
  "md:top-[100px]",
  "md:top-[112px]",
  "md:top-[124px]",
  "md:top-[136px]",
  "md:top-[148px]",
];

const stackDepth = [
  "z-[10]",
  "z-[20]",
  "z-[30]",
  "z-[40]",
  "z-[50]",
  "z-[60]",
];

export function ProcessPipeline() {
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const setCardRef = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      cardRefs.current[index] = node;
    },
    [],
  );

  useEffect(() => {
    let animationFrame = 0;

    const updatePipelineState = () => {
      const viewportHeight = window.innerHeight || 1;
      const activationLine = viewportHeight * 0.42;
      const nextActiveIndex = cardRefs.current.reduce((current, card, index) => {
        if (!card) {
          return current;
        }

        return card.getBoundingClientRect().top <= activationLine ? index : current;
      }, 0);

      setActiveIndex((current) => (current === nextActiveIndex ? current : nextActiveIndex));
    };

    const requestUpdate = () => {
      if (animationFrame) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        updatePipelineState();
      });
    };

    updatePipelineState();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <section
      id="pipeline"
      className="relative isolate border-b border-border bg-background py-12 md:py-16"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(hsl(var(--foreground)/0.14)_0.75px,transparent_0.75px)] [background-size:18px_18px]"
      />
      <div className="container mx-auto px-4">
        <div className="relative space-y-6 pb-[36vh] md:space-y-8">
          {PIPELINE_STEPS.map((step, index) => (
            <PipelineCard
              key={step.number}
              step={step}
              index={index}
              totalSteps={PIPELINE_STEPS.length}
              isActive={activeIndex === index}
              isComplete={activeIndex > index}
              refCallback={setCardRef(index)}
              className={cn(stickyTops[index], stackDepth[index])}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PipelineCard({
  step,
  index,
  totalSteps,
  isActive,
  isComplete,
  refCallback,
  className,
}: {
  step: PipelineStep;
  index: number;
  totalSteps: number;
  isActive: boolean;
  isComplete: boolean;
  refCallback: (node: HTMLElement | null) => void;
  className?: string;
}) {
  const Icon = step.icon;

  return (
    <article
      ref={refCallback}
      className={cn(
        "overflow-hidden rounded-lg border bg-background/90 backdrop-blur-[12px] transition-[background-color,border-color] duration-500 ease-out md:sticky motion-reduce:transition-none",
        isActive && "border-accent/25 bg-background/95",
        isComplete && !isActive && "border-foreground/10 bg-background/90",
        !isActive && !isComplete && "border-border/70 bg-background/90",
        className,
      )}
    >
      <div className="grid min-h-[340px] gap-6 p-6 md:grid-cols-[minmax(150px,0.34fr)_minmax(0,1fr)] md:items-center md:p-8 lg:min-h-[400px] lg:grid-cols-[minmax(210px,0.38fr)_minmax(0,1fr)] lg:p-10">
        <div className="flex min-w-0 items-start md:h-full md:items-center">
          <div>
            <p
              className={cn(
                "mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/45 transition-colors duration-500",
                isActive && "text-accent",
              )}
            >
              Step
            </p>
            <span
              className={cn(
                "block text-[5.8rem] font-black leading-none tracking-normal text-primary/10 transition-colors duration-500 sm:text-[7.5rem] md:text-[10.5rem] lg:text-[13rem]",
                isActive && "text-primary/30",
                isComplete && !isActive && "text-primary/[0.14]",
              )}
            >
              {step.number}
            </span>
          </div>
        </div>

        <div className="min-w-0 md:max-w-2xl">
          <div className="mb-6 flex items-center gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-transparent transition-colors duration-500",
                isActive
                  ? "border-primary/25 text-primary"
                  : "border-border/70 text-primary/80",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>

            <h3 className="min-w-0 text-3xl font-bold leading-tight tracking-normal text-foreground md:text-4xl">
              {step.title}
            </h3>
          </div>

          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            {step.description}
          </p>

          <StageIndicator currentIndex={index} totalSteps={totalSteps} />
        </div>
      </div>
    </article>
  );
}

function StageIndicator({
  currentIndex,
  totalSteps,
}: {
  currentIndex: number;
  totalSteps: number;
}) {
  return (
    <div className="mt-8 grid w-40 grid-cols-6 gap-1.5" aria-hidden="true">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 rounded-full transition-colors duration-500",
            index < currentIndex && "bg-primary/35",
            index === currentIndex && "bg-accent",
            index > currentIndex && "bg-border",
          )}
        />
      ))}
    </div>
  );
}
