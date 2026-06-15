import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Heart,
  HeartHandshake,
  Search,
  ShieldCheck,
} from "lucide-react";
import { TbBrandOpenSource } from "react-icons/tb";

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
type WalletLogo = "esewa" | "khalti";

const impactIcons = [Globe, Search, ShieldCheck, TbBrandOpenSource];

function CopyField({
  label,
  value,
  walletLogo,
}: Readonly<{ label: string; value: string; walletLogo: WalletLogo }>) {
  const { t } = useTranslation();
  const onCopy = () => {
    void navigator.clipboard?.writeText(value).then(
      () => toast.success(t("donate.ways.copied")),
      () => undefined,
    );
  };
  return (
    <div className="flex min-h-[3.5rem] items-center justify-between gap-3 rounded-lg border border-border/90 bg-background px-3 py-2 shadow-sm shadow-foreground/[0.025]">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={`/assets/${walletLogo}.webp`}
          alt=""
          aria-hidden="true"
          width="64"
          height="32"
          className="h-8 w-16 flex-shrink-0 object-contain object-left"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium leading-4 text-foreground/60">{label}</p>
          <p className="truncate text-sm font-semibold leading-5 text-foreground">{value}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onCopy}
        aria-label={`${t("donate.ways.copy")} ${label}`}
        className="h-9 w-9 flex-shrink-0 text-foreground/60 hover:bg-muted hover:text-foreground"
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

        {/* Ways to give */}
        <section id="donate-ways" className="scroll-mt-[76px] bg-muted/20 pt-10 pb-12 md:pt-12 md:pb-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-8 max-w-2xl text-center">
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

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col rounded-xl border border-border/90 bg-background p-5 shadow-sm shadow-foreground/[0.035]">
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="text-lg font-bold leading-tight text-foreground">{t("donate.ways.wallets.title")}</h3>
                </div>
                <p className="mb-3 text-sm leading-6 text-foreground/70">{t("donate.ways.wallets.desc")}</p>
                <div className="space-y-2.5">
                  <CopyField walletLogo="esewa" label={t("donate.ways.wallets.esewaLabel")} value={t("donate.ways.wallets.esewaId")} />
                  <CopyField walletLogo="khalti" label={t("donate.ways.wallets.khaltiLabel")} value={t("donate.ways.wallets.khaltiId")} />
                </div>
                <p className="mt-5 text-xs leading-5 text-foreground/60">{t("donate.ways.wallets.qrNote")}</p>
              </div>

              <div className="flex flex-col rounded-xl border border-border/90 bg-background p-5 shadow-sm shadow-foreground/[0.035]">
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="text-lg font-bold leading-tight text-foreground">{t("donate.ways.international.title")}</h3>
                </div>
                <p className="text-sm leading-6 text-foreground/70">{t("donate.ways.international.desc")}</p>
                <div className="flex flex-col">
                  <img
                    src="/assets/globe.svg"
                    alt=""
                    aria-hidden="true"
                    width="1113"
                    height="750"
                    className="mx-auto mb-2 h-32 w-full max-w-[14rem] object-contain"
                  />
                  <Button asChild variant="primary" size="lg" className="w-full overflow-hidden font-semibold">
                    <a
                      href={internationalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="donate-heart-button relative isolate"
                    >
                      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                        <Heart className="donate-heart donate-heart-1" />
                        <Heart className="donate-heart donate-heart-2" />
                        <Heart className="donate-heart donate-heart-3" />
                        <Heart className="donate-heart donate-heart-4" />
                        <Heart className="donate-heart donate-heart-5" />
                      </span>
                      <span className="relative z-10">{t("donate.ways.international.cta")}</span>
                      <ExternalLink className="relative z-10 h-4 w-4" aria-hidden="true" />
                    </a>
                  </Button>

                </div>
              </div>

              <div className="relative isolate flex flex-col overflow-hidden rounded-xl border border-border/90 bg-background p-5 shadow-sm shadow-foreground/[0.035] transition-all duration-300 before:pointer-events-none before:absolute before:-right-24 before:-top-28 before:z-0 before:h-96 before:w-96 before:rounded-full before:bg-accent before:opacity-0 before:blur-[86px] before:transition-opacity before:duration-300 after:pointer-events-none after:absolute after:-bottom-28 after:-left-28 after:z-0 after:h-80 after:w-80 after:rounded-full after:bg-[hsl(var(--primary)/0.45)] after:opacity-0 after:blur-[80px] after:transition-opacity after:duration-300 hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_24px_52px_-32px_hsl(var(--foreground)/0.45)] hover:before:opacity-45 hover:after:opacity-45 motion-reduce:transform-none motion-reduce:transition-none [&>*]:relative [&>*]:z-10 md:col-span-2 lg:col-span-1">
                <div className="mb-3 flex items-center gap-3">
                  <HeartHandshake
                    aria-hidden="true"
                    className="h-7 w-7 flex-shrink-0 text-primary"
                    strokeWidth={1.6}
                  />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                    {t("donate.transparency.eyebrow")}
                  </p>
                </div>
                <h3 className="text-xl font-bold leading-tight text-foreground">
                  {t("donate.transparency.title")}
                </h3>
                <p className="mt-4 text-base leading-7 text-foreground/85">
                  {t("donate.transparency.description")}
                </p>
              </div>
            </div>

            <div className="mx-auto mt-5 max-w-6xl rounded-xl border border-border/90 bg-background p-5 shadow-sm shadow-foreground/[0.035]">
              <div className="mb-3 flex items-center gap-3">
                <FileText aria-hidden="true" className="h-7 w-7 flex-shrink-0 text-primary" strokeWidth={1.6} />
                <h3 className="text-lg font-bold leading-tight text-foreground">{t("donate.ways.bank.title")}</h3>
              </div>
              <p className="mb-4 text-sm leading-6 text-foreground/70">{t("donate.ways.bank.desc")}</p>
              <dl className="grid gap-x-10 gap-y-5 rounded-lg bg-muted/70 p-5 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-xs font-medium text-foreground/60">{t("donate.ways.bank.accountNameLabel")}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{t("donate.ways.bank.accountName")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-foreground/60">{t("donate.ways.bank.accountNumberLabel")}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{t("donate.ways.bank.accountNumber")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-foreground/60">{t("donate.ways.bank.bankNameLabel")}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{t("donate.ways.bank.bankName")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-foreground/60">{t("donate.ways.bank.branchLabel")}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{t("donate.ways.bank.branch")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-foreground/60">{t("donate.ways.bank.swiftLabel")}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{t("donate.ways.bank.swift")}</dd>
                </div>
              </dl>
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
