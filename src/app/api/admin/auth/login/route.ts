import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie, isSameOrigin } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().trim().min(3).max(160).toLowerCase(),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`login:${ip}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Too many attempts — try again in ${limited.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
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
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  try {
    const user = await db.user.findUnique({ where: { email } });
    const valid = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin login failed", err);
    return NextResponse.json({ error: "Sign-in failed — try again shortly." }, { status: 500 });
  }
}
