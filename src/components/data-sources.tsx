import {
  Mic2,
  Youtube,
} from "lucide-react";
import type { ElementType } from "react";
import { BsCameraReelsFill } from "react-icons/bs";
import { FaEye } from "react-icons/fa";

type ExternalSource = {
  icon?: ElementType;
  imageSrc?: string;
  label: string;
  desc: string;
};

const EXTERNAL_SOURCES: ExternalSource[] = [
  {
    imageSrc: "/assets/ciaa.png",
    label: "CIAA",
    desc: "Commission for the Investigation of Abuse of Authority",
  },
  {
    imageSrc: "/assets/cib.png",
    label: "CIB",
    desc: "Central Investigation Bureau",
  },
  {
    icon: BsCameraReelsFill,
    label: "Media",
    desc: "National and regional news organisations",
  },
  {
    icon: Mic2,
    label: "Investigative Journalists",
    desc: "Independent reporters and press groups",
  },
  {
    icon: FaEye,
    label: "Corruption Watchdogs",
    desc: "Civil society accountability organisations",
  },
  {
    icon: Youtube,
    label: "YouTubers & Creators",
    desc: "Digital journalists covering governance",
  },
];

export function DataSources() {
  return (
    <section id="data-sources" className="bg-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h2 className="mb-2 text-2xl font-bold text-foreground">Where Our Data Comes From</h2>
          <p className="max-w-2xl text-muted-foreground">
            We draw from official government sources and independent civil society — always citing
            the origin of every claim.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXTERNAL_SOURCES.map(({ icon: Icon, imageSrc, label, desc }) => (
            <div
              key={label}
              className="group flex flex-col items-center rounded-lg border border-border/55 bg-card px-6 py-8 text-center shadow-[0_16px_42px_rgba(15,23,42,0.055)] transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:border-foreground/20 hover:bg-background hover:shadow-[0_22px_56px_rgba(15,23,42,0.08)] motion-reduce:transform-none motion-reduce:transition-none dark:border-white/10 dark:bg-secondary/45 dark:shadow-black/20 dark:hover:border-white/20 dark:hover:bg-secondary/60 sm:p-8"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-accent/15 bg-accent/10 text-primary shadow-[0_12px_28px_hsl(var(--primary)/0.08)] transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 motion-reduce:transition-none">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt=""
                    aria-hidden="true"
                    className="h-8 w-8 object-contain mix-blend-multiply dark:mix-blend-normal"
                  />
                ) : Icon ? (
                  <Icon className="h-7 w-7" aria-hidden="true" strokeWidth={1.8} />
                ) : null}
              </div>

              <h3 className="mb-2 text-xl font-extrabold leading-tight text-foreground">
                {label}
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
