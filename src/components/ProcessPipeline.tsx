import {
  BadgeCheck,
  EyeOff,
  FileSearch,
  ListChecks,
  Search,
  Send,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type PipelineStep = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const PIPELINE_STEPS: PipelineStep[] = [
  {
    number: "01",
    title: "Discovery",
    icon: Search,
    description:
      "We locate corruption records across official portals, legal filings, public databases, and credible reporting so every case begins with traceable source material.",
  },
  {
    number: "02",
    title: "Standardisation",
    icon: ListChecks,
    description:
      "Raw documents are normalised into a consistent structure: dates, parties, allegations, source links, jurisdictions, and case status are made easier to compare.",
  },
  {
    number: "03",
    title: "Extraction",
    icon: FileSearch,
    description:
      "Key facts are extracted from dense reports and filings, including people, offices, events, financial figures, documents, and the sequence of case activity.",
  },
  {
    number: "04",
    title: "Anonymisation",
    icon: EyeOff,
    description:
      "Sensitive or unnecessary personal information is reviewed and minimised while preserving the public-interest facts needed for accountability.",
  },
  {
    number: "05",
    title: "Verification",
    icon: BadgeCheck,
    description:
      "Records are checked against source documents and reviewed for clarity, consistency, and evidentiary grounding before they become part of the archive.",
  },
  {
    number: "06",
    title: "Publication",
    icon: Send,
    description:
      "Approved cases are published in a permanent, searchable public archive with clear source trails and room for future updates as proceedings develop.",
  },
];

const stickyTops = [
  "top-[72px]",
  "top-[84px]",
  "top-[96px]",
  "top-[108px]",
  "top-[120px]",
  "top-[132px]",
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
  return (
    <section id="pipeline" className="border-b border-border bg-slate-50/60 py-12 md:py-16">
      <div className="container mx-auto px-4">
      

        <div className="relative space-y-8 pb-[42vh]">
          {PIPELINE_STEPS.map((step, index) => (
            <PipelineCard
              key={step.number}
              step={step}
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
  className,
}: {
  step: PipelineStep;
  className?: string;
}) {
  const Icon = step.icon;

  return (
    <article
      className={cn(
        "sticky overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="grid min-h-[360px] gap-8 p-6 md:grid-cols-[minmax(190px,0.42fr)_1fr] md:items-center md:p-10 lg:min-h-[420px] lg:grid-cols-[minmax(250px,0.44fr)_1fr] lg:p-12">
        <div className="flex min-w-0 items-start md:h-full md:items-center">
          <span className="block text-[7rem] font-black leading-none tracking-normal text-primary sm:text-[9rem] md:text-[12rem] lg:text-[15rem]">
            {step.number}
          </span>
        </div>

        <div className="min-w-0 md:max-w-2xl md:border-l md:border-slate-200 md:pl-10 lg:pl-14">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
            Step {step.number}
          </p>
          <h3 className="text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">
            {step.title}
          </h3>
          <p className="mt-5 text-base leading-8 text-slate-600 md:text-lg">
            {step.description}
          </p>

          <div className="mt-8 flex gap-2" aria-hidden="true">
            <span className="h-1.5 w-12 rounded-full bg-primary" />
            <span className="h-1.5 w-6 rounded-full bg-slate-200" />
            <span className="h-1.5 w-6 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
    </article>
  );
}
