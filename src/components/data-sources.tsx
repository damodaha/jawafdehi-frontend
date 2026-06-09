import { Mic2, Youtube } from "lucide-react";
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
    <section id="data-sources" className="bg-background py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Where Our Data Comes From
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            We draw from official government sources, public records, media investigations,
            and independent civil society and always trace every claim back to its origin.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {EXTERNAL_SOURCES.map(({ icon: Icon, imageSrc, label, desc }) => (
            <div
              key={label}
              className="group flex flex-col items-center text-center"
            >
              <div className="mb-4 flex h-16 items-center justify-center">
                {imageSrc && (
                  <img
                    src={imageSrc}
                    alt=""
                    aria-hidden="true"
                    className="h-14 w-auto object-contain opacity-85 transition duration-300 group-hover:-translate-y-1 group-hover:opacity-100"
                  />
                )}
                {!imageSrc && Icon && (
                  <Icon
                    className="h-11 w-11 text-primary opacity-85 transition duration-300 group-hover:-translate-y-1 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                )}
              </div>

              <h3 className="text-base font-bold leading-tight text-foreground">
                {label}
              </h3>

              <p className="mt-2 max-w-[180px] text-sm leading-5 text-muted-foreground">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
