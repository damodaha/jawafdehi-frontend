import { Link } from "react-router-dom";

import { Button, type ButtonProps } from "@/components/ui/button";
import { CountUpValue } from "@/components/ui/count-up-value";
import { cn } from "@/lib/utils";

type HeroProps = {
  casesDocumented: string;
  officialsAndEntitiesTracked: string;
  accessModel?: string;
};

type HeroStat = {
  label: string;
  value: string;
};

type HeroAction = {
  label: string;
  to: string;
  variant: NonNullable<ButtonProps["variant"]>;
  external?: boolean;
};

type HeroMapImage = {
  src: string;
  className: string;
};

const heroCopy = {
  eyebrow: "Accountability has no expiry",
  titlePrefix: "Nepal's Permanent",
  titleHighlight: "Corruption Case",
  titleSuffix: "Archive",
  description:
    "Reviewed, digestible case summaries, written for every Nepali, not just lawyers. Every CIAA case documented, simplified, and permanently accessible. Original filings, legal timelines, and verified facts,AI-assisted, human-reviewed, free forever.",
};

const heroActions: HeroAction[] = [
  { label: "AI Research", to: "https://chat.jawafdehi.org", variant: "primary", external: true },
  { label: "Learn More", to: "/our-process", variant: "secondary" },
];

const heroMapImages: HeroMapImage[] = [
  {
    src: "/assets/nepal-map-ascii-light.png",
    className: "block dark:hidden",
  },
  {
    src: "/assets/nepal-map-ascii-dark.png",
    className: "hidden dark:block",
  },
];

export function Hero({
  casesDocumented,
  officialsAndEntitiesTracked,
  accessModel = "Free",
}: HeroProps) {
  const heroStats: HeroStat[] = [
    { value: casesDocumented, label: "Cases Documented" },
    {
      value: officialsAndEntitiesTracked,
      label: "Officials & Entities Tracked",
    },
    { value: accessModel, label: "Forever. No paywall. Ever." },
  ];

  return (
    <section id="hero" className="container relative isolate mx-auto overflow-hidden border-b border-border bg-background">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.34] [background-image:radial-gradient(hsl(var(--foreground)/0.16)_0.75px,transparent_0.75px)] [background-size:18px_18px]"
      />

      <div className="mx-auto flex min-h-[80svh] w-full flex-col items-center gap-10 py-14 md:py-18 lg:flex-row lg:gap-12 lg:py-20">
        <div className="w-full space-y-6 lg:basis-[65%] lg:shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            {heroCopy.eyebrow}
          </p>

          <h1 className="max-w-2xl text-[2.65rem] font-extrabold leading-[0.98] tracking-normal text-primary sm:text-5xl md:text-[3.35rem]">
            {heroCopy.titlePrefix}{" "}
            <span className="text-accent">{heroCopy.titleHighlight}</span>{" "}
            {heroCopy.titleSuffix}
          </h1>

          <p className="max-w-[510px] text-sm leading-6 text-muted-foreground md:text-base">
            {heroCopy.description}
          </p>

          <HeroActions actions={heroActions} />
          <HeroStats stats={heroStats} />
        </div>

        <HeroMap images={heroMapImages} />
      </div>
    </section>
  );
}

function HeroActions({ actions }: { actions: HeroAction[] }) {
  return (
    <div className="flex flex-col gap-3  sm:flex-row">
      {actions.map(({ label, to, variant, external }) => (
        <Button
          asChild
          key={to}
          variant={variant}
          size="lg"
        >
          {external ? (
            <a href={to} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ) : (
            <Link to={to}>{label}</Link>
          )}
        </Button>
      ))}
    </div>
  );
}

function HeroStats({ stats }: { stats: HeroStat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-[repeat(3,max-content)] sm:gap-8 lg:pt-7">
      {stats.map(({ value, label }) => (
        <div key={label} className="min-w-0">
          <p className="text-2xl font-bold leading-none text-primary tabular-nums">
            <CountUpValue value={value} />
          </p>
          <p className="mt-2 whitespace-nowrap text-base text-muted-foreground">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

function HeroMap({ images }: { images: HeroMapImage[] }) {
  return (
    <div className="relative flex min-h-[220px] w-full items-center justify-center sm:min-h-[320px] lg:min-h-[430px] lg:basis-[35%]">
      {images.map(({ src, className }) => (
        <img
          key={src}
          src={src}
          alt="Dotted map of Nepal"
          className={cn(className, "w-full object-contain  lg:max-w-none")}
        />
      ))}
    </div>
  );
}
