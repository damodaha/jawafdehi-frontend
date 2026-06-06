import type { CSSProperties } from "react";
import {
  Bot,
  CheckCircle2,
  FileText,
  RefreshCcw,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { DottedProcessPath } from "@/components/ourprocess/path";
import {
  PROCESS_PATH_NODES,
  PROCESS_PATH_VIEWBOX,
  PROCESS_STEP_TEXT_LEFT_COLUMN_X,
  PROCESS_STEP_TEXT_RIGHT_COLUMN_X,
  PROCESS_STEP_TEXT_WIDTH,
  type ProcessNode,
} from "@/components/ourprocess/process-path-config";

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
      "Our data scraping team archives government documents, CIAA filings, court records, and CIB reports into digital text. The outreach team simultaneously works with investigative journalists, corruption watchdogs, and media organisations to surface cases not yet in the public record.",
  },
  {
    number: "02",
    title: "Research",
    icon: ShieldCheck,
    description:
      "Our research team investigates what constitutes corruption in each case, the role it plays in Nepali governance, and the effectiveness of existing anti-corruption frameworks. Every case is contextualised before it is written up.",
  },
  {
    number: "03",
    title: "Compilation",
    icon: FileText,
    description:
      "The compilation team structures each case: key allegations, timeline of events, entities involved, and all source documents. Cases are written in plain language so citizens — not just lawyers — can understand them.",
  },
  {
    number: "04",
    title: "AI-Assisted Drafting",
    icon: Bot,
    description:
      "AI helps our team process large volumes of legal documents faster — summarising filings, extracting key facts, and flagging inconsistencies. Every AI-generated output is reviewed and approved by a human volunteer before publication.",
  },
  {
    number: "05",
    title: "Verification & Publication",
    icon: CheckCircle2,
    description:
      "All cases are cross-referenced against at least two independent sources. Once approved, the case is published to the archive — permanently. Records are never altered without a visible audit trail and never deleted.",
  },
  {
    number: "06",
    title: "Ongoing Tracking",
    icon: RefreshCcw,
    description:
      "Published cases are actively monitored for developments: new court orders, verdicts, appeals, and entity responses. Updates are added to the existing case record so the full history is always visible.",
  },
];

function toPercent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function getStepTextStyle(node: ProcessNode): CSSProperties {
  const isLeftNode = node.x < PROCESS_PATH_VIEWBOX.width / 2;
  const left = isLeftNode
    ? PROCESS_STEP_TEXT_RIGHT_COLUMN_X
    : PROCESS_STEP_TEXT_LEFT_COLUMN_X;

  return {
    left: toPercent(left, PROCESS_PATH_VIEWBOX.width),
    top: toPercent(node.y, PROCESS_PATH_VIEWBOX.height),
    transform: "translateY(-50%)",
    width: PROCESS_STEP_TEXT_WIDTH,
  };
}

function ProcessTimelineStep({
  node,
  step,
}: {
  node: ProcessNode;
  step: PipelineStep;
}) {
  const Icon = step.icon;

  return (
    <article
      className="absolute z-10"
      style={getStepTextStyle(node)}
    >
      <div className="mb-2 flex items-center gap-3">
        <Icon className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" strokeWidth={2.4} />

        <h2 className="text-lg font-extrabold uppercase tracking-wide text-primary">
          {step.title}
        </h2>
      </div>

      <p className="text-base leading-7 text-muted-foreground">
        {step.description}
      </p>
    </article>
  );
}

export function ProcessTimeline() {
  const timelineAspectRatio = `${PROCESS_PATH_VIEWBOX.width} / ${PROCESS_PATH_VIEWBOX.height}`;

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div
          className="relative mx-auto w-full"
          style={{ aspectRatio: timelineAspectRatio }}
        >
          <DottedProcessPath
            className="absolute inset-0 z-0 h-full w-full"
            strokeWidth={4}
            dotSize={2}
            dotGap={14}
          />

          {PIPELINE_STEPS.map((step) => {
            const node = PROCESS_PATH_NODES.find(
              (pathNode) => pathNode.number === step.number
            );

            if (!node) {
              return null;
            }

            return (
              <ProcessTimelineStep
                key={step.number}
                node={node}
                step={step}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
