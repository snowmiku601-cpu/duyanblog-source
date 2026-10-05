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
  const limited = rateLimit(`contact:${ip}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many messages — try again in a minute." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  // Defense-in-depth (Correction 3 applies to contact too): the fallback
  // client-IP key is "untrusted" (client headers are forgeable without a
  // verified proxy), so a process-global bucket caps the total messages per
  // minute no matter what headers a client sends. In-memory; resets on restart.
  const globalLimited = rateLimit("contact:global", 60, 60_000);
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

  try {
    await db.contactMessage.create({ data: { name, email, subject, message } });
  } catch (err) {
    console.error("contact message failed", err);
    return NextResponse.json({ error: "Could not send right now — try again shortly." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
