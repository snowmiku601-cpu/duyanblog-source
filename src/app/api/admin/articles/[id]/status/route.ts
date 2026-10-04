import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardAdmin, parseBody, prismaErrorMessage } from "@/lib/admin-api";
import { revalidateArticleBy } from "@/lib/admin-articles";

const bodySchema = z.object({ status: z.enum(["draft", "published"]) });

/** Quick publish / unpublish from the articles table. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  const parsed = await parseBody(request, bodySchema);
  if (parsed.response) return parsed.response;
  const { status } = parsed.data;

  try {
    const existing = await db.article.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Article not found." }, { status: 404 });

    const publishedAt =
      status === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt;

    await db.article.update({ where: { id }, data: { status, publishedAt } });
    await revalidateArticleBy(existing.categoryId, existing.slug, existing.type);
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error("article status change failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not change the status.") }, { status: 400 });
  }
}
