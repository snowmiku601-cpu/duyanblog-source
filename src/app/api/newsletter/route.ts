import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/auth";
import { newsletterConfirmEmail, sendMail } from "@/lib/email";
import { site } from "@/lib/site";

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
  // Fine-grained per-IP bucket applies ONLY when a trusted IP exists (verified
  // proxy). Anonymous visitors (clientIp() === null) never consume a shared
  // IP window — otherwise one visitor could 429 everyone else. The contention
  // floor for anonymous traffic is the per-email + global buckets below.
  if (ip) {
    const limited = rateLimit(`newsletter:${ip}`, 5, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many attempts — try again in a minute." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }
  }

  // Process-global abuse floor: caps the TOTAL signup attempts per minute no
  // matter what headers or email addresses are sent. In-memory; resets on
  // restart. Low enough to stop a flood, high enough to never throttle a
  // real user base.
  const globalLimited = rateLimit("newsletter:global", 300, 60_000);
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

  // Normalized per-email bucket (Correction 3): repeated attempts on ONE
  // address are limited regardless of IP attribution, so rotating forging
  // headers can never produce unlimited attempts against a single signup.
  const normalized = email.toLowerCase().trim();
  const emailLimited = rateLimit(`newsletter:email:${normalized}`, 5, 60_000);
  if (!emailLimited.ok) {
    return NextResponse.json(
      { error: "Too many attempts for this address — try again in a minute." },
      { status: 429, headers: { "Retry-After": String(emailLimited.retryAfterSeconds) } }
    );
  }

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

    // Build the confirmation URL from the configured canonical public origin
    // (site.url), never from request.url: behind the Hostinger edge request.url
    // can itself be the internal upstream origin (0.0.0.0:3000) — the same bug
    // class that once broke /go redirects. Production emails must never carry
    // localhost/127.0.0.1/0.0.0.0/an upstream origin.
    const origin = site.url.replace(/\/+$/, "");
    const confirmUrl = `${origin}/newsletter/confirm?token=${confirmToken}`;
    const mail = await sendMail({
      to: normalized,
      ...newsletterConfirmEmail(confirmUrl),
    });

    // Truthful transport state (Correction 14): there is NO production path where
    // a failed confirmation delivery is presented to the visitor as a completed
    // signup.
    if (mail.provider === "none") {
      // Production without a provider: nothing could ever be sent. Roll back a
      // brand-new pending row so no ghost subscriber exists; the signup never
      // happened. (An existing pending row stays pending, as it was.)
      if (!existing) {
        await db.newsletterSubscriber.deleteMany({ where: { email: normalized, confirmed: false } });
      }
      return NextResponse.json(
        { ok: false, error: "Signups are temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    // Dev/QA convenience: console transport outside production means nothing was
    // actually emailed — expose the confirmUrl shortcut instead. Never in prod.
    if (mail.provider === "console" && process.env.NODE_ENV !== "production") {
      return NextResponse.json({ ok: true, confirmUrl });
    }

    // From here: a provider is configured (or console-in-production, which
    // sendMail never returns — it returns "none" without a key). If the
    // confirmation email was NOT delivered, the signup must not be reported as
    // successful. The pending row is intentionally kept (it is unconfirmed; the
    // admin's re-send action uses the same path), and the visitor gets a
    // truthful retryable 503.
    if (!mail.delivered) {
      return NextResponse.json(
        { ok: false, error: "We couldn't send the confirmation email — please try again in a moment." },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, emailed: true });
  } catch (err) {
    console.error("newsletter subscribe failed", err);
    return NextResponse.json({ error: "Could not subscribe right now — try again shortly." }, { status: 500 });
  }
}
