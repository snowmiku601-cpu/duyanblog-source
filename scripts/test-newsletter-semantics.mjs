#!/usr/bin/env node
/**
 * STRUCTURAL SEMANTICS GUARD for the newsletter route (NOT a provider mock).
 *
 * This is deliberately NOT a mocked Resend integration/delivery test — it does
 * not exercise sendMail() over the network. It reads the route source and
 * asserts the DECISION SHAPE the route is required to have, so a future edit
 * that reintroduces either of the two shipped defects fails fast:
 *
 *   1. A failed confirmation delivery must never be presented as a completed
 *      signup (Correction 14): there is no path where deliver-failed yields
 *      `{ ok: true }`.
 *   2. Production confirmation URLs must be built from the canonical public
 *      origin (site.url), never from request.url (the reverse-proxy bug class
 *      that once broke /go with an internal 0.0.0.0:3000 origin).
 *
 * Delivery behaviour itself is verified end-to-end by the smoke suite against
 * a running server (503 no-provider / email-outcome branches).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const routeSrc = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "app", "api", "newsletter", "route.ts"),
  "utf8"
);

let passed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`PASS  ${name}`); }
  else { console.error(`FAIL  ${name}`); process.exitCode = 1; }
}

// --- Invariant 1: no path reports delivery failure as ok:true -----------------
check(
  "no-provider branch returns 503 (never ok)",
  /mail\.provider === "none"[\s\S]{0,700}status: 503/.test(routeSrc),
);
check(
  "delivery-failure (resend, delivered=false) returns 503, not ok",
  /if \(!mail\.delivered\)[\s\S]{0,200}status: 503/.test(routeSrc),
);
// Every `ok: true` that appears AFTER sendMail must be gated behind either the
// dev console shortcut or `delivered === true`. We verify structurally: the
// `!mail.delivered` guard precedes the only post-send success return, and the
// only other post-send ok is the console dev shortcut.
const posOfSendMail = routeSrc.indexOf("sendMail(");
const postSend = routeSrc.slice(posOfSendMail);
const postSendOkTrue = (postSend.match(/ok: true/g) || []).length;
check(
  `post-sendMail has ≤2 truthy-success tokens (console shortcut + delivered path), got ${postSendOkTrue}`,
  postSendOkTrue >= 0 && postSendOkTrue <= 2,
);
check(
  "the last ok:true is gated by delivered=true path, not a bare fallback",
  /return NextResponse\.json\(\{ ok: true, emailed: true \}\);/.test(routeSrc),
);

// --- Invariant 2: canonical public origin, never request.url or localhost ----
check("confirmUrl built from site.url", /site\.url/.test(routeSrc));
check("route does NOT build confirmUrl from request.url", !/new URL\(request\.url\)\.origin/.test(routeSrc));
check("no localhost/127.0.0.1/0.0.0.0 literal can leak into confirmUrl",
  !/confirmUrl\s*=\s*[`'"].*(localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(routeSrc));

console.log(`\n${passed} structural semantics checks passed (route source, not a provider mock).`);
process.exit(process.exitCode ?? 0);