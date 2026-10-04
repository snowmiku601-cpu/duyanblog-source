import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardAdmin, parseBody, prismaErrorMessage } from "@/lib/admin-api";

const bodySchema = z.object({ read: z.boolean() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  const parsed = await parseBody(request, bodySchema);
  if (parsed.response) return parsed.response;

  try {
    const row = await db.contactMessage.update({
      where: { id },
      data: { read: parsed.data.read },
    });
    return NextResponse.json({ ok: true, read: row.read });
  } catch (err) {
    console.error("message read-toggle failed", err);
    return NextResponse.json({ error: prismaErrorMessage(err, "Message not found.") }, { status: 400 });
  }
}
