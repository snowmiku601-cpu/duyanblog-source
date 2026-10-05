import { db } from "@/lib/db";
import { articlePath } from "@/lib/site";

/**
 * Shared server-side data fetchers for public pages.
 * Public pages are cached/revalidated (never per-request dynamic) — admin
 * mutations call revalidatePath() to bust affected routes.
 */

export type ArticleCardData = {
  id: string;
  slug: string;
  type: string;
  title: string;
  deck: string;
  heroImage: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  categorySlug: string;
  categoryName: string;
  authorName: string;
  authorSlug: string;
  readingMinutes: number | null;
};

export const articleCardSelect = {
  id: true,
  slug: true,
  type: true,
  title: true,
  deck: true,
  heroImage: true,
  publishedAt: true,
  updatedAt: true,
  readingMinutes: true,
  category: { select: { slug: true, name: true } },
  author: { select: { slug: true, name: true } },
} as const;

type ArticleCardRow = {
  id: string;
  slug: string;
  type: string;
  title: string;
  deck: string;
  heroImage: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  readingMinutes: number | null;
  category: { slug: string; name: string } | null;
  author: { slug: string; name: string } | null;
};

export function toCardData(row: ArticleCardRow): ArticleCardData {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    title: row.title,
    deck: row.deck,
    heroImage: row.heroImage,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    categorySlug: row.category?.slug ?? "tech",
    categoryName: row.category?.name ?? "Tech",
    authorName: row.author?.name ?? "Duyan Blog",
    authorSlug: row.author?.slug ?? "duyan-editors",
    readingMinutes: row.readingMinutes,
  };
}

/**
 * Public visibility guard: status "published" AND the publish time has arrived.
 *
 * Scheduled publishing: an editor can set a future publishedAt — the story
 * stays out of every public surface (indexes, search, feeds, sitemap, story
 * pages) until the moment passes. A null publishedAt stays visible (legacy
 * safety: nothing published before this feature should vanish). Public pages
 * render with ISR (revalidate ≤ 300 s), so a scheduled story goes live within
 * one cache cycle after its publish moment.
 */
export function liveDateGuard(): { OR: Array<Record<string, unknown>> } {
  return { OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] };
}

/**
 * Demo-content crawler exclusion (Correction 6): Article.isDemo === true →
 * noindex, excluded from sitemap, excluded from feeds, and no Review/Product
 * rich-result schema. Applied uniformly everywhere (no prod/staging branching).
 * A property rule: the flag on the row is the single source of truth.
 */
export const demoExcludedWhere = { isDemo: false } as const;

export async function getCategories() {
  return db.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function getLatestArticles(limit = 8): Promise<ArticleCardData[]> {
  const rows = await db.article.findMany({
    where: { status: "published", ...liveDateGuard() },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: articleCardSelect,
  });
  return rows.map(toCardData);
}

export async function getFeaturedArticle(): Promise<ArticleCardData | null> {
  const featured = await db.article.findFirst({
    where: { status: "published", featured: true, ...liveDateGuard() },
    orderBy: [{ publishedAt: "desc" }],
    select: articleCardSelect,
  });
  if (featured) return toCardData(featured);
  const fallback = await db.article.findFirst({
    where: { status: "published", ...liveDateGuard() },
    orderBy: [{ publishedAt: "desc" }],
    select: articleCardSelect,
  });
  return fallback ? toCardData(fallback) : null;
}

export async function getArticlesByType(type: string, limit = 12): Promise<ArticleCardData[]> {
  const rows = await db.article.findMany({
    where: { status: "published", type, ...liveDateGuard() },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: articleCardSelect,
  });
  return rows.map(toCardData);
}

export async function getArticlesByCategory(categoryId: string, limit = 24): Promise<ArticleCardData[]> {
  const rows = await db.article.findMany({
    where: { status: "published", categoryId, ...liveDateGuard() },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: articleCardSelect,
  });
  return rows.map(toCardData);
}

export async function getPublishedArticleBySlug(slug: string) {
  return db.article.findFirst({
    where: { slug, status: "published", ...liveDateGuard() },
    include: {
      category: true,
      author: true,
      reviewer: true,
      scores: { orderBy: { order: "asc" } },
      sources: { orderBy: { order: "asc" } },
      offers: { where: { active: true }, include: { merchant: true }, orderBy: { order: "asc" } },
      comparison: {
        include: {
          items: {
            orderBy: { order: "asc" },
            include: { offer: { include: { merchant: true } } },
          },
        },
      },
      tags: { include: { tag: true } },
    },
  });
}

export async function getRelatedArticles(articleId: string, categoryId: string, limit = 3) {
  const sameCategory = await db.article.findMany({
    where: { status: "published", categoryId, id: { not: articleId }, ...liveDateGuard() },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: articleCardSelect,
  });
  if (sameCategory.length >= limit) return sameCategory.map(toCardData);

  // Fill the remaining slots with the latest published pieces from any
  // category, so "Related reading" never renders a lonely half-empty grid.
  const exclude = [articleId, ...sameCategory.map((r) => r.id)];
  const filler = await db.article.findMany({
    where: { status: "published", id: { notIn: exclude }, ...liveDateGuard() },
    orderBy: [{ publishedAt: "desc" }],
    take: limit - sameCategory.length,
    select: articleCardSelect,
  });
  return [...sameCategory, ...filler].map(toCardData);
}

/**
 * Neighbours within the same article type, used for prev/next footers.
 * `reference` is the current article's publish date (falls back to updatedAt).
 */
export async function getAdjacentArticlesByType(
  type: string,
  currentId: string,
  reference: Date
): Promise<{ newer: ArticleCardData | null; older: ArticleCardData | null }> {
  const [newerRows, olderRows] = await Promise.all([
    db.article.findMany({
      where: {
        status: "published",
        type,
        id: { not: currentId },
        AND: [liveDateGuard(), { publishedAt: { gt: reference } }],
      },
      orderBy: [{ publishedAt: "asc" }],
      take: 1,
      select: articleCardSelect,
    }),
    db.article.findMany({
      where: {
        status: "published",
        type,
        id: { not: currentId },
        publishedAt: { lt: reference },
      },
      orderBy: [{ publishedAt: "desc" }],
      take: 1,
      select: articleCardSelect,
    }),
  ]);
  return {
    newer: newerRows.length > 0 ? toCardData(newerRows[0]) : null,
    older: olderRows.length > 0 ? toCardData(olderRows[0]) : null,
  };
}

/** Compact score chips for every comparison (used on /compare as teasers). */
export async function getComparisonTeasers() {
  const rows = await db.comparison.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      slug: true,
      title: true,
      article: { select: { slug: true, type: true } },
      items: { orderBy: { order: "asc" }, select: { id: true, name: true, score: true } },
    },
  });
  return rows;
}

export async function getActiveComparisonBySlug(slug: string) {
  return db.comparison.findUnique({
    where: { slug },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: { offer: { include: { merchant: true } } },
      },
    },
  });
}

export async function getHomepageStats() {
  const [articles, comparisons, categories] = await Promise.all([
    db.article.count({ where: { status: "published", ...liveDateGuard() } }),
    db.comparison.count(),
    db.category.count(),
  ]);
  return { articles, comparisons, categories };
}

export { articlePath };
