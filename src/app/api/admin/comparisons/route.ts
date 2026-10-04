import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, parseBody, prismaErrorMessage } from "@/lib/admin-api";
import { comparisonSchema, replaceItems, revalidateComparison } from "@/lib/admin-comparisons";

export async function POST(request: Request) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;

  const parsed = await parseBody(request, comparisonSchema);
  if (parsed.response) return parsed.response;
  const data = parsed.data;

  try {
    if (data.articleId) {
      const article = await db.article.findUnique({ where: { id: data.articleId } });
      if (!article) return NextResponse.json({ error: "Linked article not found." }, { status: 400 });
    }

    const created = await db.comparison.create({
      data: { title: data.title, slug: data.slug, intro: data.intro, articleId: data.articleId },
    });
    await replaceItems(created.id, data.items);
    await revalidateComparison(data.articleId, created.slug);
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    console.error("comparison create failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not create the comparison.") }, { status: 400 });
  }
}
