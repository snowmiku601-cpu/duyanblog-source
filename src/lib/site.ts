/**
 * Central site configuration for duyanblog.com.
 * The public URL can be overridden with NEXT_PUBLIC_SITE_URL (see .env.example).
 */
export const site = {
  name: "Duyan Blog",
  shortName: "Duyan",
  domain: "duyanblog.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://duyanblog.com",
  tagline: "Reviews with reasons attached.",
  description:
    "Duyan Blog is an independent editorial publication covering software, travel and technology. Hands-on reviews, honest comparisons and buying guides — with the methodology and trade-offs shown, not hidden.",
  locale: "en_US",
  publisherNote: "Reader-supported: we may earn a commission when you buy through links on this site. It never changes our verdicts.",
} as const;

/** Primary navigation shown in the site header. */
export const primaryNav = [
  { label: "Reviews", href: "/reviews" },
  { label: "Best picks", href: "/best" },
  { label: "Compare", href: "/compare" },
  { label: "Guides", href: "/guides" },
  { label: "Deals", href: "/deals" },
] as const;

export const footerNav = {
  sections: [
    { label: "Software & AI", href: "/software" },
    { label: "Travel & Connectivity", href: "/travel" },
    { label: "Tech & Hosting", href: "/tech" },
  ],
  explore: [
    { label: "Reviews", href: "/reviews" },
    { label: "Best picks", href: "/best" },
    { label: "Comparisons", href: "/compare" },
    { label: "Guides", href: "/guides" },
    { label: "Deals", href: "/deals" },
    { label: "Authors", href: "/authors" },
  ],
  company: [
    { label: "About us", href: "/about" },
    { label: "Methodology", href: "/methodology" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Editorial policy", href: "/editorial-policy" },
    { label: "How we make money", href: "/how-we-make-money" },
    { label: "Affiliate disclosure", href: "/affiliate-disclosure" },
    { label: "Advertising disclosure", href: "/advertising-disclosure" },
    { label: "Corrections policy", href: "/corrections-policy" },
    { label: "Privacy policy", href: "/privacy-policy" },
    { label: "Cookie policy", href: "/cookie-policy" },
    { label: "Terms of service", href: "/terms" },
  ],
} as const;

/** Map of article type → URL prefix (single canonical route per type). */
export const articleTypePaths = {
  review: "/reviews",
  roundup: "/best",
  versus: "/compare",
  guide: "/guides",
  editorial: "/articles",
} as const;

export type ArticleType = keyof typeof articleTypePaths;

export function articlePath(type: string, slug: string): string {
  const prefix = articleTypePaths[type as ArticleType] ?? "/articles";
  return `${prefix}/${slug}`;
}

export const articleTypeLabels: Record<ArticleType, string> = {
  review: "Review",
  roundup: "Best picks",
  versus: "Versus",
  guide: "Guide",
  editorial: "Editorial",
};
