import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, parseBody, prismaErrorMessage } from "@/lib/admin-api";
import { offerSchema, revalidateOffer } from "@/lib/admin-offers";

export async function POST(request: Request) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;

  const parsed = await parseBody(request, offerSchema);
  if (parsed.response) return parsed.response;

  try {
    const merchant = await db.merchant.findUnique({ where: { id: parsed.data.merchantId } });
    if (!merchant) return NextResponse.json({ error: "Merchant not found — create it first." }, { status: 400 });

    const row = await db.affiliateOffer.create({ data: parsed.data });
    await revalidateOffer(row.articleId);
    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    console.error("offer create failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Could not create the offer.") }, { status: 400 });
  }
}
