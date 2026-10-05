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
import { TableOfContents } from "@/components/editorial/toc";
import { ScoreDial, ScoreBreakdown } from "@/components/editorial/score-dial";
import { MerchantOffer } from "@/components/affiliate/merchant-offer";
import { AffiliateDisclosure } from "@/components/affiliate/affiliate-link";
import { AdSlot } from "@/components/affiliate/ad-slot";
import { ArticleCard } from "@/components/editorial/article-card";
import { SectionHeading } from "@/components/editorial/section-heading";
import { PrevNext } from "@/components/editorial/prev-next";
import { Reveal } from "@/components/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getPublishedArticleBySlug, getRelatedArticles, getAdjacentArticlesByType } from "@/lib/queries";
import { offerToView } from "@/lib/offers";
import { parseBlocks } from "@/lib/content-schema";
import { getSiteSettings, isAdsEnabled } from "@/lib/settings";
import { articlePath } from "@/lib/site";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

async function getReview(slug: string) {
  const article = await getPublishedArticleBySlug(slug);
  if (!article || article.type !== "review") return null;
  return article;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getReview(slug);
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

export default async function ReviewPage({ params }: Params) {
  const { slug } = await params;
  const article = await getReview(slug);
  if (!article) notFound();

  const [related, settings, adjacent] = await Promise.all([
    getRelatedArticles(article.id, article.categoryId, 3),
    getSiteSettings(),
    getAdjacentArticlesByType(article.type, article.id, article.publishedAt ?? article.updatedAt),
  ]);
  const blocks = parseBlocks(article.blocks);
  const weighted =
    article.scores.length > 0
      ? article.scores.reduce((acc, s) => acc + s.score * s.weight, 0) /
        article.scores.reduce((acc, s) => acc + s.weight, 0)
      : null;

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
            { label: "Reviews", href: "/reviews" },
            { label: article.title, href: articlePath(article.type, article.slug) },
          ]),
        ]}
      />

      <ArticleHeader article={article} />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-12 lg:px-6">
        <div className="space-y-8 lg:col-span-8">
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
                <figcaption className="bg-card px-4 py-2 text-xs text-muted-foreground">Illustration: {article.heroCredit}</figcaption>
              )}
            </figure>
          )}

          {article.tldr && <TldrBox text={article.tldr} />}
          <AffiliateDisclosure variant="box" />
          {article.isDemo && <DemoNotice />}
          <AdSlot enabled={isAdsEnabled(settings)} slotId="review-top" />

          <ArticleRenderer blocks={blocks} articleSlug={article.slug} />

          <SourcesList sources={article.sources} />

          <TagChips tags={article.tags.map((t) => t.tag)} className="border-t border-border pt-6" />
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-28 space-y-6">
            <TableOfContents blocks={blocks} />

            {weighted != null && article.scores.length > 0 && (
              <section aria-label="Score breakdown" className="rounded-md border border-border bg-card p-5">
                <p className="eyebrow text-muted-foreground">Our score</p>
                <div className="mt-4 flex items-center gap-5">
                  <ScoreDial score={weighted} size={104} />
                  <div className="min-w-0 text-xs leading-relaxed text-muted-foreground">
                    Weighted across {article.scores.length} criteria, scored against our{" "}
                    <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
                      published methodology
                    </Link>
                    . Scores are editorial, never paid placements.
                  </div>
                </div>
                <hr className="my-4 border-border" />
                <ScoreBreakdown scores={article.scores} />
              </section>
            )}

            {article.offers.length > 0 && (
              <section aria-label="Where to buy" className="space-y-3">
                <p className="eyebrow text-muted-foreground">Where to buy</p>
                {article.offers.map((offer) => (
                  <MerchantOffer key={offer.id} offer={offerToView(offer)} articleSlug={article.slug} compact />
                ))}
              </section>
            )}
          </div>
        </aside>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-10 lg:px-6">
        <PrevNext type={article.type} newer={adjacent.newer} older={adjacent.older} />
      </div>

      {related.length > 0 && (
        <section aria-label="Related reading" className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
            <SectionHeading title="Related reading" href={`/${article.category.slug}`} linkLabel={`All ${article.category.name}`} />
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
    </article>
  );
}
