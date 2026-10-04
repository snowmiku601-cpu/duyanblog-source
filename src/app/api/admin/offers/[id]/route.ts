import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, parseBody, prismaErrorMessage } from "@/lib/admin-api";
import { offerSchema, revalidateOffer } from "@/lib/admin-offers";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  const parsed = await parseBody(request, offerSchema);
  if (parsed.response) return parsed.response;

  try {
    const existing = await db.affiliateOffer.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Offer not found." }, { status: 404 });

    await db.affiliateOffer.update({ where: { id }, data: parsed.data });
    await revalidateOffer(parsed.data.articleId ?? existing.articleId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("offer update failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not update the offer.") }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  try {
    const existing = await db.affiliateOffer.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Offer not found — it may be deleted already." }, { status: 404 });

    await db.affiliateOffer.delete({ where: { id } });
    await revalidateOffer(existing.articleId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("offer delete failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Cannot delete this offer.") }, { status: 400 });
  }
}
