import { Link } from "react-router-dom";
import CountUp from "react-countup";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeroProps = {
  casesDocumented: string;
  officialsAndEntitiesTracked: string;
  accessModel?: string;
};

type HeroStat = {
  label: string;
  mobileLabel?: string[];
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
  { label: "Try AI Research", to: "https://chat.jawafdehi.org", variant: "primary", external: true },
  { label: "Learn More", to: "/our-process", variant: "secondary" },
];

const heroMapImages: HeroMapImage[] = [
  {
    src: "/assets/map-light.svg",
    className: "block dark:hidden",
  },
  {
    src: "/assets/map.svg",
    className: "hidden dark:block",
  },
];

export function Hero({
  casesDocumented,
  officialsAndEntitiesTracked,
  accessModel = "Free",
}: HeroProps) {
  const heroStats: HeroStat[] = [
    { value: casesDocumented, label: "Cases Documented", mobileLabel: ["Cases", "Documented"] },
    {
      value: officialsAndEntitiesTracked,
      label: "Officials & Entities Tracked",
    },
    { value: accessModel, label: "Forever. No paywall. Ever.", mobileLabel: ["Forever."] },
  ];

  return (
    <section id="hero" className="relative isolate -mt-[76px] overflow-hidden bg-background pt-[76px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 left-[64%] z-0 h-[320px] w-[560px] max-w-none -translate-x-1/2 opacity-[0.34] blur-[124px] dark:hidden sm:-top-24 sm:left-[65%] sm:h-[400px] sm:w-[680px] sm:opacity-[0.38] sm:blur-[136px] lg:-top-28 lg:left-[66%] lg:h-[500px] lg:w-[820px] lg:opacity-[0.42] lg:blur-[152px]"
      >
        <div className="absolute right-[4%] top-10 h-[66%] w-[54%] rounded-full bg-accent opacity-85" />
        <div className="absolute left-[32%] top-24 h-[52%] w-[42%] rounded-full bg-accent opacity-55" />
        <div className="absolute -left-[14%] top-[46%] h-[34%] w-[26%] rounded-full bg-primary opacity-35" />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] opacity-[0.22] [background-image:radial-gradient(hsl(var(--foreground)/0.14)_0.75px,transparent_0.75px)] [background-size:18px_18px]"
      />

      <div className="container relative z-10 mx-auto flex min-h-[80svh] w-full flex-col items-center gap-10 py-14 md:py-18 lg:flex-row lg:gap-12 lg:py-20">
        <div className="w-full space-y-6 lg:basis-[58%] lg:shrink-0">
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
    <div className="grid grid-cols-3 gap-3 pt-5 sm:grid-cols-[repeat(3,max-content)] sm:gap-8 lg:pt-7">
      {stats.map(({ value, label, mobileLabel }) => (
        <div key={label} className="min-w-0">
          <p className="text-2xl font-bold leading-none text-primary tabular-nums">
            <HeroStatValue value={value} />
          </p>
          <p className="mt-2 text-xs leading-4 text-muted-foreground sm:whitespace-nowrap sm:text-base sm:leading-normal">
            {mobileLabel ? (
              <>
                <span className="sm:hidden">
                  {mobileLabel.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </>
            ) : (
              label
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

function HeroStatValue({ value }: { value: string }) {
  const normalizedValue = value.replace(/,/g, "");
  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue) || normalizedValue.trim() === "") {
    return <>{value}</>;
  }

  return <CountUp end={numericValue} duration={0.9} separator="," />;
}

function HeroMap({ images }: { images: HeroMapImage[] }) {
  return (
    <div className="relative hidden min-h-[520px] w-full items-center justify-center lg:flex lg:basis-[42%] lg:-translate-y-12">
      {images.map(({ src, className }) => (
        <img
          key={src}
          src={src}
          alt="Dotted map of Nepal"
          className={cn(className, "w-[124%] max-w-none object-contain sm:w-[136%] lg:w-[158%] xl:w-[164%]")}
        />
      ))}
    </div>
  );
}
