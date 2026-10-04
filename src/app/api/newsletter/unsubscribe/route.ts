import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/auth";

const bodySchema = z.object({
  token: z.string().trim().regex(/^[0-9a-f]{16,64}$/, "Invalid unsubscribe link."),
});

/**
 * POST /api/newsletter/unsubscribe — one-click opt-out driven by the token
 * embedded in /newsletter/unsubscribe?token=… links (the link a real monthly
 * email would carry). Deletes the subscriber row outright: the honest way to
 * stop sending. No confirmation email loop — the link *is* the confirmation.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const limited = rateLimit(`unsubscribe:${clientIp(request)}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts — try again in a minute." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "This unsubscribe link isn't valid." }, { status: 400 });
  }

  try {
    const deleted = await db.newsletterSubscriber.deleteMany({
      where: { unsubscribeToken: parsed.data.token },
    });
    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "This link has already been used or the address was removed." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("newsletter unsubscribe failed", err);
    return NextResponse.json({ error: "Could not unsubscribe right now — try again shortly." }, { status: 500 });
  }
}
