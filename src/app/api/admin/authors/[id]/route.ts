import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardAdmin, parseBody, prismaErrorMessage, slugField, optionalTextField } from "@/lib/admin-api";
import { revalidateEverything } from "@/lib/admin-revalidate";

const authorSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: slugField,
  role: z.string().trim().min(1).max(120),
  bio: z.string().trim().min(1).max(2_000),
  avatarUrl: optionalTextField(500),
  focusAreas: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  const parsed = await parseBody(request, authorSchema);
  if (parsed.response) return parsed.response;

  try {
    await db.author.update({
      where: { id },
      data: { ...parsed.data, focusAreas: JSON.stringify(parsed.data.focusAreas) },
    });
    revalidateEverything();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("author update failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not update the author.") }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  try {
    const authored = await db.article.count({ where: { authorId: id } });
    const reviewed = await db.article.count({ where: { reviewerId: id } });
    if (authored > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${authored} article${authored === 1 ? "" : "s"} reference${authored === 1 ? "s" : ""} this author.` },
        { status: 409 }
      );
    }
    await db.author.delete({ where: { id } });
    if (reviewed > 0) revalidateEverything(); // reviewerId was set to NULL on those articles
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("author delete failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Cannot delete this author.") }, { status: 400 });
  }
}
