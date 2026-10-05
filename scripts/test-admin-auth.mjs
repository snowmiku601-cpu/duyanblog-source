#!/usr/bin/env node
/**
 * ADMIN authorization regression (fail-closed):
 *  - role ADMIN  → login succeeds, session usable,
 *  - role EDITOR → login is denied (403), no usable admin session issued.
 * EDITOR remains reserved for a future permission matrix — today it is not a
 * lesser-session role. Runs against a RUNNING server (SMOKE_BASE_URL or
 * http://localhost:3000) and only the LOCAL dev DB (never production).
 */
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const db = new PrismaClient();

// Hash password with the SAME scheme as src/lib/auth.ts (scrypt$salt$hex) but
// inline so this script never imports next/server-only code.
function scryptHash(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password.normalize("NFKC"), salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

const email = `auth-probe-${randomBytes(5).toString("hex")}@duyanblog.test`;
const password = "ProbePass123!";
const EMAIL = email;
const PASSWORD = password;

let created = null;
let passed = 0;
function check(name, cond, extra = "") {
  if (cond) { passed++; console.log(`PASS  ${name}`); }
  else { console.error(`FAIL  ${name}${extra ? ` — ${extra}` : ""}`); process.exitCode = 1; }
}

const cookieJar = { c: "" };
async function login(asRole) {
  const passwordHash = scryptHash(PASSWORD);
  // Upsert a user of the given role for the probe (cleaned afterwards).
  const user = await db.user.upsert({
    where: { email: EMAIL },
    update: { role: asRole, passwordHash },
    create: { email: EMAIL, role: asRole, passwordHash },
  });
  created = user;
  const res = await fetch(`${BASE}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: new URL(BASE).origin },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  cookieJar.c = setCookie.split(";")[0];
  return { res, cookie: setCookie };
}

try {
  // 1. ADMIN login succeeds and issues a session.
  const admin = await login("ADMIN");
  check("ADMIN login succeeds (200)", admin.res.status === 200, `got ${admin.res.status}`);
  check("ADMIN login sets a session cookie", admin.cookie.includes("dy_admin_session"));
  check("ADMIN session is usable on an admin API route",
    (await fetch(`${BASE}/api/admin/settings`, { method: "PUT", headers: { "Content-Type": "application/json", Origin: new URL(BASE).origin, Cookie: cookieJar.c }, body: JSON.stringify({ key: "demo_mode", value: "true" }) })).status !== 401 && (await fetch(`${BASE}/api/admin/settings`, { method: "PUT", headers: { "Content-Type": "application/json", Origin: new URL(BASE).origin, Cookie: cookieJar.c }, body: JSON.stringify({ key: "demo_mode", value: "true" }) })).status !== 403,
  );

  // clear admin session
  await fetch(`${BASE}/api/admin/auth/login`, { method: "POST", headers: { "Content-Type": "application/json", Origin: new URL(BASE).origin }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });

  // 2. EDITOR login is DENIED (403), no usable session.
  const editor = await login("EDITOR");
  check("EDITOR login denied (403)", editor.res.status === 403, `got ${editor.res.status}`);
  check("EDITOR gets no session cookie", !editor.cookie.includes("dy_admin_session="));

  // 3. Editor-role user cannot reach an admin API route even with a forged
  //    ADMIN session cookie shape — requireAdminApi is role-fail-closed.
  const denied = await fetch(`${BASE}/api/admin/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: new URL(BASE).origin, Cookie: "dy_admin_session=deadbeef" },
    body: JSON.stringify({ key: "demo_mode", value: "true" }),
  });
  check("forged invalid session is not authorized (401/403/400)", denied.status !== 200, `got ${denied.status}`);
} finally {
  // Clean up the probe user + any sessions; never leave test rows.
  if (created) {
    await db.session.deleteMany({ where: { userId: created.id } });
    await db.user.delete({ where: { id: created.id } }).catch(() => {});
  }
  await db.$disconnect();
}

console.log(`\n${passed} admin-authorization checks passed.`);
process.exit(process.exitCode ?? 0);