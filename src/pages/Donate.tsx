import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import {
  Globe,
  HeartHandshake,
  Minus,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { TbBrandOpenSource } from "react-icons/tb";

import { DonateHero } from "@/components/donate/hero";
import { Community } from "@/components/donate/community";

type ImpactItem = { title: string; desc: string };
type FaqItem = { q: string; a: string };

const impactIcons = [Globe, Search, ShieldCheck, TbBrandOpenSource];

const faqCardClassName =
  "group overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-sm shadow-foreground/5 outline-none backdrop-blur-[12px] transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-foreground/15 hover:bg-card hover:text-card-foreground hover:shadow-md hover:shadow-foreground/10 focus-visible:-translate-y-0.5 focus-visible:border-foreground/15 focus-visible:bg-card focus-visible:text-card-foreground focus-visible:shadow-md focus-visible:shadow-foreground/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-within:-translate-y-0.5 focus-within:border-foreground/15 focus-within:bg-card focus-within:text-card-foreground focus-within:shadow-md focus-within:shadow-foreground/10 motion-reduce:transform-none motion-reduce:transition-none";

const faqAnswerClassName =
  "max-h-0 -translate-y-1 overflow-hidden opacity-0 transition-[max-height,opacity,transform] duration-300 ease-out group-hover:max-h-96 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:max-h-96 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-focus-within:max-h-96 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transform-none motion-reduce:transition-none";

const Donate = () => {
  const { t } = useTranslation();
  const impactItems = t("donate.impact.items", { returnObjects: true }) as ImpactItem[];
  const faqItems = t("donate.faq.items", { returnObjects: true }) as FaqItem[];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Donate — Jawafdehi</title>
        <meta name="description" content="Support Jawafdehi with a donation. Your gift funds hosting, document archiving, and verification that keep Nepal's corruption archive permanent and free for everyone." />
        <link rel="canonical" href="https://jawafdehi.org/donate" />
        <meta property="og:site_name" content="Jawafdehi Nepal" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://jawafdehi.org/donate" />
        <meta property="og:title" content="Donate — Jawafdehi" />
        <meta property="og:description" content="Support Jawafdehi with a donation. Your gift funds hosting, document archiving, and verification that keep Nepal's corruption archive permanent and free for everyone." />
        <meta property="og:image" content="https://jawafdehi.org/og-favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Donate — Jawafdehi" />
        <meta name="twitter:description" content="Support Jawafdehi with a donation. Your gift funds hosting, document archiving, and verification that keep Nepal's corruption archive permanent and free for everyone." />
        <meta name="twitter:image" content="https://jawafdehi.org/og-favicon.png" />
      </Helmet>

      <main id="main-content" className="flex-1">
        <DonateHero />
        {/* <FundTrack /> */}

        {/* Where your money goes */}
        <section id="donate-impact" className="bg-muted/10 pt-12 pb-10 md:pt-14 md:pb-12 lg:pt-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {t("donate.impact.eyebrow")}
              </p>
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                {t("donate.impact.title")}
              </h2>
              <p className="mt-4 text-base leading-7 text-foreground/70">
                {t("donate.impact.description")}
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-2 md:gap-12 lg:grid-cols-4 lg:gap-10">
              {impactItems.map((item, index) => {
                const Icon = impactIcons[index] ?? HeartHandshake;
                return (
                  <div key={item.title} className="mx-auto flex max-w-[16rem] flex-col items-center text-center">
                    <Icon aria-hidden="true" className="mb-5 h-8 w-8 text-primary" strokeWidth={1.45} />
                    <h3 className="mb-2 text-lg font-bold leading-tight text-foreground">{item.title}</h3>
                    <p className="text-sm leading-6 text-foreground/70">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/*
          Ways to give is hidden for now because it contains wallet, bank-transfer,
          international donation, and public funding-tracker details that are not ready to publish.
        */}

        {/* Community */}
        <Community />

        <section
          id="donate-faq"
          className="bg-background py-12 md:py-16"
          aria-labelledby="donate-faq-title"
        >
          <div className="container mx-auto grid gap-8 px-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.45fr)] md:items-start md:gap-12 lg:gap-16">
            <div className="max-w-md">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {t("donate.faq.eyebrow")}
              </p>
              <h2
                id="donate-faq-title"
                className="max-w-sm text-3xl font-bold leading-tight tracking-normal text-primary md:text-4xl"
              >
                {t("donate.faq.title")}
              </h2>
              <p className="mt-5 text-sm leading-7 text-foreground/60 md:text-base">
                {t("donate.faq.description")}
              </p>
            </div>

            <ul className="flex flex-col gap-2.5">
              {faqItems.map((item, index) => {
                const answerId = `donate-faq-${index}-answer`;
                const questionId = `donate-faq-${index}-question`;

                return (
                  <li key={item.q} className={faqCardClassName}>
                    <button
                      type="button"
                      className="w-full text-left"
                      aria-expanded={false}
                      aria-controls={answerId}
                      onClick={(event) => {
                        const button = event.currentTarget;
                        const isExpanded = button.getAttribute("aria-expanded") === "true";
                        button.setAttribute("aria-expanded", String(!isExpanded));
                        const answer = document.getElementById(answerId);

                        if (!answer) return;

                        if (isExpanded) {
                          answer.classList.add("max-h-0", "-translate-y-1", "overflow-hidden", "opacity-0");
                          answer.classList.remove("max-h-96", "translate-y-0", "opacity-100");
                        } else {
                          answer.classList.remove("max-h-0", "-translate-y-1", "overflow-hidden", "opacity-0");
                          answer.classList.add("max-h-96", "translate-y-0", "opacity-100");
                        }
                      }}
                    >
                      <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-3.5">
                        <h3
                          id={questionId}
                          className="text-left text-sm font-semibold leading-6 text-foreground transition-colors duration-200 group-hover:text-primary group-focus-visible:text-primary group-focus-within:text-primary md:text-base"
                        >
                          {item.q}
                        </h3>
                        <span
                          className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70 text-foreground/50 shadow-sm shadow-foreground/5 transition-[background-color,border-color,color] duration-200 group-hover:border-accent/20 group-hover:bg-accent/10 group-hover:text-accent group-focus-visible:border-accent/20 group-focus-visible:bg-accent/10 group-focus-within:border-accent/20 group-focus-within:bg-accent/10 group-focus-within:text-accent motion-reduce:transition-none"
                          aria-hidden="true"
                        >
                          <Plus className="absolute h-3.5 w-3.5 transition-all duration-300 ease-out group-hover:rotate-90 group-hover:scale-[0.82] group-hover:opacity-0 group-focus-visible:rotate-90 group-focus-visible:scale-[0.82] group-focus-visible:opacity-0 group-focus-within:rotate-90 group-focus-within:scale-[0.82] group-focus-within:opacity-0 motion-reduce:transition-none" />
                          <Minus className="absolute h-3.5 w-3.5 -rotate-90 scale-[0.82] opacity-0 transition-all duration-300 ease-out group-hover:rotate-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:rotate-0 group-focus-visible:scale-100 group-focus-visible:opacity-100 group-focus-within:rotate-0 group-focus-within:scale-100 group-focus-within:opacity-100 motion-reduce:transition-none" />
                        </span>
                      </div>
                    </button>

                    <div id={answerId} className={faqAnswerClassName}>
                      <div className="px-4 pb-4 pr-12 text-sm leading-6 text-muted-foreground md:text-base">
                        {item.a}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Donate;
