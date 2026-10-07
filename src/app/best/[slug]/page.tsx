import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleHeader } from "@/components/editorial/article-header";
import { ArticleRenderer } from "@/components/editorial/article-renderer";
import { TagChips } from "@/components/editorial/tag-chips";
import { ReadingProgress } from "@/components/editorial/reading-progress";
import { BackToTop } from "@/components/editorial/back-to-top";
import { DemoNotice, SourcesList, TldrBox } from "@/components/editorial/article-extras";
import { AdSlot } from "@/components/affiliate/ad-slot";
import { ArticleCard } from "@/components/editorial/article-card";
import { SectionHeading } from "@/components/editorial/section-heading";
import { PrevNext } from "@/components/editorial/prev-next";
import { Reveal } from "@/components/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata, itemListJsonLd } from "@/lib/seo";
import { getPublishedArticleBySlug, getRelatedArticles, getAdjacentArticlesByType } from "@/lib/queries";
import { parseBlocks } from "@/lib/content-schema";
import { getSiteSettings, isAdsEnabled } from "@/lib/settings";
import { articlePath } from "@/lib/site";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

async function getRoundup(slug: string) {
  const article = await getPublishedArticleBySlug(slug);
  if (!article || article.type !== "roundup") return null;
  return article;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getRoundup(slug);
  if (!article) return {};
  return buildMetadata({
    title: article.title,
    description: article.deck,
    path: articlePath(article.type, article.slug),
    image: article.heroImage,
    type: "article",
    noIndex: article.isDemo, // demo fiction is never indexed (Correction 6)
    publishedTime: article.publishedAt?.toISOString(),
    modifiedTime: article.updatedAt.toISOString(),
    authors: [article.author.name],
    section: article.category.name,
  });
}

export default async function RoundupPage({ params }: Params) {
  const { slug } = await params;
  const article = await getRoundup(slug);
  if (!article) notFound();

  const [related, settings, adjacent] = await Promise.all([
    getRelatedArticles(article.id, article.categoryId, 3),
    getSiteSettings(),
    getAdjacentArticlesByType(article.type, article.id, article.publishedAt ?? article.updatedAt),
  ]);
  const blocks = parseBlocks(article.blocks);
  const picks = blocks.filter((b) => b.type === "pick");

  return (
    <article>
      <ReadingProgress />
      <BackToTop />
      <JsonLd
        data={[
          articleJsonLd({
            type: article.type,
            title: article.title,
            deck: article.deck,
            slug: article.slug,
            path: articlePath(article.type, article.slug),
            image: article.heroImage,
            authorName: article.author.name,
            authorSlug: article.author.slug,
            publishedAt: article.publishedAt,
            updatedAt: article.updatedAt,
            section: article.category.name,
          }),
          breadcrumbJsonLd([
            { label: "Home", href: "/" },
            { label: "Best picks", href: "/best" },
            { label: article.title, href: articlePath(article.type, article.slug) },
          ]),
          ...(picks.length > 0
            ? [
                itemListJsonLd(
                  article.title,
                  picks
                    .filter((p) => p.type === "pick" && p.url)
                    .map((p) => ({ name: (p as { name: string }).name, url: (p as { url: string }).url }))
                ),
              ]
            : []),
        ]}
      />

      <ArticleHeader article={article} />

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 lg:px-6">
        {article.heroImage && (
          <figure className="overflow-hidden rounded-md border border-border">
            <div className="relative aspect-[16/9] bg-muted">
              <Image
                src={article.heroImage}
                alt={article.heroAlt ?? article.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 760px"
                className="object-cover"
              />
            </div>
            {article.heroCredit && (
              <figcaption className="bg-card px-4 py-2 text-xs text-muted-foreground">Image credit: {article.heroCredit}</figcaption>
            )}
          </figure>
        )}

        {article.tldr && <TldrBox text={article.tldr} />}
        {article.isDemo && <DemoNotice />}
        <AdSlot enabled={isAdsEnabled(settings)} slotId="roundup-top" />

        <ArticleRenderer blocks={blocks} articleSlug={article.slug} isDemo={article.isDemo} />

        <SourcesList sources={article.sources} />

        <TagChips tags={article.tags.map((t) => t.tag)} className="border-t border-border pt-6" />
      </div>

      {related.length > 0 && (
        <section aria-label="Related reading" className="mt-6 border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
            <SectionHeading title="Keep reading" href={`/${article.category.slug}`} linkLabel={`All ${article.category.name}`} />
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((rel) => (
                <Reveal key={rel.id}>
                  <ArticleCard article={rel} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
      <div className="mx-auto max-w-3xl px-4 pb-10 lg:px-6">
        <PrevNext type={article.type} newer={adjacent.newer} older={adjacent.older} />
      </div>
      <p className="mx-auto max-w-3xl px-4 pb-16 text-xs text-muted-foreground lg:px-6">
        Written by{" "}
        <Link href={`/authors/${article.author.slug}`} className="underline underline-offset-2 hover:text-foreground">
          {article.author.name}
        </Link>
        {article.reviewer ? `, edited by ${article.reviewer.name}` : ""}. Selections follow our{" "}
        <Link href="/methodology" className="underline underline-offset-2">methodology</Link>; rankings can&apos;t be bought.
      </p>
    </article>
  );
}
