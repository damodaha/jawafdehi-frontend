import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Building2,
  Copy,
  ExternalLink,
  Globe,
  HeartHandshake,
  Landmark,
  Search,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Cta } from "@/components/home/cta";
import { DonateHero } from "@/components/donate/hero";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type ImpactItem = { title: string; desc: string };
type FaqItem = { q: string; a: string };

const impactIcons: LucideIcon[] = [Globe, Search, ShieldCheck, HeartHandshake];

function CopyField({ label, value }: Readonly<{ label: string; value: string }>) {
  const { t } = useTranslation();
  const onCopy = () => {
    void navigator.clipboard?.writeText(value).then(
      () => toast.success(t("donate.ways.copied")),
      () => undefined,
    );
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/10 bg-background/70 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/55">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onCopy}
        aria-label={`${t("donate.ways.copy")} ${label}`}
        className="h-8 w-8 flex-shrink-0 text-foreground/60 hover:text-foreground"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

const Donate = () => {
  const { t } = useTranslation();
  const impactItems = t("donate.impact.items", { returnObjects: true }) as ImpactItem[];
  const faqItems = t("donate.faq.items", { returnObjects: true }) as FaqItem[];
  const internationalUrl = t("donate.ways.international.url");

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

            <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-4 lg:gap-10">
              {impactItems.map((item, index) => {
                const Icon = impactIcons[index] ?? HeartHandshake;
                return (
                  <div key={item.title} className="mx-auto flex max-w-[16rem] flex-col items-center text-center">
                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/[0.07] text-primary">
                      <Icon aria-hidden="true" className="h-10 w-10" strokeWidth={1.45} />
                    </div>
                    <h3 className="mb-2 text-lg font-bold leading-tight text-foreground">{item.title}</h3>
                    <p className="text-sm leading-6 text-foreground/70">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Ways to give */}
        <section id="donate-ways" className="bg-muted/20 pt-10 pb-12 md:pt-12 md:pb-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {t("donate.ways.eyebrow")}
              </p>
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                {t("donate.ways.title")}
              </h2>
              <p className="mt-4 text-base leading-7 text-foreground/70">
                {t("donate.ways.description")}
              </p>
            </div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Digital wallets */}
              <div className="flex flex-col rounded-lg border border-primary/10 bg-background/70 p-6 shadow-sm shadow-primary/5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/[0.07] text-primary">
                    <Wallet aria-hidden="true" className="h-6 w-6" strokeWidth={1.55} />
                  </div>
                  <h3 className="text-lg font-bold leading-tight text-foreground">{t("donate.ways.wallets.title")}</h3>
                </div>
                <p className="mb-5 text-sm leading-6 text-foreground/70">{t("donate.ways.wallets.desc")}</p>
                <div className="mt-auto space-y-3">
                  <CopyField label={t("donate.ways.wallets.esewaLabel")} value={t("donate.ways.wallets.esewaId")} />
                  <CopyField label={t("donate.ways.wallets.khaltiLabel")} value={t("donate.ways.wallets.khaltiId")} />
                  <CopyField label={t("donate.ways.wallets.imepayLabel")} value={t("donate.ways.wallets.imepayId")} />
                  {/* TODO: drop wallet QR images into /public and render them here */}
                  <p className="text-xs leading-5 text-foreground/55">{t("donate.ways.wallets.qrNote")}</p>
                </div>
              </div>

              {/* Bank transfer */}
              <div className="flex flex-col rounded-lg border border-primary/10 bg-background/70 p-6 shadow-sm shadow-primary/5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/[0.07] text-primary">
                    <Landmark aria-hidden="true" className="h-6 w-6" strokeWidth={1.55} />
                  </div>
                  <h3 className="text-lg font-bold leading-tight text-foreground">{t("donate.ways.bank.title")}</h3>
                </div>
                <p className="mb-5 text-sm leading-6 text-foreground/70">{t("donate.ways.bank.desc")}</p>
                <div className="mt-auto space-y-3">
                  <CopyField label={t("donate.ways.bank.accountNameLabel")} value={t("donate.ways.bank.accountName")} />
                  <CopyField label={t("donate.ways.bank.accountNumberLabel")} value={t("donate.ways.bank.accountNumber")} />
                  <CopyField label={t("donate.ways.bank.bankNameLabel")} value={t("donate.ways.bank.bankName")} />
                  <CopyField label={t("donate.ways.bank.branchLabel")} value={t("donate.ways.bank.branch")} />
                  <CopyField label={t("donate.ways.bank.swiftLabel")} value={t("donate.ways.bank.swift")} />
                </div>
              </div>

              {/* International */}
              <div className="flex flex-col rounded-lg border border-primary/10 bg-background/70 p-6 shadow-sm shadow-primary/5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/[0.07] text-primary">
                    <Building2 aria-hidden="true" className="h-6 w-6" strokeWidth={1.55} />
                  </div>
                  <h3 className="text-lg font-bold leading-tight text-foreground">{t("donate.ways.international.title")}</h3>
                </div>
                <p className="mb-5 text-sm leading-6 text-foreground/70">{t("donate.ways.international.desc")}</p>
                <div className="mt-auto">
                  <Button asChild variant="primary" size="lg" className="w-full font-semibold">
                    <a href={internationalUrl} target="_blank" rel="noopener noreferrer">
                      <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                      {t("donate.ways.international.cta")}
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Transparency promise */}
            <div className="mx-auto mt-12 max-w-3xl text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {t("donate.transparency.eyebrow")}
              </p>
              <h2 className="mb-4 text-2xl font-bold tracking-normal text-foreground md:text-3xl">
                {t("donate.transparency.title")}
              </h2>
              <p className="text-base leading-8 text-foreground/75 md:text-[1.0625rem]">
                {t("donate.transparency.description")}
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="donate-faq" className="bg-background pt-10 pb-12 md:pt-12 md:pb-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {t("donate.faq.eyebrow")}
              </p>
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                {t("donate.faq.title")}
              </h2>
            </div>

            <Accordion type="single" collapsible className="mx-auto max-w-3xl">
              {faqItems.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  <AccordionTrigger className="text-left text-base font-semibold text-foreground">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-7 text-foreground/70">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <Cta />
      </main>
    </div>
  );
};

export default Donate;
