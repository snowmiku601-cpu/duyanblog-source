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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  const parsed = await parseBody(request, articlePayloadSchema);
  if (parsed.response) return parsed.response;
  const data = parsed.data;

  const blocks = validateBlocks(data.blocks);
  if ("error" in blocks) return NextResponse.json({ error: blocks.error }, { status: 400 });

  try {
    const existing = await db.article.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Article not found." }, { status: 404 });

    const tagIds = await resolveTagIds(data.tags);

    await db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
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
          publishedAt: data.publishedAt,
          lastReviewedAt: data.lastReviewedAt,
          blocks: blocks.json,
        },
      });
      // Replace tag / score / source rows wholesale.
      await tx.articleTag.deleteMany({ where: { articleId: id } });
      if (tagIds.length > 0) {
        await tx.articleTag.createMany({ data: tagIds.map((tagId) => ({ articleId: id, tagId })) });
      }
      await tx.reviewScore.deleteMany({ where: { articleId: id } });
      if (data.scores.length > 0) {
        await tx.reviewScore.createMany({
          data: data.scores.map((s, i) => ({ ...s, articleId: id, order: i })),
        });
      }
      await tx.sourceCitation.deleteMany({ where: { articleId: id } });
      if (data.sources.length > 0) {
        await tx.sourceCitation.createMany({
          data: data.sources.map((s, i) => ({ ...s, articleId: id, order: i })),
        });
      }
      await tx.articleRevision.create({
        data: { articleId: id, title: data.title, blocks: blocks.json, note: "Edited via admin" },
      });
    });

    await revalidateArticleBy(data.categoryId, data.slug, data.type);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("article update failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not save the article.") }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  try {
    const existing = await db.article.findUnique({
      where: { id },
      select: { slug: true, type: true, categoryId: true },
    });
    if (!existing) return NextResponse.json({ error: "Article not found." }, { status: 404 });

    // Cascades clean up revisions, scores, sources, tags, offers and their clicks.
    // Comparison.articleId is SetNull — the comparison itself survives standalone.
    await db.article.delete({ where: { id } });

    await revalidateArticleBy(existing.categoryId, existing.slug, existing.type);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("article delete failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not delete the article.") }, { status: 400 });
  }
}
