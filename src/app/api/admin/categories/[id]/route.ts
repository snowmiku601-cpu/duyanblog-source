import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardAdmin, parseBody, prismaErrorMessage, slugField, optionalTextField } from "@/lib/admin-api";
import { revalidateEverything } from "@/lib/admin-revalidate";

const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: slugField,
  tagline: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(1_000),
  heroImage: optionalTextField(500),
  accent: z.enum(["amber", "ochre", "vermilion"]).default("amber"),
  order: z.number().int().min(-999).max(999).default(0),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  const parsed = await parseBody(request, categorySchema);
  if (parsed.response) return parsed.response;

  try {
    await db.category.update({ where: { id }, data: parsed.data });
    revalidateEverything();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("category update failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not update the category.") }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  try {
    const count = await db.article.count({ where: { categoryId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${count} article${count === 1 ? "" : "s"} reference${count === 1 ? "s" : ""} this category.` },
        { status: 409 }
      );
    }
    await db.category.delete({ where: { id } });
    revalidateEverything();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("category delete failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Cannot delete this category.") }, { status: 400 });
  }
}
