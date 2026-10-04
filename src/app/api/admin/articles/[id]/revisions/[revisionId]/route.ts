import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, prismaErrorMessage } from "@/lib/admin-api";
import { parseBlocks } from "@/lib/content-schema";

/** GET /api/admin/articles/[id]/revisions/[revisionId] — one snapshot with parsed blocks. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id, revisionId } = await params;

  try {
    const revision = await db.articleRevision.findFirst({
      where: { id: revisionId, articleId: id },
      select: { id: true, title: true, note: true, createdAt: true, blocks: true },
    });
    if (!revision) return NextResponse.json({ error: "Revision not found." }, { status: 404 });

    const parsed = parseBlocks(revision.blocks);
    return NextResponse.json({
      revision: {
        id: revision.id,
        title: revision.title,
        note: revision.note,
        createdAt: revision.createdAt.toISOString(),
        blocks: parsed,
      },
    });
  } catch (err) {
    console.error("revision fetch failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not load the revision.") }, { status: 400 });
  }
}
