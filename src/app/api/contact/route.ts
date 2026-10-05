import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/auth";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  subject: z.string().trim().min(1).max(140),
  message: z.string().trim().min(1).max(4000),
  /** Honeypot */
  company: z.string().max(100).optional().default(""),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = clientIp(request);
  // Fine-grained per-IP bucket applies ONLY when a trusted IP exists (verified
  // proxy). Anonymous visitors (clientIp() === null) never consume a shared IP
  // window — otherwise one visitor could 429 everyone else. The floor for
  // anonymous traffic is the per-email + global buckets below.
  if (ip) {
    const limited = rateLimit(`contact:${ip}`, 5, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many messages — try again in a minute." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }
  }

  // Process-global abuse floor (Correction 3): caps the TOTAL messages per
  // minute no matter what headers or sender addresses are used. In-memory;
  // resets on restart. High enough to never throttle a real user base, low
  // enough to stop a flood.
  const globalLimited = rateLimit("contact:global", 300, 60_000);
  if (!globalLimited.ok) {
    return NextResponse.json(
      { error: "Too many messages — try again in a minute." },
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
    return NextResponse.json({ error: "Please fill in every field." }, { status: 400 });
  }
  const { name, email, subject, message, company } = parsed.data;
  if (company) {
    return NextResponse.json({ ok: true });
  }

  // Normalized per-sender-email bucket (Correction 3): repeated messages from
  // ONE address are limited regardless of IP attribution, so rotating forging
  // headers can never produce unlimited DB messages from a single account.
  const normalizedSender = email.toLowerCase().trim();
  const senderLimited = rateLimit(`contact:email:${normalizedSender}`, 5, 60_000);
  if (!senderLimited.ok) {
    return NextResponse.json(
      { error: "Too many messages from this address — try again in a minute." },
      { status: 429, headers: { "Retry-After": String(senderLimited.retryAfterSeconds) } }
    );
  }

  try {
    await db.contactMessage.create({ data: { name, email, subject, message } });
  } catch (err) {
    console.error("contact message failed", err);
    return NextResponse.json({ error: "Could not send right now — try again shortly." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
