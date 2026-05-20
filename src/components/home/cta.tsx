import { Github, Heart, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CtaProps = {
  className?: string;
};

const buttonClassName = "h-12 rounded-[3px] px-7 text-sm font-semibold";

export function Cta({ className }: CtaProps) {
  return (
    <section
      id="contribute"
      className={cn(
        "container relative isolate mx-auto overflow-hidden border-b border-border bg-background py-14 md:py-18 lg:py-20",
        className,
      )}
      aria-labelledby="contribute-title"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.34] [background-image:radial-gradient(hsl(var(--foreground)/0.16)_0.75px,transparent_0.75px)] [background-size:18px_18px]"
      />

      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[3px] border border-accent/20 bg-accent/10 text-accent">
          <Heart className="h-6 w-6" aria-hidden="true" />
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          Volunteer with Jawafdehi
        </p>

        <h2
          id="contribute-title"
          className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-normal text-primary md:text-4xl"
        >
          Ready to contribute?
        </h2>

        <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
          Start by exploring the codebase on GitHub or send us an email to
          introduce yourself and tell us which team interests you.
        </p>

        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild variant="primary" className={buttonClassName}>
            <a
              href="https://github.com/Jawafdehi"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              GitHub - Jawafdehi
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            className={cn(buttonClassName, "border-border bg-background hover:bg-muted")}
          >
            <a href="mailto:cases@jawafdehi.org">
              <Mail className="h-4 w-4" aria-hidden="true" />
              Email us
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
