import { updates } from "./updates.ts";

export type SearchIconName =
  | "BookOpen"
  | "Building2"
  | "FileText"
  | "HeartHandshake"
  | "Home"
  | "Info"
  | "MessageCircle"
  | "Newspaper"
  | "Search"
  | "ShieldCheck"
  | "Users";

export type SearchIndexGroup = "pages" | "updates" | "cases" | "entities";

export type SearchIndexEntry = {
  path: string;
  title?: string;
  titleKey?: string;
  description?: string;
  descriptionKey?: string;
  keywords: string[];
  icon: SearchIconName;
  group: SearchIndexGroup;
  lines?: SearchIndexLine[];
};

export type SearchIndexLine = {
  line: number;
  text: string;
  sectionId?: string;
};

export type SearchIndexFile = {
  version: 1;
  generatedAt: string;
  entries: SearchIndexEntry[];
};

export type StaticSiteRoute = {
  path: string;
  titleKey: string;
  descriptionKey: string;
  keywords: string[];
  icon: SearchIconName;
  sitemapTitle: string;
};

export type UpdateRouteEntry = {
  id: string;
  title: string;
};

export const PRE_RENDERED_STATIC_ROUTES = [
  {
    path: "/",
    titleKey: "nav.home",
    descriptionKey: "searchCommand.descriptions.home",
    keywords: ["home", "jawafdehi", "start"],
    icon: "Home",
    sitemapTitle: "Jawafdehi — Nepal Open Corruption Database",
  },
  {
    path: "/cases",
    titleKey: "header.browseCases",
    descriptionKey: "searchCommand.descriptions.cases",
    keywords: ["cases", "corruption", "archive"],
    icon: "Search",
    sitemapTitle: "Cases — Jawafdehi",
  },
  {
    path: "/entities",
    titleKey: "nav.entities",
    descriptionKey: "searchCommand.descriptions.entities",
    keywords: ["entities", "people", "organizations", "officials"],
    icon: "Building2",
    sitemapTitle: "Entities — Jawafdehi",
  },
  {
    path: "/information",
    titleKey: "nav.information",
    descriptionKey: "searchCommand.descriptions.information",
    keywords: ["information", "faq", "resources", "guide"],
    icon: "BookOpen",
    sitemapTitle: "Information — Jawafdehi",
  },
  {
    path: "/our-process",
    titleKey: "nav.ourProcess",
    descriptionKey: "searchCommand.descriptions.process",
    keywords: ["process", "verification", "methodology"],
    icon: "ShieldCheck",
    sitemapTitle: "Our Process — Jawafdehi",
  },
  {
    path: "/commitment",
    titleKey: "nav.ourCommitment",
    descriptionKey: "searchCommand.descriptions.commitment",
    keywords: ["commitment", "principles", "trust"],
    icon: "FileText",
    sitemapTitle: "Our Commitment — Jawafdehi",
  },
  {
    path: "/volunteer",
    titleKey: "nav.volunteer",
    descriptionKey: "searchCommand.descriptions.volunteer",
    keywords: ["volunteer", "contribute", "help"],
    icon: "HeartHandshake",
    sitemapTitle: "Volunteer — Jawafdehi",
  },
  {
    path: "/about",
    titleKey: "nav.about",
    descriptionKey: "searchCommand.descriptions.about",
    keywords: ["about", "mission", "jawafdehi"],
    icon: "Info",
    sitemapTitle: "About — Jawafdehi",
  },
  {
    path: "/team",
    titleKey: "nav.team",
    descriptionKey: "searchCommand.descriptions.team",
    keywords: ["team", "people", "members"],
    icon: "Users",
    sitemapTitle: "Our Team — Jawafdehi",
  },
  {
    path: "/products",
    titleKey: "nav.products",
    descriptionKey: "searchCommand.descriptions.products",
    keywords: ["products", "tools", "platforms"],
    icon: "FileText",
    sitemapTitle: "Products — Jawafdehi",
  },
  {
    path: "/updates",
    titleKey: "nav.updates",
    descriptionKey: "searchCommand.descriptions.updates",
    keywords: ["updates", "news", "posts"],
    icon: "Newspaper",
    sitemapTitle: "Updates — Jawafdehi",
  },
  {
    path: "/ask",
    titleKey: "header.askJawafdehi",
    descriptionKey: "searchCommand.descriptions.ask",
    keywords: ["ask", "chat", "assistant", "question"],
    icon: "MessageCircle",
    sitemapTitle: "Ask Jawafdehi — Jawafdehi",
  },
  {
    path: "/report",
    titleKey: "searchCommand.pageTitles.report",
    descriptionKey: "searchCommand.descriptions.report",
    keywords: ["report", "allegation", "submit"],
    icon: "FileText",
    sitemapTitle: "Report a Case — Jawafdehi",
  },
  {
    path: "/feedback",
    titleKey: "searchCommand.pageTitles.feedback",
    descriptionKey: "searchCommand.descriptions.feedback",
    keywords: ["feedback", "bug", "suggestion"],
    icon: "MessageCircle",
    sitemapTitle: "Feedback — Jawafdehi",
  },
  {
    path: "/privacy",
    titleKey: "searchCommand.pageTitles.privacy",
    descriptionKey: "searchCommand.descriptions.privacy",
    keywords: ["privacy", "cookies", "data"],
    icon: "ShieldCheck",
    sitemapTitle: "Privacy Policy — Jawafdehi",
  },
  {
    path: "/terms",
    titleKey: "searchCommand.pageTitles.terms",
    descriptionKey: "searchCommand.descriptions.terms",
    keywords: ["terms", "service", "rules"],
    icon: "FileText",
    sitemapTitle: "Terms of Service — Jawafdehi",
  },
] as const satisfies readonly StaticSiteRoute[];

export const UPDATE_ROUTE_ENTRIES = updates.map(({ id, title }) => ({
  id,
  title: `${title} — Jawafdehi`,
})) satisfies readonly UpdateRouteEntry[];

export function staticRouteToSearchEntry(route: StaticSiteRoute): SearchIndexEntry {
  return {
    path: route.path,
    titleKey: route.titleKey,
    descriptionKey: route.descriptionKey,
    keywords: route.keywords,
    icon: route.icon,
    group: "pages",
  };
}

export function updateRouteToSearchEntry(update: UpdateRouteEntry): SearchIndexEntry {
  return {
    path: `/updates/${update.id}`,
    title: update.title,
    descriptionKey: "searchCommand.descriptions.updateDetail",
    keywords: ["updates", "news", "posts", update.id],
    icon: "Newspaper",
    group: "updates",
  };
}

export function buildFallbackSearchIndexEntries(): SearchIndexEntry[] {
  return [
    ...PRE_RENDERED_STATIC_ROUTES.map(staticRouteToSearchEntry),
    ...UPDATE_ROUTE_ENTRIES.map(updateRouteToSearchEntry),
  ];
}
