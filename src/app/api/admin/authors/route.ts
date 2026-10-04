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

export async function POST(request: Request) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;

  const parsed = await parseBody(request, authorSchema);
  if (parsed.response) return parsed.response;

  try {
    const row = await db.author.create({
      data: { ...parsed.data, focusAreas: JSON.stringify(parsed.data.focusAreas) },
    });
    revalidateEverything();
    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    console.error("author create failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not create the author.") }, { status: 400 });
  }
}
