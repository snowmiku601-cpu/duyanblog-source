import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Rss } from "lucide-react";
import { ArticleCard } from "@/components/editorial/article-card";
import { Reveal } from "@/components/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, buildMetadata, itemListJsonLd } from "@/lib/seo";
import { db } from "@/lib/db";
import { toCardData, articleCardSelect, liveDateGuard } from "@/lib/queries";
import { articlePath } from "@/lib/site";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

async function getTag(slug: string) {
  return db.tag.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);
  if (!tag) return {};
  return buildMetadata({
    title: `#${tag.name} — tagged stories`,
    description: `Every review, comparison and guide on Duyan Blog tagged “${tag.name}”.`,
    path: `/tag/${tag.slug}`,
    rss: `/feed.xml?tag=${encodeURIComponent(tag.slug)}`,
    jsonFeed: `/feed.json?tag=${encodeURIComponent(tag.slug)}`,
  });
}

export default async function TagPage({ params }: Params) {
  const { slug } = await params;
  const tag = await getTag(slug);
  if (!tag) notFound();

  const links = await db.articleTag.findMany({
    where: { tagId: tag.id, article: { status: "published", ...liveDateGuard() } },
    include: { article: { select: articleCardSelect } },
  });
  const articles = links
    .map((l) => toCardData(l.article))
    .sort((a, b) => {
      const da = (a.publishedAt ?? a.updatedAt).getTime();
      const dbTime = (b.publishedAt ?? b.updatedAt).getTime();
      return dbTime - da;
    });

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { label: "Home", href: "/" },
            { label: `#${tag.name}`, href: `/tag/${tag.slug}` },
          ]),
          ...(articles.length > 0
            ? [
                itemListJsonLd(
                  `Stories tagged ${tag.name}`,
                  articles.map((a) => ({ name: a.title, url: articlePath(a.type, a.slug) }))
                ),
              ]
            : []),
        ]}
      />

      <header className="relative overflow-hidden border-b border-border bg-muted/30">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-border" aria-hidden="true">
          <div className="absolute inset-8 rounded-full bg-sun/20" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
          <p className="eyebrow text-vermilion">Tagged</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="text-vermilion" aria-hidden="true">#</span>
            {tag.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {articles.length === 0
              ? "Nothing published under this tag yet."
              : `${articles.length} piece${articles.length === 1 ? "" : "s"} — reviews, comparisons and guides filed under this topic.`}
          </p>
          {articles.length > 0 && (
            <a
              href={`/feed.xml?tag=${encodeURIComponent(tag.slug)}`}
              className="group mt-6 inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-vermilion/50 hover:text-foreground"
              aria-label={`Subscribe to the #${tag.name} RSS feed`}
            >
              <Rss className="h-3.5 w-3.5 text-vermilion" aria-hidden="true" />
              Follow this tag
              <span className="sr-only"> via RSS</span>
            </a>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        {articles.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-8 text-sm text-muted-foreground">
            This tag is waiting for its first story. Try the{" "}
            <Link href="/reviews" className="underline underline-offset-2 hover:text-foreground">
              latest reviews
            </Link>{" "}
            instead.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, i) => (
              <Reveal key={article.id}>
                <ArticleCard article={article} priority={i < 3} />
              </Reveal>
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            Looking for something else?{" "}
            <Link href="/search" className="underline underline-offset-2 hover:text-foreground">
              Search the site
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="underline underline-offset-2 hover:text-foreground">
              suggest what we should cover next
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
