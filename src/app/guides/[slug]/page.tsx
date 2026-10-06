import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleHeader } from "@/components/editorial/article-header";
import { ArticleRenderer } from "@/components/editorial/article-renderer";
import { TagChips } from "@/components/editorial/tag-chips";
import { ReadingProgress } from "@/components/editorial/reading-progress";
import { BackToTop } from "@/components/editorial/back-to-top";
import { DemoNotice } from "@/components/editorial/article-extras";
import { TableOfContents } from "@/components/editorial/toc";
import { PrevNext } from "@/components/editorial/prev-next";
import { JsonLd } from "@/components/seo/json-ld";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getPublishedArticleBySlug, getAdjacentArticlesByType } from "@/lib/queries";
import { parseBlocks } from "@/lib/content-schema";
import { articlePath } from "@/lib/site";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

async function getGuide(slug: string) {
  const article = await getPublishedArticleBySlug(slug);
  if (!article || article.type !== "guide") return null;
  return article;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getGuide(slug);
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

export default async function GuidePage({ params }: Params) {
  const { slug } = await params;
  const article = await getGuide(slug);
  if (!article) notFound();

  const blocks = parseBlocks(article.blocks);
  const adjacent = await getAdjacentArticlesByType(
    article.type,
    article.id,
    article.publishedAt ?? article.updatedAt
  );

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
            { label: "Guides", href: "/guides" },
            { label: article.title, href: articlePath(article.type, article.slug) },
          ]),
        ]}
      />

      <ArticleHeader article={article} />

      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-12">
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

            {article.isDemo && <DemoNotice />}
            <ArticleRenderer blocks={blocks} articleSlug={article.slug} isDemo={article.isDemo} dropCap />

            <TagChips tags={article.tags.map((t) => t.tag)} className="border-t border-border pt-6" />

            <p className="border-t border-border pt-6 text-xs text-muted-foreground">
              Written by{" "}
              <Link href={`/authors/${article.author.slug}`} className="underline underline-offset-2 hover:text-foreground">
                {article.author.name}
              </Link>
              . Guides are living documents — material changes are listed at the top and our{" "}
              <Link href="/corrections-policy" className="underline underline-offset-2">corrections policy</Link> applies.
            </p>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-28">
              <TableOfContents blocks={blocks} />
            </div>
          </aside>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-12 lg:px-6">
        <PrevNext type={article.type} newer={adjacent.newer} older={adjacent.older} />
      </div>
    </article>
  );
}
