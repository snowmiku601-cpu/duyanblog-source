import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/admin-api";

/** GET /api/admin/articles/[id]/revisions — list snapshots (no block payloads). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  try {
    const article = await db.article.findUnique({ where: { id }, select: { id: true } });
    if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });

    const revisions = await db.articleRevision.findMany({
      where: { articleId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, title: true, note: true, createdAt: true, blocks: true },
    });

    return NextResponse.json({
      revisions: revisions.map((r) => ({
        id: r.id,
        title: r.title,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
        bytes: r.blocks.length,
        blockCount: countBlocks(r.blocks),
      })),
    });
  } catch (err) {
    console.error("revision list failed", err);
    return NextResponse.json({ error: "Could not load revisions." }, { status: 500 });
  }
}

function countBlocks(json: string): number {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
