import { Helmet } from "react-helmet-async";
import { Cta } from "@/components/home/cta";
import { VolunteerHero } from "@/components/volunteer/hero";
import {
  BookOpen,
  BriefcaseBusiness,
  FlaskConical,
  Globe,
  GraduationCap,
  Laptop,
  Megaphone,
  Scale,
  Search,
  type LucideIcon,
} from "lucide-react";

const TEAMS = [
  {
    icon: Search,
    name: "Data Scraping Team",
    responsibilities: [
      "Archive government documents into digital text for large-scale analysis",
      "Scrape Nepali media sources — existing and newly identified",
      "Leverage AI to bootstrap case drafts and update them as new information emerges",
      "Maintain the Nepal Entity Service data pipeline",
    ],
  },
  {
    icon: Megaphone,
    name: "Outreach Team",
    responsibilities: [
      "Build relationships with investigative journalists, corruption watchdogs, and YouTubers",
      "Source evidence and case leads from civil society organisations",
      "Coordinate with CIAA, CIB, and media for primary source access",
    ],
  },
  {
    icon: Globe,
    name: "Platform Development",
    responsibilities: [
      "Keep the platform accessible and performant for all stakeholders",
      "Maintain open APIs for public data access",
      "Build monitoring dashboards and run load testing",
      "Ship website improvements based on user feedback",
    ],
  },
  {
    icon: BookOpen,
    name: "Corruption Compilation Team",
    responsibilities: [
      "Compile, structure, and publish corruption cases",
      "Maintain case accuracy with ongoing updates and corrections",
      "Ensure every published case meets verification standards",
    ],
  },
  {
    icon: FlaskConical,
    name: "Corruption Research",
    responsibilities: [
      "Investigate what legally and ethically constitutes corruption in each context",
      "Analyse the role of corruption in Nepali governance structures",
      "Evaluate the effectiveness of anti-corruption policy and institutional frameworks",
    ],
  },
];

type VolunteerProfile = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

const VOLUNTEER_PROFILES: VolunteerProfile[] = [
  {
    icon: Laptop,
    title: "Technology Enthusiasts",
    desc: "Developers, data engineers, and AI practitioners who want to build civic infrastructure that matters. Frontend, backend, scraping, NLP — all skills are needed.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Working Professionals",
    desc: "Accountants, analysts, policy professionals, and domain experts who can bring their field knowledge to understanding and verifying corruption cases.",
  },
  {
    icon: Scale,
    title: "Legal Professionals",
    desc: "Lawyers, law students, and legal researchers who can help interpret CIAA filings, court orders, and legal timelines accurately for a public audience.",
  },
  {
    icon: GraduationCap,
    title: "Students",
    desc: "Students in law, public policy, computer science, journalism, or any field — this is real-world experience working on a problem that matters for Nepal.",
  },
];

const Volunteer = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Helmet>
      <title>Volunteer with Us — Jawafdehi</title>
      <meta name="description" content="Join Jawafdehi as a volunteer. Help build Nepal's permanent corruption case archive — as a researcher, engineer, journalist, or translator." />
      <link rel="canonical" href="https://jawafdehi.org/volunteer" />
      <meta property="og:site_name" content="Jawafdehi Nepal" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://jawafdehi.org/volunteer" />
      <meta property="og:title" content="Volunteer with Us — Jawafdehi" />
      <meta property="og:description" content="Join Jawafdehi as a volunteer. Help build Nepal's permanent corruption case archive — as a researcher, engineer, journalist, or translator." />
      <meta property="og:image" content="https://jawafdehi.org/og-favicon.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Volunteer with Us — Jawafdehi" />
      <meta name="twitter:description" content="Join Jawafdehi as a volunteer. Help build Nepal's permanent corruption case archive — as a researcher, engineer, journalist, or translator." />
      <meta name="twitter:image" content="https://jawafdehi.org/og-favicon.png" />
    </Helmet>

    <main id="main-content" className="flex-1">
      <VolunteerHero />

      {/* Who we're looking for */}
      <section id="who-we-need" className="bg-muted/10 pt-12 pb-10 md:pt-14 md:pb-12 lg:pt-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Who can join
            </p>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Who we're looking for
            </h2>
            <p className="mt-4 text-base leading-7 text-foreground/70">
              You don't need to be an expert. You need to care about Nepal and be willing to contribute your skills. Jawafdehi needs people who can help with technology, research, legal interpretation, data compilation, outreach, and translation.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-4 lg:gap-10">
            {VOLUNTEER_PROFILES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="mx-auto flex max-w-[16rem] flex-col items-center text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/[0.07] text-primary">
                  <Icon aria-hidden="true" className="h-10 w-10" strokeWidth={1.45} />
                </div>
                <h3 className="mb-2 text-lg font-bold leading-tight text-foreground">{title}</h3>
                <p className="text-sm leading-6 text-foreground/70">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Global community
            </p>
            <h2 className="mb-4 text-2xl font-bold tracking-normal text-foreground md:text-3xl">
              A worldwide network of Nepali professionals
            </h2>
            <p className="text-base leading-8 text-foreground/75 md:text-[1.0625rem]">
              Our volunteers are based across Nepal and around the world — in the US, Thailand, India, and beyond. When you join Jawafdehi, you become part of a global community of Nepali professionals united by a single goal: making sure Nepal remembers.
            </p>
          </div>
        </div>
      </section>

      {/* Teams */}
      <section id="volunteer-teams" className="bg-muted/20 pt-10 pb-12 md:pt-12 md:pb-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Where you can help
            </p>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Our Volunteer Teams
            </h2>
            <p className="mt-4 text-base leading-7 text-foreground/70">
              Each team owns a distinct part of the pipeline. Find the one that matches your skills.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TEAMS.map(({ icon: Icon, name, responsibilities }) => (
              <div key={name} className="rounded-lg border border-primary/10 bg-background/70 p-6 shadow-sm shadow-primary/5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/[0.07] text-primary">
                    <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={1.55} />
                  </div>
                  <h3 className="text-lg font-bold leading-tight text-foreground">{name}</h3>
                </div>
                <ul className="space-y-3">
                  {responsibilities.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-foreground/70">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Cta />
    </main>

  </div>
);

export default Volunteer;
