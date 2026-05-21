import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ExternalLink, Unlock } from "lucide-react";
import { FaFacebook, FaYoutube, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { SiLinktree, SiOpensourceinitiative } from "react-icons/si";

import { JAWAFDEHI_SOCIALS } from "@/config/constants";
import { cn } from "@/lib/utils";

type FooterLink = {
  label: string;
  to: string;
  external?: boolean;
};

type FooterSocialLink = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

type FooterBadge = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  marker?: string;
  iconClassName: string;
};

const linkClass =
  "group inline-flex min-h-9 items-center justify-between gap-3 rounded-full px-3 text-sm text-foreground/64 transition-all duration-200 hover:bg-secondary/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const footerBadges: FooterBadge[] = [
  {
    label: "Built by Nepali",
    marker: "🇳🇵",
    iconClassName: "",
  },
  {
    label: "Public domain",
    icon: Unlock,
    iconClassName: "text-emerald-600 dark:text-emerald-300",
  },
  {
    label: "Open source",
    icon: SiOpensourceinitiative,
    iconClassName: "text-emerald-600 dark:text-emerald-300",
  },
];

function FooterNavLink({ label, to, external }: FooterLink) {
  const content = (
    <>
      <span>{label}</span>
      {external && (
        <ExternalLink className="h-3.5 w-3.5 opacity-0 transition-opacity duration-200 group-hover:opacity-55" />
      )}
    </>
  );

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {content}
      </a>
    );
  }

  return (
    <Link to={to} className={linkClass}>
      {content}
    </Link>
  );
}

function FooterLinkGroup({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
        {title}
      </h3>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={`${link.label}-${link.to}`}>
            <FooterNavLink {...link} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const platformLinks: FooterLink[] = [
    { label: t("nav.cases"), to: "/cases" },
    { label: t("nav.ourProcess"), to: "/our-process" },
    { label: t("nav.ourCommitment"), to: "/commitment" },
    { label: t("nav.volunteer"), to: "/volunteer" },
  ];

  const aboutLinks: FooterLink[] = [
    { label: t("nav.about"), to: "/about" },
    { label: t("nav.team"), to: "/team" },
    { label: t("nav.products"), to: "/products" },
    { label: t("nav.updates"), to: "/updates" },
    { label: "Feedback", to: "/feedback" },
  ];

  const resourceLinks: FooterLink[] = [
    { label: t("footer.contributorPortal"), to: "https://portal.jawafdehi.org", external: true },
    { label: t("footer.githubRepo"), to: "https://github.com/Jawafdehi/Jawafdehi", external: true },
    { label: t("footer.siteStatus"), to: "https://stats.uptimerobot.com/lwVRcc5suC", external: true },
    { label: "Let's Build Nepal", to: "https://LetsBuildNepal.com", external: true },
  ];

  const socialLinks: FooterSocialLink[] = [
    { label: t("footer.social.facebook"), href: JAWAFDEHI_SOCIALS.facebook, icon: FaFacebook },
    { label: t("footer.social.youtube"), href: JAWAFDEHI_SOCIALS.youtube, icon: FaYoutube },
    { label: t("footer.social.linkedin"), href: JAWAFDEHI_SOCIALS.linkedin, icon: FaLinkedin },
    { label: t("footer.social.whatsapp"), href: JAWAFDEHI_SOCIALS.whatsapp, icon: FaWhatsapp },
    { label: t("footer.social.linktree"), href: JAWAFDEHI_SOCIALS.linktree, icon: SiLinktree },
  ];

  return (
    <footer className="relative isolate overflow-hidden border-t border-border bg-background text-foreground">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(hsl(var(--foreground)/0.15)_0.75px,transparent_0.75px)] [background-size:18px_18px] dark:hidden"
      />

      <div className="container mx-auto px-4 py-12 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(280px,1.15fr)_minmax(0,1.85fr)] lg:gap-14">
          <div className="space-y-6">
            <Link
              to="/"
              aria-label="Jawafdehi home"
              className="inline-flex rounded-full transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <img
                src="/assets/logo.png"
                alt="Jawafdehi"
                className="h-9 w-auto object-contain dark:hidden"
              />
              <img
                src="/assets/logo-dark.png"
                alt="Jawafdehi"
                className="hidden h-9 w-auto object-contain dark:block"
              />
            </Link>

            <div className="max-w-sm space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                Accountability has no expiry
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Nepal's permanent public archive of CIAA corruption cases, free forever, built by Nepali volunteers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-muted-foreground">
              {footerBadges.map(({ label, icon: Icon, marker, iconClassName }, index) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5"
                >
                  {index > 0 && (
                    <span aria-hidden="true" className="mr-1 h-1 w-1 rounded-full bg-border" />
                  )}
                  {marker ? (
                    <span aria-hidden="true" className="text-sm leading-none">
                      {marker}
                    </span>
                  ) : Icon ? (
                    <Icon className={cn("h-3.5 w-3.5", iconClassName)} />
                  ) : null}
                  {label}
                </span>
              ))}
            </div>

          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <FooterLinkGroup title="Platform" links={platformLinks} />
            <FooterLinkGroup title={t("nav.about")} links={aboutLinks} />
            <FooterLinkGroup title={t("footer.resources")} links={resourceLinks} />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-3xl text-xs leading-5 text-muted-foreground">
            {t("footer.disclaimer")}
          </p>

          <div className="flex shrink-0 flex-wrap gap-2">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/70 text-foreground/65 shadow-sm shadow-foreground/5 transition-all duration-200",
                  "hover:-translate-y-0.5 hover:border-foreground/15 hover:bg-background hover:text-primary hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                )}
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Jawafdehi. All data is in the public domain.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
