import { AlertTriangle } from "lucide-react";

interface KeyAllegationsSectionProps {
  allegations: string[];
  emptyLabel: string;
  title: string;
}

export function KeyAllegationsSection({
  allegations,
  emptyLabel,
  title,
}: Readonly<KeyAllegationsSectionProps>) {
  return (
    <section id="allegations" className="mb-12 scroll-mt-28 max-w-4xl">
      <h2 className="mb-6 flex items-center text-2xl md:text-3xl font-semibold tracking-tight text-primary">
        <AlertTriangle className="mr-2 h-5 w-5" />
        {title}
      </h2>

      <div className="text-primary/75">
        <ul className="space-y-6">
          {allegations.map((allegation, index) => (
            <li key={index} className="flex items-start gap-4">
              <span className="mt-1 shrink-0 text-lg font-bold leading-7 text-accent">
                #{index + 1}.
              </span>
              <p className="max-w-4xl text-base md:text-lg font-medium leading-[1.7] text-primary/75">
                {allegation}
              </p>
            </li>
          ))}
          {allegations.length === 0 && (
            <li className="text-base italic leading-7 text-primary/75">
              {emptyLabel}
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
