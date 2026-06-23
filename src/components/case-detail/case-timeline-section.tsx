import { formatDateWithBS } from "@/utils/date";
import type { TimelineEntry } from "@/types/jds";
import { cn } from "@/lib/utils";

interface CaseTimelineSectionProps {
  className?: string;
  timeline: TimelineEntry[];
  title: string;
}

export function CaseTimelineSection({
  className,
  timeline,
  title,
}: Readonly<CaseTimelineSectionProps>) {
  if (timeline.length === 0) return null;

  return (
    <section
      id="timeline"
      className={cn("scroll-mt-28 no-page-break", className)}
      aria-label={title}
    >
      <h2 className="mb-6 text-2xl font-semibold text-primary">
        {title}
      </h2>

      <ol className="relative ml-3 border-l border-primary/30 pl-7 print:border-border">
        {timeline.map((item, index) => (
          <li key={`${item.date}-${item.title}-${index}`} className="relative pb-8 last:pb-0">
            <span
              className={cn(
                "absolute -left-[35px] top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-background",
                index === 0 ? "border-primary" : "border-primary/35"
              )}
              aria-hidden="true"
            />
            <p className="text-[15px] font-semibold leading-6 text-primary">
              {item.end_date
                ? `${formatDateWithBS(item.date, "PP", item.date_bs)} - ${formatDateWithBS(item.end_date, "PP", item.end_date_bs)}`
                : formatDateWithBS(item.date, "PP", item.date_bs)}
            </p>
            <p className="mt-1 text-lg font-semibold leading-7 text-primary">
              {item.title}
            </p>
            <p className="mt-1 text-base leading-7 text-primary/75">
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
