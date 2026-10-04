import type { Metadata } from "next";
import { site } from "@/lib/site";

/**
 * SEO helpers: canonical metadata builder + JSON-LD builders.
 * Only legitimate structured data is emitted (Organization, WebSite,
 * BreadcrumbList, Article, Person, ItemList of article links).
 * No fake Review/aggregateRating schema is produced for demo content —
 * see SEO_GUIDE.md.
 */

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: string[];
  section?: string | null;
  noIndex?: boolean;
  /** Per-page RSS autodiscovery (e.g. "/feed.xml?category=software"). */
  rss?: string;
  /** Per-page JSON Feed autodiscovery (e.g. "/feed.json?category=software"). */
  jsonFeed?: string;
};

export function buildMetadata(input: PageMetaInput): Metadata {
  const url = absoluteUrl(input.path);
  // Default OG image lives at /images/og-default.png (public/images) — the
  // old "/og-default.png" fallback 404ed, so pages without an explicit image
  // shipped a broken og:image to social scrapers.
  const image = input.image ?? "/images/og-default.png";
  const metadata: Metadata = {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: url,
      types: {
        "application/rss+xml": absoluteUrl(input.rss ?? "/feed.xml"),
        ...(input.jsonFeed ? { "application/feed+json": absoluteUrl(input.jsonFeed) } : {}),
      },
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: site.name,
      type: input.type ?? "website",
      images: [{ url: absoluteUrl(image), width: 1344, height: 768, alt: input.title }],
      ...(input.type === "article"
        ? {
            publishedTime: input.publishedTime ?? undefined,
            modifiedTime: input.modifiedTime ?? undefined,
            authors: input.authors?.map((a) => absoluteUrl("/authors")),
            section: input.section ?? undefined,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [absoluteUrl(image)],
    },
    ...(input.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
  return metadata;
}

// ---------------------------------------------------------------------------
// JSON-LD builders
// ---------------------------------------------------------------------------

export type Crumb = { label: string; href?: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: absoluteUrl(c.href) } : {}),
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: site.name,
    url: site.url,
    logo: { "@type": "ImageObject", url: absoluteUrl("/logo/logo-symbol.svg") },
    description: site.description,
    sameAs: [],
    publishingPrinciples: absoluteUrl("/editorial-policy"),
    correctionsPolicy: absoluteUrl("/corrections-policy"),
    ethicsPolicy: absoluteUrl("/how-we-make-money"),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function personJsonLd(person: { name: string; slug: string; role: string; bio: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    jobTitle: person.role,
    description: person.bio,
    url: absoluteUrl(`/authors/${person.slug}`),
    worksFor: { "@type": "Organization", name: site.name },
  };
}

export function articleJsonLd(article: {
  type: string;
  title: string;
  deck: string;
  slug: string;
  path: string;
  image: string | null;
  authorName: string;
  authorSlug: string;
  publishedAt: Date | null;
  updatedAt: Date;
  section: string;
}) {
  const url = absoluteUrl(article.path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.deck,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(article.image ? { image: [absoluteUrl(article.image)] } : {}),
    author: {
      "@type": "Person",
      name: article.authorName,
      url: absoluteUrl(`/authors/${article.authorSlug}`),
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo/logo-symbol.svg") },
    },
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    articleSection: article.section,
    isAccessibleForFree: true,
  };
}

/** ItemList of internal article links (best-of pages, category hubs). */
export function itemListJsonLd(name: string, items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: absoluteUrl(it.url),
    })),
  };
}
