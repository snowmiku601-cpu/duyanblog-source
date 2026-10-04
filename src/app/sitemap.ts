import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { liveDateGuard } from "@/lib/queries";
import { articlePath, site } from "@/lib/site";
import { policySlugs } from "@/content/policies";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url;
  const now = new Date();

  const [articles, categories, authors, tagLinks] = await Promise.all([
    db.article.findMany({
      where: { status: "published", ...liveDateGuard() },
      select: { slug: true, type: true, updatedAt: true, publishedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.category.findMany({ select: { slug: true, updatedAt: true } }),
    db.author.findMany({ select: { slug: true, updatedAt: true } }),
    db.articleTag.findMany({
      where: { article: { status: "published", ...liveDateGuard() } },
      select: { tag: { select: { slug: true } } },
    }),
  ]);

  // Published-only tag slugs (deduplicated).
  const tagSlugs = [...new Set(tagLinks.map((t) => t.tag.slug))];

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/reviews`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/best`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/deals`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/articles`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/authors`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/methodology`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    ...policySlugs.map((slug) => ({
      url: `${base}/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: `${base}/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...articles.map((a) => ({
      url: `${base}${articlePath(a.type, a.slug)}`,
      lastModified: a.updatedAt,
      changeFrequency: "monthly" as const,
      priority: a.type === "review" || a.type === "roundup" ? 0.8 : 0.7,
    })),
    ...authors.map((a) => ({
      url: `${base}/authors/${a.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...tagSlugs.map((slug) => ({
      url: `${base}/tag/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];
}
