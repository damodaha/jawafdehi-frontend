import { Helmet } from "react-helmet-async";
import {
  Building2,
  Mic2,
  Newspaper,
  ShieldCheck,
  Users,
  Youtube,
} from "lucide-react";

import { ProcessPipeline } from "@/components/ProcessPipeline";

const EXTERNAL_SOURCES = [
  { icon: Building2, label: "CIAA", desc: "Commission for the Investigation of Abuse of Authority" },
  { icon: ShieldCheck, label: "CIB", desc: "Central Investigation Bureau" },
  { icon: Newspaper, label: "Media", desc: "National and regional news organisations" },
  { icon: Mic2, label: "Investigative Journalists", desc: "Independent reporters and press groups" },
  { icon: Users, label: "Corruption Watchdogs", desc: "Civil society accountability organisations" },
  { icon: Youtube, label: "YouTubers & Creators", desc: "Digital journalists covering governance" },
];

const OurProcess = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Helmet>
      <title>Our Process — Jawafdehi</title>
      <meta name="description" content="How Jawafdehi discovers, researches, compiles, and publishes CIAA corruption cases — from raw government documents to a permanent public archive." />
      <link rel="canonical" href="https://jawafdehi.org/our-process" />
      <meta property="og:site_name" content="Jawafdehi Nepal" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://jawafdehi.org/our-process" />
      <meta property="og:title" content="Our Process — Jawafdehi" />
      <meta property="og:description" content="How Jawafdehi discovers, researches, compiles, and publishes CIAA corruption cases — from raw government documents to a permanent public archive." />
      <meta property="og:image" content="https://jawafdehi.org/og-favicon.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Our Process — Jawafdehi" />
      <meta name="twitter:description" content="How Jawafdehi discovers, researches, compiles, and publishes CIAA corruption cases — from raw government documents to a permanent public archive." />
      <meta name="twitter:image" content="https://jawafdehi.org/og-favicon.png" />
    </Helmet>

    <main id="main-content" className="flex-1">
      {/* Hero */}
      <section id="process-hero" className="bg-gradient-to-br from-primary via-navy-dark to-slate-800 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/50 mb-4">
              Our Process
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
              How a corruption case goes from discovery to the public archive
            </h1>
            <p className="text-lg text-primary-foreground/70 leading-relaxed">
              Every case on Jawafdehi passes through a structured pipeline — from raw government documents and media sources through research, AI-assisted drafting, human review, and permanent publication.
            </p>
          </div>
        </div>
      </section>

      <ProcessPipeline />

      {/* External sources */}
      <section id="data-sources" className="py-12 md:py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-2">Where Our Data Comes From</h2>
            <p className="text-muted-foreground max-w-2xl">
              We draw from official government sources and independent civil society — always citing the origin of every claim.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {EXTERNAL_SOURCES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-xl border border-border bg-background p-4 text-center">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-semibold text-foreground mb-1">{label}</div>
                <div className="text-xs text-muted-foreground leading-tight">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>

  </div>
);

export default OurProcess;
