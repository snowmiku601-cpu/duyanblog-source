import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { toLocalInput } from "@/lib/admin-client";
import { parseBlocks } from "@/lib/content-schema";
import { listPublicImages } from "@/lib/media";
import { ArticleForm, type ArticleFormState } from "../article-form";
import { RevisionsSection } from "./revisions-section";

export const metadata = { title: "Edit article — Admin" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;

  const [article, categories, authors, offers, media] = await Promise.all([
    db.article.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        scores: { orderBy: { order: "asc" } },
        sources: { orderBy: { order: "asc" } },
      },
    }),
    db.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.author.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.affiliateOffer.findMany({
      orderBy: [{ order: "asc" }, { label: "asc" }],
      select: { id: true, label: true },
      take: 50,
    }),
    listPublicImages(),
  ]);

  if (!article) notFound();

  const initial: ArticleFormState = {
    id: article.id,
    title: article.title,
    slug: article.slug,
    type: article.type,
    status: article.status,
    deck: article.deck,
    tldr: article.tldr ?? "",
    heroImage: article.heroImage ?? "",
    heroAlt: article.heroAlt ?? "",
    heroCredit: article.heroCredit ?? "",
    categoryId: article.categoryId,
    authorId: article.authorId,
    reviewerId: article.reviewerId ?? "",
    readingMinutes: article.readingMinutes == null ? "" : String(article.readingMinutes),
    featured: article.featured,
    publishedAt: toLocalInput(article.publishedAt),
    lastReviewedAt: toLocalInput(article.lastReviewedAt),
    tags: article.tags.map((t) => t.tag.name).join(", "),
    // Pretty-print stored JSON so the textareas are human-editable.
    blocks: JSON.stringify(parseBlocks(article.blocks), null, 2),
    scores: JSON.stringify(
      article.scores.map((s) => ({ label: s.label, score: s.score, weight: s.weight, ...(s.note ? { note: s.note } : {}) })),
      null,
      2
    ),
    sources: JSON.stringify(
      article.sources.map((s) => ({ label: s.label, ...(s.url ? { url: s.url } : {}) })),
      null,
      2
    ),
  };

  return (
    <>
      <ArticleForm
        article={initial}
        options={{
          categories,
          authors,
          offers: offers.map((o) => ({ id: o.id, label: o.label })),
          media,
        }}
      />
      <RevisionsSection
        articleId={article.id}
        current={{ title: article.title, blocks: parseBlocks(article.blocks) }}
      />
    </>
  );
}
