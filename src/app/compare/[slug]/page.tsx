import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleHeader } from "@/components/editorial/article-header";
import { ArticleRenderer } from "@/components/editorial/article-renderer";
import { TagChips } from "@/components/editorial/tag-chips";
import { ReadingProgress } from "@/components/editorial/reading-progress";
import { BackToTop } from "@/components/editorial/back-to-top";
import { DemoNotice, TldrBox } from "@/components/editorial/article-extras";
import { ComparisonTable } from "@/components/comparison-table";
import { AffiliateDisclosure } from "@/components/affiliate/affiliate-link";
import { JsonLd } from "@/components/seo/json-ld";
import { PrevNext } from "@/components/editorial/prev-next";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getPublishedArticleBySlug, getAdjacentArticlesByType } from "@/lib/queries";
import { parseBlocks } from "@/lib/content-schema";
import { parseAttributes, parseStringList, comparisonItemViewSchema, type ComparisonItemView } from "@/lib/comparison";
import { articlePath } from "@/lib/site";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

async function getVersus(slug: string) {
  const article = await getPublishedArticleBySlug(slug);
  if (!article || article.type !== "versus") return null;
  return article;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getVersus(slug);
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

function mapItems(items: {
  id: string;
  name: string;
  url: string | null;
  imageUrl: string | null;
  score: number | null;
  summary: string | null;
  attributes: string;
  pros: string;
  cons: string;
  offer: { id: string; label: string; price: string | null; badge: string | null; merchant: { name: string } } | null;
}[]): ComparisonItemView[] {
  return items
    .map((item) => {
      const parsed = comparisonItemViewSchema.safeParse({
        id: item.id,
        name: item.name,
        url: item.url,
        imageUrl: item.imageUrl,
        score: item.score,
        summary: item.summary,
        attributes: parseAttributes(item.attributes),
        pros: parseStringList(item.pros),
        cons: parseStringList(item.cons),
        offer: item.offer
          ? {
              id: item.offer.id,
              label: item.offer.label,
              price: item.offer.price,
              badge: item.offer.badge,
              merchantName: item.offer.merchant.name,
            }
          : null,
      });
      return parsed.success ? parsed.data : null;
    })
    .filter((x): x is ComparisonItemView => x !== null);
}

export default async function VersusPage({ params }: Params) {
  const { slug } = await params;
  const article = await getVersus(slug);
  if (!article) notFound();

  const blocks = parseBlocks(article.blocks);
  const adjacent = await getAdjacentArticlesByType(
    article.type,
    article.id,
    article.publishedAt ?? article.updatedAt
  );
  const comparisonItems = article.comparison ? mapItems(article.comparison.items) : [];

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
            { label: "Compare", href: "/compare" },
            { label: article.title, href: articlePath(article.type, article.slug) },
          ]),
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
                sizes="(max-width: 1024px) 100vw, 900px"
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
      </div>

      {comparisonItems.length >= 2 && (
        <div className="mx-auto max-w-5xl px-4 pb-4 lg:px-6">
          <h2 className="mb-4 font-display text-2xl font-semibold">Side by side</h2>
          <ComparisonTable items={comparisonItems} articleSlug={article.slug} caption={article.comparison?.title ?? article.title} isDemo={article.isDemo} />
          <AffiliateDisclosure className="mt-3" />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
        <ArticleRenderer blocks={blocks} articleSlug={article.slug} isDemo={article.isDemo} />

        <TagChips tags={article.tags.map((t) => t.tag)} className="mt-10 border-t border-border pt-6" />

        <p className="mt-6 border-t border-border pt-6 text-xs text-muted-foreground">
          Written by{" "}
          <Link href={`/authors/${article.author.slug}`} className="underline underline-offset-2 hover:text-foreground">
            {article.author.name}
          </Link>
          . Comparison data is maintained by the editors and updated when merchants change their terms.
        </p>

        <div className="mt-10">
          <PrevNext type={article.type} newer={adjacent.newer} older={adjacent.older} />
        </div>
      </div>
    </article>
  );
}
