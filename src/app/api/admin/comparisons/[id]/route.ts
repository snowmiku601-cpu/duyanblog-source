import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, parseBody, prismaErrorMessage } from "@/lib/admin-api";
import { comparisonSchema, replaceItems, revalidateComparison } from "@/lib/admin-comparisons";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  const parsed = await parseBody(request, comparisonSchema);
  if (parsed.response) return parsed.response;
  const data = parsed.data;

  try {
    const existing = await db.comparison.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Comparison not found." }, { status: 404 });

    if (data.articleId) {
      const article = await db.article.findUnique({ where: { id: data.articleId } });
      if (!article) return NextResponse.json({ error: "Linked article not found." }, { status: 400 });
    }

    await db.comparison.update({
      where: { id },
      data: { title: data.title, slug: data.slug, intro: data.intro, articleId: data.articleId },
    });
    await replaceItems(id, data.items);
    await revalidateComparison(data.articleId, data.slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("comparison update failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not save the comparison.") }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  try {
    const existing = await db.comparison.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Comparison not found." }, { status: 404 });

    await db.comparison.delete({ where: { id } }); // items cascade
    await revalidateComparison(existing.articleId, existing.slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("comparison delete failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Cannot delete this comparison.") }, { status: 400 });
  }
}
