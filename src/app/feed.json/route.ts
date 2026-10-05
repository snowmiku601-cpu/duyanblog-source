import { db } from "@/lib/db";
import { demoExcludedWhere, liveDateGuard } from "@/lib/queries";
import { articlePath, site } from "@/lib/site";

export const revalidate = 900;

/**
 * JSON Feed 1.1 at /feed.json — the same published stream RSS serves at
 * /feed.xml, for readers and apps that prefer JSON. Scopes mirror RSS:
 *  - site-wide:   /feed.json
 *  - per-section: /feed.json?category=<slug>
 *  - per-tag:     /feed.json?tag=<slug>
 * Unknown slugs 404; both scopes at once is a 400. Spec:
 * https://jsonfeed.org/version/1.1
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category")?.trim() || null;
  const tagSlug = searchParams.get("tag")?.trim() || null;

  if (categorySlug && tagSlug) {
    return Response.json({ error: "Pass either ?category= or ?tag= — not both." }, { status: 400 });
  }

  const [category, tag] = await Promise.all([
    categorySlug
      ? db.category.findUnique({
          where: { slug: categorySlug },
          select: { id: true, name: true, slug: true, tagline: true, description: true },
        })
      : Promise.resolve(null),
    tagSlug
      ? db.tag.findUnique({ where: { slug: tagSlug }, select: { id: true, name: true, slug: true } })
      : Promise.resolve(null),
  ]);

  if ((categorySlug && !category) || (tagSlug && !tag)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const articles = await db.article.findMany({
    where: {
      status: "published",
      ...liveDateGuard(),
      ...demoExcludedWhere,
      ...(category ? { categoryId: category.id } : {}),
      ...(tag ? { tags: { some: { tagId: tag.id } } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: {
      slug: true,
      type: true,
      title: true,
      deck: true,
      publishedAt: true,
      updatedAt: true,
      author: { select: { name: true } },
      category: { select: { slug: true, name: true } },
    },
  });

  const selfUrl = tag
    ? `${site.url}/feed.json?tag=${encodeURIComponent(tag.slug)}`
    : category
      ? `${site.url}/feed.json?category=${encodeURIComponent(category.slug)}`
      : `${site.url}/feed.json`;
  const channelLink = tag ? `${site.url}/tag/${tag.slug}` : category ? `${site.url}/${category.slug}` : site.url;
  const channelTitle = tag
    ? `${site.name} — #${tag.name}`
    : category
      ? `${site.name} — ${category.name}`
      : site.name;
  const channelDescription = tag
    ? `Every review, comparison and guide tagged “${tag.name}” on ${site.name}.`
    : category
      ? category.tagline || category.description || site.description
      : site.description;

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: channelTitle,
    home_page_url: channelLink,
    feed_url: selfUrl,
    description: channelDescription,
    language: "en",
    authors: [{ name: site.name, url: `${site.url}/about` }],
    items: articles.map((a) => {
      const url = `${site.url}${articlePath(a.type, a.slug)}`;
      return {
        id: url,
        url,
        title: a.title,
        content_text: a.deck,
        summary: a.deck,
        date_published: (a.publishedAt ?? a.updatedAt).toISOString(),
        date_modified: a.updatedAt.toISOString(),
        authors: [{ name: a.author.name }],
        tags: tag ? [a.category.name, `#${tag.name}`] : [a.category.name],
      };
    }),
  };

  return Response.json(feed, {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, max-age=900, stale-while-revalidate=1800",
    },
  });
}
