import { FileCheck2, FileSearch, Handshake, Scale, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

type CoreValue = {
  key: "integrity" | "transparency" | "accuracy" | "publicService";
  icon: LucideIcon;
};

const coreValues: CoreValue[] = [
  { key: "integrity", icon: Scale },
  { key: "transparency", icon: FileSearch },
  { key: "accuracy", icon: FileCheck2 },
  { key: "publicService", icon: Handshake },
];

export function CoreValues() {
  const { t } = useTranslation();

  return (
    <section id="values" className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">
          {t("about.values.title")}
        </h2>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          {coreValues.map(({ key, icon: Icon }) => (
            <div key={key} className="mx-auto flex max-w-xs flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon aria-hidden="true" className="h-10 w-10" strokeWidth={1.75} />
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground">
                {t(`about.values.${key}.title`)}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {t(`about.values.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
