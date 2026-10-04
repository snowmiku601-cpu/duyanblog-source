import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, prismaErrorMessage } from "@/lib/admin-api";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  try {
    await db.redirect.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("redirect delete failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Cannot delete this redirect.") }, { status: 400 });
  }
}
