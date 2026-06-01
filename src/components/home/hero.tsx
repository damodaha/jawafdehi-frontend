import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import CountUp from "react-countup";

import { SearchBar } from "@/components/ui/search-bar";
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
    "Search Nepal's public accountability archive in one place. Find corruption cases, tracked people and offices, updates, and Jawafdehi resources.",
};

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
  const navigate = useNavigate();
  const [archiveQuery, setArchiveQuery] = useState("");

  const heroStats: HeroStat[] = [
    { value: casesDocumented, label: "Cases documented" },
    {
      value: officialsAndEntitiesTracked,
      label: "Officials & entities tracked",
    },
    { value: accessModel, label: "Forever. No paywall. Ever." },
  ];

  const goToSearch = (query: string) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      navigate("/search");
      return;
    }

    const params = new URLSearchParams({ q: trimmedQuery });
    navigate(`/search?${params.toString()}`);
  };

  const submitArchiveSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearch(archiveQuery);
  };

  return (
    <section
      id="hero"
      className="relative isolate -mt-[76px] overflow-hidden border-b bg-background pt-[76px]"
    >
      <HeroBackdrop images={heroMapImages} />

      <div className="container relative z-10 mx-auto flex min-h-[72svh] flex-col items-start justify-center px-6 py-16 text-left sm:px-8 md:items-center md:px-4 md:py-20 md:text-center lg:py-24">
        <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-accent">
          {heroCopy.eyebrow}
        </p>

        <h1 className="mt-5 max-w-[11ch] text-[2.55rem] font-extrabold leading-[0.95] tracking-[-0.04em] text-primary sm:max-w-[12ch] sm:text-5xl md:max-w-4xl md:text-6xl md:leading-[1.02]">
          {heroCopy.titlePrefix}{" "}
          <span className="text-accent">{heroCopy.titleHighlight}</span>{" "}
          {heroCopy.titleSuffix}
        </h1>

        <p className="mt-6 max-w-[35ch] text-base leading-8 text-muted-foreground md:max-w-2xl md:text-lg">
          {heroCopy.description}
        </p>

        <form
          className="mt-8 w-full max-w-[34rem] md:max-w-4xl"
          onSubmit={submitArchiveSearch}
        >
          <label className="sr-only" htmlFor="hero-archive-search">
            Search the Jawafdehi archive
          </label>

          <SearchBar
            id="hero-archive-search"
            inputClassName="bg-background/95 shadow-lg shadow-primary/5"
            onChange={(event) => setArchiveQuery(event.target.value)}
            placeholder="Search cases, people, offices, locations, or allegations"
            submitLabel="Search Jawafdehi"
            value={archiveQuery}
          />
        </form>

        <HeroStats stats={heroStats} />
      </div>
    </section>
  );
}

function HeroStats({ stats }: { stats: HeroStat[] }) {
  return (
    <div className="mt-10 grid w-full max-w-[34rem] grid-cols-3 gap-5 md:max-w-2xl md:gap-0">
      {stats.map(({ value, label }, index) => (
        <div
          key={label}
          className={cn(
            "min-w-0 text-left md:px-6 md:text-center",
            index > 0 && "md:border-l md:border-border",
          )}
        >
          <p className="text-2xl font-extrabold leading-none text-primary tabular-nums md:text-3xl">
            <HeroStatValue value={value} />
          </p>

          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            {label}
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

function HeroBackdrop({ images }: { images: HeroMapImage[] }) {
  return (
    <>
      {/* Mobile: subtle feat-ui style red wash, NO map */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 md:hidden"
      >
        <div className="absolute inset-0 bg-background" />

        <div className="absolute inset-0 bg-[linear-gradient(115deg,hsl(var(--background))_0%,hsl(var(--background))_48%,hsl(var(--accent)/0.105)_100%)]" />

        <div className="absolute right-[-18%] top-[-10%] h-[460px] w-[360px] rounded-full bg-accent/10 blur-[110px]" />

        <div className="absolute right-[-30%] top-[18%] h-[360px] w-[300px] rounded-full bg-accent/8 blur-[96px]" />
      </div>

      {/* Desktop: red/navy glow behind map */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[20%] z-0 hidden h-[520px] w-[1080px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_64%_46%,hsl(var(--accent)/0.30),hsl(var(--accent)/0.16)_30%,hsl(var(--primary)/0.08)_52%,transparent_76%)] opacity-75 blur-3xl md:block dark:opacity-40"
      />

      {/* Desktop-only Nepal map */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[47%] z-0 hidden h-[580px] w-[min(1550px,114vw)] -translate-x-1/2 -translate-y-1/2 -rotate-[8deg] opacity-[0.34] md:block lg:h-[640px] lg:w-[min(1700px,118vw)] dark:opacity-[0.20]"
      >
        {images.map(({ src, className }) => (
          <img
            key={src}
            src={src}
            alt=""
            className={cn(
              className,
              "absolute inset-0 h-full w-full max-w-none object-contain saturate-[1.18] contrast-[1.03] mix-blend-multiply dark:mix-blend-screen",
            )}
          />
        ))}
      </div>

      {/* Desktop readability wash only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden bg-[radial-gradient(ellipse_at_50%_46%,hsl(var(--background)/0.84)_0%,hsl(var(--background)/0.66)_30%,hsl(var(--background)/0.36)_56%,transparent_84%)] md:block"
      />
    </>
  );
}