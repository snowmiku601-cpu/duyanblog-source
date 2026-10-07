#!/usr/bin/env node
/**
 * LAUNCH-READINESS GUARD (pre-indexing).
 *
 * Deterministic source scan that fails fast if a future edit reintroduces either
 * of the two launch-blocking copy defects this site shipped with:
 *
 *   1. FALSE CURRENT-DEMO LANGUAGE — public surfaces claiming production is still
 *      "a demonstration build" / "Demo build" / "In this demonstration build"
 *      when real editorial articles are live. Conditional demo phrasing —
 *      `demo_mode`, `isDemo`, "if we publish sample content", admin-only
 *      strings — is allowed and NOT scanned.
 *
 *   2. FALSE CURRENT-AFFILIATE LANGUAGE — public copy asserting affiliate links
 *      are already active ("Some pages on this site contain affiliate links")
 *      while the launch state intentionally has zero commerce. Mechanism /
 *      conditional descriptions ("If and when we use affiliate links…", the /go
 *      mechanism) are allowed.
 *
 * Also asserts the four Task-41A runtime fixes are present (guide `min-w-0`,
 * roundup box not unconditional, footer dead sections dropped).
 *
 * This is a source guard, not a rendered-page test — the smoke suite verifies
 * the rendered result against a running server.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => existsSync(path.join(root, rel));

let passed = 0;
let failed = 0;
function check(name, cond, hint = "") {
  if (cond) { passed++; console.log(`PASS  ${name}`); }
  else { console.error(`FAIL  ${name}${hint ? ` — ${hint}` : ""}`); failed++; }
}
function lineHas(stem, re) {
  return stem.split("\n").find((line) => re.test(line)) ?? null;
}

// ---------------------------------------------------------------------------
// 1. FALSE CURRENT-DEMO LANGUAGE — public surfaces only
// ---------------------------------------------------------------------------
// Files that render to public visitors. Admin-only files and internal comments
// are excluded by not being listed here.
const publicFiles = [
  "src/components/site-footer.tsx",
  "src/components/site-header.tsx",
  "src/app/page.tsx",
  "src/app/about/page.tsx",
  "src/app/deals/page.tsx",
  "src/components/consent/consent-manager.tsx",
  "src/content/policies.ts",
  "src/lib/site.ts",
];

// Forbidden unqualified current-state demo claims.
const FORBIDDEN_DEMO = [
  { re: /Demo build/, why: "'Demo build' asserted unconditionally" },
  { re: /currently a demonstration build/, why: "'currently a demonstration build' false claim" },
  { re: /In this demonstration build/, why: "'In this demonstration build' false claim" },
  { re: /This demonstration build contains/, why: "'This demonstration build contains' false claim" },
];

for (const file of publicFiles) {
  if (!exists(file)) continue;
  const src = read(file);
  for (const { re, why } of FORBIDDEN_DEMO) {
    const hit = lineHas(src, re);
    if (hit) {
      // A hit is acceptable ONLY on a line that is explicitly demo-conditional
      // (guarded by demo_mode / isDemo / a "if we publish sample content"
      // conditional). Other contexts = false current-state claim.
      const isConditional = /demo_mode|isDemo|"demo_mode"|pageDemoMode|if we publish/i.test(hit);
      check(`${file}: no ${why}`, isConditional, `line '${hit.trim().slice(0, 100)}' is not conditional`);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. FALSE CURRENT-AFFILIATE LANGUAGE — public copy
// ---------------------------------------------------------------------------
const policies = read("src/content/policies.ts");
check(
  "affiliate-disclosure intro does NOT claim 'Some pages on this site contain affiliate links'",
  !/Some pages on this site contain affiliate links/.test(policies),
  "affiliate-disclosure intro must be current-state-neutral",
);
check(
  "how-we-make-money affiliate copy is conditional (If and when …), not active",
  /If and when we use affiliate links/.test(policies),
);
check(
  "terms no longer assert 'all products, merchants and offers are fictional samples'",
  !/all products, merchants and offers are fictional samples/.test(policies),
);
check(
  "publisherNote no longer implies current commissions through existing links",
  !/we may earn a commission when you buy through links on this site/.test(read("src/lib/site.ts")),
);

// ---------------------------------------------------------------------------
// 3. Task-41A runtime fixes present
// ---------------------------------------------------------------------------
check(
  "guide main column carries min-w-0 (mobile overflow fix)",
  /className="min-w-0 space-y-8 lg:col-span-8"/.test(read("src/app/guides/[slug]/page.tsx")),
);
check(
  "roundup page no longer renders unconditional affiliate-disclosure box",
  !/AffiliateDisclosure variant="box"/.test(read("src/app/best/[slug]/page.tsx")),
);
check(
  "footer sections no longer list dead /software and/or /tech routes",
  !/href: "\/software"|href: "\/tech"/.test(read("src/lib/site.ts")),
);

// ---------------------------------------------------------------------------
console.log(`\n${passed} pass, ${failed} fail`);
if (failed > 0) process.exitCode = 1;