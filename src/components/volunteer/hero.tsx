import { Github, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VolunteerHero() {
  return (
    <section id="volunteer-hero" className="relative isolate -mt-[76px] overflow-hidden bg-background pt-[76px]">
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

      <div className="container relative z-10 mx-auto flex min-h-[52svh] w-full items-center justify-center py-14 text-center md:py-[4.5rem] lg:py-20">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-[2.65rem] font-extrabold leading-[0.98] tracking-normal text-primary sm:text-5xl md:text-[3.35rem]">
            Help build Nepal's{" "}
            <span className="text-accent sm:whitespace-nowrap">
              permanent accountability
            </span>
            <span className="block text-primary">record</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
            Jawafdehi runs entirely on volunteer effort. Whether you are a technology enthusiast,
            a working professional, a legal expert, or a student, if you believe corruption should
            not be forgotten, there is a place for you here.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="font-semibold">
              <a href="https://github.com/Jawafdehi" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-5 w-5" />
                Find us on GitHub
              </a>
            </Button>
            <a
              href="mailto:cases@jawafdehi.org"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <Mail className="h-4 w-4" />
              Email us at cases@jawafdehi.org
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
