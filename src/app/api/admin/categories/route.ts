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

export async function POST(request: Request) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;

  const parsed = await parseBody(request, categorySchema);
  if (parsed.response) return parsed.response;

  try {
    const row = await db.category.create({ data: parsed.data });
    revalidateEverything();
    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    console.error("category create failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not create the category.") }, { status: 400 });
  }
}
