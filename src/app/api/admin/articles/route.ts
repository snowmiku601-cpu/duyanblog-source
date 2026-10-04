import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, parseBody, prismaErrorMessage } from "@/lib/admin-api";
import {
  articlePayloadSchema,
  validateBlocks,
  resolveTagIds,
  revalidateArticleBy,
  estimateReadingMinutes,
} from "@/lib/admin-articles";

export async function POST(request: Request) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;

  const parsed = await parseBody(request, articlePayloadSchema);
  if (parsed.response) return parsed.response;
  const data = parsed.data;

  const blocks = validateBlocks(data.blocks);
  if ("error" in blocks) return NextResponse.json({ error: blocks.error }, { status: 400 });

  try {
    const [category, author] = await Promise.all([
      db.category.findUnique({ where: { id: data.categoryId } }),
      db.author.findUnique({ where: { id: data.authorId } }),
    ]);
    if (!category) return NextResponse.json({ error: "Category not found — create it first." }, { status: 400 });
    if (!author) return NextResponse.json({ error: "Author not found — create one first." }, { status: 400 });

    const tagIds = await resolveTagIds(data.tags);
    const publishedAt = data.publishedAt ?? (data.status === "published" ? new Date() : null);

    const created = await db.$transaction(async (tx) => {
      const article = await tx.article.create({
        data: {
          title: data.title,
          slug: data.slug,
          type: data.type,
          status: data.status,
          deck: data.deck,
          tldr: data.tldr,
          heroImage: data.heroImage,
          heroAlt: data.heroAlt,
          heroCredit: data.heroCredit,
          categoryId: data.categoryId,
          authorId: data.authorId,
          reviewerId: data.reviewerId,
          readingMinutes:
            data.readingMinutes && data.readingMinutes > 0
              ? data.readingMinutes
              : estimateReadingMinutes(data.blocks),
          featured: data.featured,
          publishedAt,
          lastReviewedAt: data.lastReviewedAt,
          blocks: blocks.json,
        },
      });
      if (tagIds.length > 0) {
        await tx.articleTag.createMany({
          data: tagIds.map((tagId) => ({ articleId: article.id, tagId })),
        });
      }
      if (data.scores.length > 0) {
        await tx.reviewScore.createMany({
          data: data.scores.map((s, i) => ({ ...s, articleId: article.id, order: i })),
        });
      }
      if (data.sources.length > 0) {
        await tx.sourceCitation.createMany({
          data: data.sources.map((s, i) => ({ ...s, articleId: article.id, order: i })),
        });
      }
      await tx.articleRevision.create({
        data: { articleId: article.id, title: data.title, blocks: blocks.json, note: "Created via admin" },
      });
      return article;
    });

    await revalidateArticleBy(created.categoryId, created.slug, created.type);
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    console.error("article create failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not save the article.") }, { status: 400 });
  }
}
