import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/auth";
import { newsletterConfirmEmail, sendMail } from "@/lib/email";

const bodySchema = z.object({
  email: z.string().trim().email().max(200),
  /** Honeypot — must be empty. */
  company: z.string().max(100).optional().default(""),
  source: z.string().max(60).optional().default("site"),
});

/** How long a /newsletter/confirm?token=… link stays valid. */
const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * Newsletter signup — double opt-in.
 *
 * Every fresh signup (and every re-subscribe from an address that never
 * confirmed) lands as `confirmed: false` with a fresh 48h confirm token,
 * and the confirmation link is emailed via the transport in src/lib/email
 * (Resend when RESEND_API_KEY is set; a console log otherwise).
 *
 * When no real provider is configured (console transport), non-production
 * environments additionally get the confirm URL back in the JSON body so
 * the flow is testable end-to-end. A configured provider means a real email
 * went out — the URL is never echoed, in any environment. See ARCHITECTURE.md.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts — try again in a minute." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  // Defense-in-depth beyond IP attribution (Correction 3 applies to newsletter
  // too): a client forging x-real-ip can mint fresh IP buckets, so a
  // process-global bucket caps the total signup attempts per minute no matter
  // what headers are sent. In-memory; resets on restart.
  const globalLimited = rateLimit("newsletter:global", 60, 60_000);
  if (!globalLimited.ok) {
    return NextResponse.json(
      { error: "Too many signup attempts — try again in a minute." },
      { status: 429, headers: { "Retry-After": String(globalLimited.retryAfterSeconds) } }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const { email, company, source } = parsed.data;
  if (company) {
    // Bot caught by honeypot — pretend success, store nothing.
    return NextResponse.json({ ok: true });
  }

  const normalized = email.toLowerCase();

  try {
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: normalized },
      select: { id: true, confirmed: true },
    });

    if (existing?.confirmed) {
      // Already on the list — keep tokens that may live in an old inbox,
      // refresh only the signup source.
      await db.newsletterSubscriber.update({
        where: { id: existing.id },
        data: { source },
      });
      return NextResponse.json({ ok: true, alreadyConfirmed: true });
    }

    const confirmToken = randomBytes(24).toString("hex");
    const confirmExpiresAt = new Date(Date.now() + CONFIRM_TTL_MS);

    if (existing) {
      // Pending (or an expired confirmation) — refresh the token so the new
      // link works, and keep the existing unsubscribe token.
      await db.newsletterSubscriber.update({
        where: { id: existing.id },
        data: { source, confirmToken, confirmExpiresAt },
      });
    } else {
      await db.newsletterSubscriber.create({
        data: {
          email: normalized,
          source,
          confirmed: false,
          unsubscribeToken: randomBytes(24).toString("hex"),
          confirmToken,
          confirmExpiresAt,
        },
      });
    }

    // Email the confirmation link. With Resend configured this is a real
    // delivery; otherwise (dev) it is logged. Delivery failure must not
    // fail the signup — the admin can re-send via a re-subscribe.
    const origin = new URL(request.url).origin;
    const confirmUrl = `${origin}/newsletter/confirm?token=${confirmToken}`;
    const mail = await sendMail({
      to: normalized,
      ...newsletterConfirmEmail(confirmUrl),
    });

    // Truthful transport state (Correction 14): when the mail transport can't
    // send right now (production and no provider configured → provider "none"),
    // the signup MUST NOT pretend success. Roll back the pending row so no
    // ghost subscriber exists, and answer the visitor honestly — nothing was
    // created and nothing will arrive until a provider is configured.
    if (mail.provider === "none") {
      if (!existing) {
        // Row was created above — remove it; the signup never happened.
        await db.newsletterSubscriber.deleteMany({ where: { email: normalized, confirmed: false } });
      }
      return NextResponse.json(
        { ok: false, error: "Signups are temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    // Dev/QA convenience only, and only when nothing was actually emailed:
    // no provider configured + non-production. Never exposes links in prod.
    if (mail.provider === "console" && process.env.NODE_ENV !== "production") {
      return NextResponse.json({ ok: true, confirmUrl });
    }
    return NextResponse.json({ ok: true, emailed: mail.delivered });
  } catch (err) {
    console.error("newsletter subscribe failed", err);
    return NextResponse.json({ error: "Could not subscribe right now — try again shortly." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
