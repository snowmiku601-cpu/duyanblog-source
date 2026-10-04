import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/admin-api";
import { newsletterConfirmEmail, sendMail } from "@/lib/email";

/** How long a /newsletter/confirm?token=… link stays valid (mirrors the signup route). */
const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * POST /api/admin/subscribers/[id]/resend — re-send the double opt-in email.
 *
 * For pending (never-confirmed) subscribers only. The confirm token is
 * rotated: the fresh email carries a working link, and any older link that
 * may sit in an inbox stops working immediately. The unsubscribe token is
 * never touched.
 *
 * Response mirrors the signup route: with no provider configured (console
 * transport) and non-production, the confirm URL is returned so the admin
 * can hand-deliver it; a configured provider never echoes it.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  const subscriber = await db.newsletterSubscriber.findUnique({
    where: { id },
    select: { id: true, email: true, confirmed: true },
  });

  if (!subscriber) {
    return NextResponse.json({ error: "Subscriber not found — it may have been deleted." }, { status: 404 });
  }
  if (subscriber.confirmed) {
    return NextResponse.json({ error: "This address is already confirmed — nothing to re-send." }, { status: 400 });
  }

  const confirmToken = randomBytes(24).toString("hex");
  const confirmExpiresAt = new Date(Date.now() + CONFIRM_TTL_MS);

  await db.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { confirmToken, confirmExpiresAt },
  });

  const origin = new URL(request.url).origin;
  const confirmUrl = `${origin}/newsletter/confirm?token=${confirmToken}`;
  const mail = await sendMail({
    to: subscriber.email,
    ...newsletterConfirmEmail(confirmUrl),
  });

  if (mail.provider === "console" && process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ok: true, delivered: false, provider: mail.provider, confirmUrl, confirmToken });
  }
  if (!mail.delivered) {
    return NextResponse.json(
      { error: mail.error ?? "The email provider reported a failure — try again shortly." },
      { status: 502 },
    );
  }
  // Token returned so the admin UI (which already surfaces tokens for the
  // copy-link affordance) stays in sync after a rotation. The confirm URL is
  // still never echoed when a real provider is configured.
  return NextResponse.json({ ok: true, delivered: true, provider: mail.provider, confirmToken });
}
