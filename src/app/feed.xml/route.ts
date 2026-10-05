import { db } from "@/lib/db";
import { demoExcludedWhere, liveDateGuard } from "@/lib/queries";
import { articlePath, site } from "@/lib/site";

export const revalidate = 900;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * RSS at /feed.xml with three scopes:
 *  - site-wide:            /feed.xml
 *  - per-section:          /feed.xml?category=<slug>
 *  - per-tag:              /feed.xml?tag=<slug>
 * Unknown slugs return 404 so feed readers stop polling; passing both
 * category and tag is rejected — one scope per feed.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category")?.trim() || null;
  const tagSlug = searchParams.get("tag")?.trim() || null;

  if (categorySlug && tagSlug) {
    return new Response("Pass either ?category= or ?tag= — not both.", { status: 400 });
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
    return new Response("Not found", { status: 404 });
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
    ? `${site.url}/feed.xml?tag=${encodeURIComponent(tag.slug)}`
    : category
      ? `${site.url}/feed.xml?category=${encodeURIComponent(category.slug)}`
      : `${site.url}/feed.xml`;
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

  const items = articles
    .map((a) => {
      const url = `${site.url}${articlePath(a.type, a.slug)}`;
      const pub = (a.publishedAt ?? a.updatedAt).toUTCString();
      const categories = tag
        ? `<category>${escapeXml(a.category.name)}</category>\n      <category>${escapeXml(`#${tag.name}`)}</category>`
        : `<category>${escapeXml(a.category.name)}</category>`;
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(a.deck)}</description>
      ${categories}
      <dc:creator>${escapeXml(a.author.name)}</dc:creator>
      <pubDate>${pub}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${channelLink}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, stale-while-revalidate=1800",
    },
  });
}
