import { useTranslation } from "react-i18next";
import { CoreValues } from "@/components/about/core-values";
import { AboutHero } from "@/components/about/hero";
import { Helmet } from "react-helmet-async";

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>About | Jawafdehi Nepal</title>
        <meta name="description" content="Learn about Jawafdehi — Nepal's open corruption accountability platform. Meet the team behind Let's Build Nepal and NewNepal.org working to promote transparency." />
        <link rel="canonical" href="https://jawafdehi.org/about" />
        <meta property="og:site_name" content="Jawafdehi Nepal" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://jawafdehi.org/about" />
        <meta property="og:title" content="About | Jawafdehi Nepal" />
        <meta property="og:description" content="Learn about Jawafdehi — Nepal's open corruption accountability platform. Meet the team behind Let's Build Nepal and NewNepal.org working to promote transparency." />
        <meta property="og:image" content="https://jawafdehi.org/og-favicon.png" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About | Jawafdehi Nepal" />
        <meta name="twitter:description" content="Learn about Jawafdehi — Nepal's open corruption accountability platform. Meet the team behind Let's Build Nepal and NewNepal.org working to promote transparency." />
        <meta name="twitter:image" content="https://jawafdehi.org/og-favicon.png" />
      </Helmet>

      <main id="main-content" className="flex-1">
        <AboutHero />

        {/* About Us Section */}
        <section id="about-us" className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="space-y-12 md:space-y-16">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold text-foreground mb-6">{t("about.aboutUs.title")}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t("about.aboutUs.description").split(t("about.aboutUs.openSource")).map((part, index, array) => (
                    index < array.length - 1 ? (
                      <span key={index}>
                        {part}
                        <a
                          href="https://github.com/Jawafdehi"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {t("about.aboutUs.openSource")}
                        </a>
                      </span>
                    ) : part
                  ))}
                </p>
              </div>

              <div className="ml-auto max-w-3xl text-left md:text-right">
                <h2 className="text-3xl font-bold text-foreground mb-6">What We're Building</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Corruption-related records are scattered across dozens of government portals, court systems, and public databases — inaccessible to most citizens. We are building the technology and the volunteer network to bring it all into one permanent, publicly searchable knowledge base.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Free to use. Open source. Built entirely by Nepali volunteers who believe accountability has no expiry date.
                </p>
              </div>
            </div>
          </div>
        </section>

        <CoreValues />

      </main>

    </div>
  );
};

export default About;
