import { useState } from "react";
import { Archive, Scale, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Feature = {
  id: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  iconClassName: string;
  iconWrapClassName: string;
  badge?: string;
};

const features: Feature[] = [
  {
    id: "case-archive",
    title: "CIAA Case Archive",
    detail:
      "We index every case the Commission for the Investigation of Abuse of Authority files — including supporting documents, court orders, and legal filings, all in one place. Each record is structured so citizens, journalists, researchers, and volunteers can follow the full trail of a case: accused parties, alleged misconduct, locations, dates, official sources, and related documents.",
    icon: Archive,
    iconClassName: "text-primary",
    iconWrapClassName: "bg-primary/10",
  },
  {
    id: "plain-language",
    title: "Plain-Language Summaries",
    detail:
      "Complex legal filings rewritten so any citizen can understand them — not just lawyers. Every summary is reviewed by human volunteers for factual accuracy before it is published. Summaries explain what happened, who is involved, what law or public duty is at issue, and where the case stands now.",
    icon: Scale,
    iconClassName: "text-primary",
    iconWrapClassName: "bg-primary/10",
  },
  {
    id: "ai-research",
    title: "AI Case Research",
    detail:
      "Ask any question about a case or corruption trend in Nepali or English. Natural language queries against the full case archive will return instant, sourced answers. This research layer will help people compare cases, surface patterns across agencies or districts, and trace claims back to official documents.",
    icon: Sparkles,
    iconClassName: "text-amber-600",
    iconWrapClassName: "bg-amber-500/10",
    badge: "Coming Soon",
  },
];

export function Features() {
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);
  const activeFeature = features.find((feature) => feature.id === activeFeatureId);

  return (
    <div onMouseLeave={() => setActiveFeatureId(null)} role="presentation">
      <section id="features" className="py-12 md:py-20 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            {features.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                isActive={feature.id === activeFeatureId}
                onActivate={() => setActiveFeatureId(feature.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {activeFeature ? <FeatureDetail feature={activeFeature} /> : null}
    </div>
  );
}

function FeatureDetail({ feature }: Readonly<{ feature: Feature }>) {
  const Icon = feature.icon;

  return (
    <div
      id="feature-detail"
      className="border-b border-border bg-muted/30 py-7 transition-all duration-300 md:py-9"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
              feature.iconWrapClassName,
            )}
            aria-hidden="true"
          >
            <Icon className={cn("h-5 w-5", feature.iconClassName)} />
          </div>

          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
              {feature.badge ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {feature.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-muted-foreground leading-relaxed">{feature.detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  feature,
  isActive,
  onActivate,
}: Readonly<{
  feature: Feature;
  isActive: boolean;
  onActivate: () => void;
}>) {
  const Icon = feature.icon;

  return (
    <button
      type="button"
      aria-expanded={isActive}
      aria-controls="feature-detail"
      onClick={onActivate}
      onFocus={onActivate}
      onMouseEnter={onActivate}
      className={cn(
        "w-full cursor-default appearance-none space-y-4 border-0 bg-transparent p-0 text-left [font:inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-8",
        isActive && "cursor-default",
      )}
    >
      <div
        className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center",
          feature.iconWrapClassName,
        )}
      >
        <Icon className={cn("h-6 w-6", feature.iconClassName)} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
        {feature.badge ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            {feature.badge}
          </span>
        ) : null}
      </div>
    </button>
  );
}
