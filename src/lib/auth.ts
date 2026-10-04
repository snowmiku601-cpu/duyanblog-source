import "server-only";

import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const scrypt = promisify(scryptCb);

/**
 * Minimal, carefully reviewed session auth for the admin area.
 *
 * - Passwords: scrypt (Node built-in KDF) with per-password random salt.
 * - Sessions: 256-bit random token in an HttpOnly cookie; only the SHA-256
 *   hash of the token is stored in the database.
 * - No default credentials exist. Create the first admin with:
 *     npm run admin:bootstrap -- --email you@example.com --password ……
 */

const SCRYPT_KEYLEN = 64;
const SESSION_COOKIE = "dy_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password.normalize("NFKC"), salt, SCRYPT_KEYLEN)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hex] = parts;
  const expected = Buffer.from(hex, "hex");
  const derived = (await scrypt(password.normalize("NFKC"), salt, expected.length)) as Buffer;
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

/** Returns the signed-in admin user, or null. Validates expiry + user. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

/** For server components / pages: redirect to login when unauthenticated. */
export async function requireAdminPage(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** For route handlers: returns a 401 response when unauthenticated. */
export async function requireAdminApi(): Promise<{ user: AdminUser } | { response: NextResponse }> {
  const user = await getAdminUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}

/**
 * CSRF defence-in-depth for mutating requests: verify the Origin header
 * (when present) matches the request host. Combined with SameSite=Lax cookies.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients (curl) — cookie still required
  try {
    const originHost = new URL(origin).host;
    const host = request.headers.get("host");
    return host === originHost;
  } catch {
    return false;
  }
}

export function passwordPolicyOk(password: string): boolean {
  return password.length >= 12 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}
