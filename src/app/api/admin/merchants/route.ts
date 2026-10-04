import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardAdmin, parseBody, prismaErrorMessage, slugField, optionalTextField } from "@/lib/admin-api";
import { revalidateEverything } from "@/lib/admin-revalidate";

const merchantSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: slugField,
  website: z
    .union([z.string().trim().url().startsWith("https://"), z.null()])
    .optional()
    .transform((v) => v ?? null),
  note: optionalTextField(300),
});

export async function POST(request: Request) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;

  const parsed = await parseBody(request, merchantSchema);
  if (parsed.response) return parsed.response;

  try {
    const row = await db.merchant.create({ data: parsed.data });
    revalidateEverything();
    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    console.error("merchant create failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not create the merchant.") }, { status: 400 });
  }
}
