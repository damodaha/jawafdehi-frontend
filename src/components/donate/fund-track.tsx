import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Users } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useAnimate } from "motion/react-mini";
import CountUp from "react-countup";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

type Currency = "NPR" | "USD";

const COVERED_PERCENTAGE = 68;
const ACTIVE_SUPPORTERS = 128;
const FUNDING_BY_CURRENCY: Record<Currency, { monthlyCost: number; covered: number }> = {
  NPR: { monthlyCost: 126000, covered: 85680 },
  USD: { monthlyCost: 945, covered: 643 },
};

export function FundTrack() {
  const { t, i18n } = useTranslation();
  const [currency, setCurrency] = useState<Currency>("NPR");
  const prefersReducedMotion = useReducedMotion();
  const [progressScope, animateProgress] = useAnimate<HTMLDivElement>();
  const funding = FUNDING_BY_CURRENCY[currency];
  const locale = i18n.language.startsWith("ne") ? "ne-NP-u-nu-deva" : "en-US";

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value),
    [locale],
  );

  const formatCurrency = useCallback(
    (value: number) => {
      const amount = formatNumber(value);
      if (currency === "USD") return `$${amount}`;
      return `${i18n.language.startsWith("ne") ? "रु." : "Rs."} ${amount}`;
    },
    [currency, formatNumber, i18n.language],
  );

  const percentageLabel = `${formatNumber(COVERED_PERCENTAGE)}%`;
  const supporterLabel = formatNumber(ACTIVE_SUPPORTERS);
  const formatPercentage = useCallback(
    (value: number) => `${formatNumber(value)}%`,
    [formatNumber],
  );

  useEffect(() => {
    if (!progressScope.current) return;

    if (prefersReducedMotion) {
      progressScope.current.style.transform = `scaleX(${COVERED_PERCENTAGE / 100})`;
      return;
    }

    const controls = animateProgress(
      progressScope.current,
      { transform: ["scaleX(0)", `scaleX(${COVERED_PERCENTAGE / 100})`] },
      { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
    );

    return () => controls.stop();
  }, [animateProgress, prefersReducedMotion, progressScope]);

  return (
    <section aria-label={t("donate.fundTrack.ariaLabel")} className="bg-muted/10 pt-8 md:pt-10">
      <div className="container mx-auto px-4">
        <div className="overflow-hidden rounded-3xl border border-primary-foreground/10 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.96)_62%,hsl(var(--navy-dark))_100%)] text-primary-foreground shadow-[0_18px_48px_-30px_hsl(var(--primary)/0.65)]">
          <div className="flex justify-end px-5 pt-5 md:px-7 md:pt-6">
            <CurrencyToggle currency={currency} onChange={setCurrency} />
          </div>

          <div className="grid gap-8 px-6 pb-7 pt-4 md:px-8 md:pb-8 lg:grid-cols-[1fr_1.55fr_0.8fr_0.85fr] lg:gap-10">
            <div>
              <p className="text-sm font-medium text-primary-foreground/[0.68]">
                {t("donate.fundTrack.monthlyCost.label")}
              </p>
              <p className="mt-3 text-3xl font-bold tabular-nums">{formatCurrency(funding.monthlyCost)}</p>
              <p className="mt-3 text-sm leading-6 text-primary-foreground/[0.62]">
                {t("donate.fundTrack.monthlyCost.note")}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-primary-foreground/[0.68]">
                {t("donate.fundTrack.covered.label")}
              </p>
              <p className="mt-2 text-4xl font-bold tabular-nums" aria-label={percentageLabel}>
                {prefersReducedMotion ? (
                  percentageLabel
                ) : (
                  <CountUp
                    aria-hidden="true"
                    start={0}
                    end={COVERED_PERCENTAGE}
                    duration={0.9}
                    formattingFn={formatPercentage}
                    preserveValue
                  />
                )}
              </p>
              <p className="mt-1 text-sm font-semibold text-primary-foreground/[0.72]">
                {t("donate.fundTrack.covered.note", {
                  covered: formatCurrency(funding.covered),
                  total: formatCurrency(funding.monthlyCost),
                })}
              </p>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={COVERED_PERCENTAGE}
                aria-label={t("donate.fundTrack.covered.progressLabel", {
                  percentage: percentageLabel,
                })}
                className="mt-4 h-2.5 overflow-hidden rounded-full bg-primary-foreground/[0.16]"
              >
                <div
                  ref={progressScope}
                  className="h-full w-full origin-left rounded-full bg-accent"
                />
              </div>
              <div className="mt-2 flex justify-between text-xs font-semibold tabular-nums text-primary-foreground/[0.68]">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-primary-foreground/[0.68]">
                {t("donate.fundTrack.supporters.label")}
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <Users aria-hidden="true" className="h-6 w-6 text-primary-foreground/[0.58]" strokeWidth={1.7} />
                <p className="text-3xl font-bold tabular-nums" aria-label={supporterLabel}>
                  {prefersReducedMotion ? (
                    supporterLabel
                  ) : (
                    <CountUp
                      aria-hidden="true"
                      start={0}
                      end={ACTIVE_SUPPORTERS}
                      duration={0.9}
                      formattingFn={formatNumber}
                      preserveValue
                    />
                  )}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-primary-foreground/[0.62]">
                {t("donate.fundTrack.supporters.note")}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-primary-foreground/[0.68]">
                {t("donate.fundTrack.updated.label")}
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <CalendarDays
                  aria-hidden="true"
                  className="h-6 w-6 text-primary-foreground/[0.58]"
                  strokeWidth={1.7}
                />
                <p className="text-xl font-bold tabular-nums">{t("donate.fundTrack.updated.value")}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-primary-foreground/[0.62]">
                {t("donate.fundTrack.updated.note")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CurrencyToggle({
  currency,
  onChange,
}: Readonly<{ currency: Currency; onChange: (currency: Currency) => void }>) {
  const { t } = useTranslation();
  const nextCurrency: Currency = currency === "NPR" ? "USD" : "NPR";
  const nextCurrencyLabel =
    nextCurrency === "NPR"
      ? t("donate.fundTrack.currency.npr")
      : t("donate.fundTrack.currency.usd");

  return (
    <button
      type="button"
      onClick={() => onChange(nextCurrency)}
      role="switch"
      aria-checked={currency === "USD"}
      aria-label={`${t("donate.fundTrack.currency.label")}: ${nextCurrencyLabel}`}
      title={nextCurrencyLabel}
      className="relative inline-flex h-8 w-[68px] shrink-0 items-center overflow-hidden rounded-full border border-primary-foreground/10 bg-primary-foreground/[0.08] px-1 font-semibold leading-none text-primary-foreground shadow-inner shadow-black/10 transition-[background-color,border-color,box-shadow] duration-200 ease-out hover:bg-primary-foreground/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-1 top-1/2 h-6 w-[calc(50%-4px)] -translate-y-1/2 rounded-full bg-primary-foreground shadow-sm transition-transform duration-200 motion-reduce:transition-none",
          currency === "NPR" ? "translate-x-0" : "translate-x-full",
        )}
      />
      <span className="relative z-10 grid h-full w-full grid-cols-2 items-center">
        <span
          className={cn(
            "grid h-full place-items-center text-center text-[11px] font-bold transition-colors",
            currency === "NPR" ? "text-primary" : "text-primary-foreground/55",
          )}
        >
          रु
        </span>
        <span
          className={cn(
            "grid h-full place-items-center text-center text-[10px] font-bold transition-colors",
            currency === "USD" ? "text-primary" : "text-primary-foreground/55",
          )}
        >
          $
        </span>
      </span>
    </button>
  );
}
