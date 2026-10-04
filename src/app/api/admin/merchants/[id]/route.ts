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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  const parsed = await parseBody(request, merchantSchema);
  if (parsed.response) return parsed.response;

  try {
    await db.merchant.update({ where: { id }, data: parsed.data });
    revalidateEverything();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("merchant update failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not update the merchant.") }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  try {
    const count = await db.affiliateOffer.count({ where: { merchantId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${count} offer${count === 1 ? "" : "s"} reference${count === 1 ? "s" : ""} this merchant.` },
        { status: 409 }
      );
    }
    await db.merchant.delete({ where: { id } });
    revalidateEverything();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("merchant delete failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Cannot delete this merchant.") }, { status: 400 });
  }
}
