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
              className="group grid min-h-[245px] grid-rows-[6rem_2.5rem_auto] items-start rounded-lg border border-border/55 bg-card p-8 text-center shadow-[0_16px_42px_rgba(15,23,42,0.055)] transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:border-foreground/15 hover:bg-background hover:shadow-[0_22px_56px_rgba(15,23,42,0.08)] motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div className="flex h-24 items-center justify-center">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt=""
                    aria-hidden="true"
                    className="h-24 w-24 object-contain transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-105 motion-reduce:transition-none"
                  />
                ) : Icon ? (
                  <Icon
                    className="h-10 w-10 text-primary transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                ) : null}
              </div>

              <div className="flex items-center justify-center text-xl font-semibold leading-tight text-foreground">
                {label}
              </div>
              <div className="text-sm leading-6 text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
