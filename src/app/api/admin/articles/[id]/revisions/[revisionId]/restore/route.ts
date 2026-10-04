import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, prismaErrorMessage } from "@/lib/admin-api";
import { revalidateArticleBy } from "@/lib/admin-articles";
import { parseBlocks } from "@/lib/content-schema";

/**
 * POST /api/admin/articles/[id]/revisions/[revisionId]/restore
 * Restores title + blocks from a snapshot. The article's current content is
 * snapshotted first (note: "Auto-backup before restore"), so a restore is
 * itself reversible.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id, revisionId } = await params;

  try {
    const revision = await db.articleRevision.findFirst({
      where: { id: revisionId, articleId: id },
      select: { id: true, title: true, blocks: true, createdAt: true },
    });
    if (!revision) return NextResponse.json({ error: "Revision not found." }, { status: 404 });

    // Never trust stored history — validate against the current block grammar.
    let validated: string;
    try {
      validated = JSON.stringify(parseBlocks(revision.blocks));
    } catch {
      return NextResponse.json(
        { error: "This revision predates the current content format and cannot be restored." },
        { status: 409 }
      );
    }

    const article = await db.article.findUnique({
      where: { id },
      select: { slug: true, type: true, categoryId: true },
    });
    if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });

    await db.$transaction(async (tx) => {
      const current = await tx.article.findUnique({ where: { id }, select: { title: true, blocks: true } });
      if (current) {
        await tx.articleRevision.create({
          data: { articleId: id, title: current.title, blocks: current.blocks, note: "Auto-backup before restore" },
        });
      }
      await tx.article.update({ where: { id }, data: { title: revision.title, blocks: validated } });
    });

    await revalidateArticleBy(article.categoryId, article.slug, article.type);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("revision restore failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not restore the revision.") }, { status: 400 });
  }
}
