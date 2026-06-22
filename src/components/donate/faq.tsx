import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

type FaqItem = { q: string; a: string };
type IndexedFaqItem = FaqItem & { index: number };

export function DonationFaq() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqItems = t("donate.faq.items", {
    returnObjects: true,
  }) as FaqItem[];
  const indexedItems = faqItems.map((item, index) => ({ ...item, index }));
  const columnBreak = Math.ceil(indexedItems.length / 2);
  const columns = [
    indexedItems.slice(0, columnBreak),
    indexedItems.slice(columnBreak),
  ];

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section
      id="donate-faq"
      className="bg-background py-16 md:py-20"
      aria-labelledby="donate-faq-title"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {t("donate.faq.eyebrow")}
            </p>
            <h2
              id="donate-faq-title"
              className="text-4xl font-bold leading-tight tracking-normal text-primary md:text-5xl"
            >
              {t("donate.faq.title")}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/65 md:text-lg">
              {t("donate.faq.description")}
            </p>
          </div>

          <div className="mt-12 grid items-start gap-4 md:mt-14 md:grid-cols-2 md:gap-5">
            {columns.map((column, columnIndex) => (
              <div
                key={columnIndex}
                className="flex flex-col gap-4"
              >
                {column.map((item) => (
                  <FaqEntry
                    key={item.q}
                    item={item}
                    isOpen={openIndex === item.index}
                    onToggle={() => toggleItem(item.index)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqEntry({
  item,
  isOpen,
  onToggle,
}: Readonly<{
  item: IndexedFaqItem;
  isOpen: boolean;
  onToggle: () => void;
}>) {
  const answerId = `donate-faq-${item.index}-answer`;
  const questionId = `donate-faq-${item.index}-question`;

  return (
    <article className="overflow-hidden rounded-2xl bg-muted/45 transition-colors duration-200 hover:bg-muted/65">
      <h3 id={questionId}>
        <button
          type="button"
          className="flex min-h-16 w-full items-center justify-between gap-5 px-6 py-5 text-left text-base font-semibold leading-6 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          aria-expanded={isOpen}
          aria-controls={answerId}
          onClick={onToggle}
        >
          <span>{item.q}</span>
          {isOpen ? (
            <Minus
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-foreground/55"
              strokeWidth={1.6}
            />
          ) : (
            <Plus
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-foreground/55"
              strokeWidth={1.6}
            />
          )}
        </button>
      </h3>

      <div
        id={answerId}
        role="region"
        aria-labelledby={questionId}
        hidden={!isOpen}
      >
        <p className="px-6 pb-6 pr-12 text-sm leading-7 text-muted-foreground md:text-base">
          {item.a}
        </p>
      </div>
    </article>
  );
}
