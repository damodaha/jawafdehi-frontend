import { Helmet } from "react-helmet-async";

import { DataSources } from "@/components/data-sources";
import { ProcessPipeline } from "@/components/process";

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

      <DataSources />
    </main>

  </div>
);

export default OurProcess;
