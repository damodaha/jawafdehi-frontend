import { useTranslation, Trans } from "react-i18next";

export function OurProcessHero() {
  const { t } = useTranslation();

  return (
    <section id="process-hero" className="relative isolate -mt-[76px] overflow-hidden bg-background pt-[76px]">
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

      <div className="container relative z-10 mx-auto flex w-full items-center justify-start py-10 md:min-h-[35svh] md:justify-center md:py-12 lg:py-14">
        <h1 className="max-w-5xl text-left text-4xl font-extrabold leading-[1.05] tracking-tight text-primary sm:text-5xl md:text-center md:text-[3.35rem] md:leading-[0.98]">
          <Trans i18nKey="ourProcess.hero.heading">
            How a <span className="text-accent">corruption</span> case goes from discovery to the{" "}
            <span className="text-accent">public archive</span>
          </Trans>
        </h1>
      </div>
    </section>
  );
}
