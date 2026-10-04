import { NextResponse } from "next/server";
import { clearSession, isSameOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  try {
    await clearSession();
  } catch (err) {
    console.error("admin logout failed", err);
  }
  return NextResponse.json({ ok: true });
}
