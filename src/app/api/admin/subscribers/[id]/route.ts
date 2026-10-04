import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, prismaErrorMessage } from "@/lib/admin-api";

/** DELETE /api/admin/subscribers/[id] — remove one newsletter subscriber. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  try {
    await db.newsletterSubscriber.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("subscriber delete failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Subscriber not found.") }, { status: 400 });
  }
}
