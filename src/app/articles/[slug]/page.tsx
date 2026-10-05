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
import { JsonLd } from "@/components/seo/json-ld";
import { PrevNext } from "@/components/editorial/prev-next";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getPublishedArticleBySlug, getAdjacentArticlesByType } from "@/lib/queries";
import { parseBlocks } from "@/lib/content-schema";
import { articlePath } from "@/lib/site";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

async function getEditorial(slug: string) {
  const article = await getPublishedArticleBySlug(slug);
  if (!article || article.type !== "editorial") return null;
  return article;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getEditorial(slug);
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

export default async function EditorialPage({ params }: Params) {
  const { slug } = await params;
  const article = await getEditorial(slug);
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
            { label: "Editorial", href: "/articles" },
            { label: article.title, href: articlePath(article.type, article.slug) },
          ]),
        ]}
      />

      <ArticleHeader article={article} />

      {article.isDemo && <DemoNotice />}

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
              <figcaption className="bg-card px-4 py-2 text-xs text-muted-foreground">Illustration: {article.heroCredit}</figcaption>
            )}
          </figure>
        )}

        <ArticleRenderer blocks={blocks} articleSlug={article.slug} dropCap />

        <TagChips tags={article.tags.map((t) => t.tag)} className="border-t border-border pt-6" />

        <p className="mt-6 border-t border-border pt-6 text-xs text-muted-foreground">
          <Link href={`/authors/${article.author.slug}`} className="underline underline-offset-2 hover:text-foreground">
            {article.author.name}
          </Link>{" "}
          writes for {`Duyan Blog`}. Editorials are opinion, clearly separated from reviews and never paid for.
        </p>

        <PrevNext type={article.type} newer={adjacent.newer} older={adjacent.older} />
      </div>
    </article>
  );
}
