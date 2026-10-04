import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardAdmin, parseBody, prismaErrorMessage } from "@/lib/admin-api";
import { analyzeChain } from "@/lib/redirect-chain";

const redirectSchema = z.object({
  from: z.string().trim().min(2).max(300).startsWith("/", "From must start with /"),
  to: z
    .string()
    .trim()
    .min(2)
    .max(1_000)
    .refine((v) => v.startsWith("/") || v.startsWith("https://"), "To must start with / or https://"),
  statusCode: z.union([z.literal(301), z.literal(302)]),
  active: z.boolean().default(true),
});

export async function POST(request: Request) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;

  const parsed = await parseBody(request, redirectSchema);
  if (parsed.response) return parsed.response;

  try {
    // Server-side chain enforcement (mirrors the client validator — the
    // runtime proxy serves active rows only, so inactive ones are not hops).
    const existing = await db.redirect.findMany({
      where: { active: true },
      select: { id: true, from: true, to: true },
    });
    const verdict = analyzeChain(existing, { from: parsed.data.from, to: parsed.data.to });
    if (verdict.blocked) {
      return NextResponse.json({ error: verdict.blocked }, { status: 400 });
    }

    const row = await db.redirect.create({ data: parsed.data });
    return NextResponse.json({ ok: true, id: row.id, warning: verdict.warning });
  } catch (err) {
    console.error("redirect create failed", err);
    return NextResponse.json(
      { error: prismaErrorMessage(err, "Could not add the redirect — is that source path already mapped?") },
      { status: 400 }
    );
  }
}
