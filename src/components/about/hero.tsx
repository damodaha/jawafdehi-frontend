import { useTranslation } from "react-i18next";

export function AboutHero() {
  const { t } = useTranslation();

  return (
    <section id="about-hero" className="relative isolate -mt-[76px] overflow-hidden bg-background pt-[76px]">
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
        <h1 className="max-w-6xl text-[2.65rem] font-extrabold leading-[0.98] tracking-normal text-primary sm:text-5xl md:text-[3.35rem]">
          {t("about.hero.prefix")}{" "}
          <span className="text-accent sm:whitespace-nowrap">
            {t("about.hero.valuesStart")}{" "}
            <span className="text-primary">
              {t("about.hero.valuesConnector")}
            </span>{" "}
            {t("about.hero.valuesEnd")}
          </span>
          <span className="block text-primary">
            {t("about.hero.suffix")}
          </span>
        </h1>
      </div>
    </section>
  );
}
