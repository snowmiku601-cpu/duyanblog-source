#!/usr/bin/env node
/**
 * Google Ads consent-gate — structural guard (deterministic, no server).
 *
 * The Ads measurement tag may load ONLY when ALL of the following hold:
 *   1. NEXT_PUBLIC_GOOGLE_ADS_ID is configured (else nothing loads, ever).
 *   2. advertising consent === true (analytics-only or necessary-only never loads it).
 *   3. No request reaches googletagmanager.com before advertising consent.
 *   4. On consent revocation, gtag("consent", "update", {ad_storage:"denied",
 *      ad_user_data:"denied", ad_personalization:"denied"}) is issued — no
 *      further advertising measurement is permitted.
 *
 * TDD: written to FAIL against the pre-implementation source (RED), and to
 * PASS after google-ads-tag.tsx + layout wiring exist (GREEN). Rendered
 * network behaviour is verified separately against a local server.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(root, p), "utf8");
const exists = (p) => existsSync(path.join(root, p));

let passed = 0;
let failed = 0;
function check(name, cond, hint = "") {
  if (cond) { passed++; console.log(`PASS  ${name}`); }
  else { console.error(`FAIL  ${name}${hint ? ` — ${hint}` : ""}`); failed++; }
}

const tagPath = "src/components/consent/google-ads-tag.tsx";
check("google-ads-tag component exists", exists(tagPath));
if (!exists(tagPath)) {
  console.error(`\n${passed} pass, ${failed} fail — component missing (RED phase expected)`);
  process.exit(failed ? 1 : 0);
}

const tag = read(tagPath);
const layout = read("src/app/layout.tsx");
const consent = read("src/lib/consent.ts");
const envExample = read(".env.example");

// --- A/E. Env gate: no ID configured → no script regardless of consent -------
check("tag reads NEXT_PUBLIC_GOOGLE_ADS_ID from env (not hardcoded id)",
  /NEXT_PUBLIC_GOOGLE_ADS_ID/.test(tag) && !/AW-18506554917/.test(tag),
  "the ID must come from env, never hardcoded in source");
check(".env.example documents NEXT_PUBLIC_GOOGLE_ADS_ID (commented, unset by default)",
  /#\s*NEXT_PUBLIC_GOOGLE_ADS_ID/.test(envExample));

// --- A/B/C. Consent gate: script emission sits behind advertising consent ----
// Every googletagmanager occurrence (comments excluded) must sit inside an
// advertising-gated region: between an `advertising && (` opening and its
// balanced closing paren.
function behindAdvertisingGate(src) {
  const noComments = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  // Find all gate regions: from each `advertising && (` scan forward with a
  // paren balance counter to find where the gate expression closes.
  const gateRe = /advertising\s*&&\s*\(/g;
  const regions = [];
  let m;
  while ((m = gateRe.exec(noComments)) !== null) {
    const open = noComments.indexOf("(", m.index);
    let depth = 0;
    let end = -1;
    for (let i = open; i < noComments.length; i++) {
      if (noComments[i] === "(") depth++;
      else if (noComments[i] === ")") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end > 0) regions.push([m.index, end]);
  }
  let idx = -1;
  let found = false;
  while ((idx = noComments.indexOf("googletagmanager", idx + 1)) >= 0) {
    found = true;
    if (!regions.some(([s, e]) => idx > s && idx < e)) return false;
  }
  return found; // at least one reference exists, and every one is gated
}
check("every googletagmanager reference sits behind an advertising-consent gate",
  behindAdvertisingGate(tag));

// --- D. consent update on revocation ----------------------------------------
check("revocation issues gtag consent update with ad_storage denied",
  /ad_storage["']?\s*:\s*["']denied/.test(tag),
  "must set ad_storage denied on advertising consent withdrawal");
check("revocation issues gtag consent update with ad_user_data denied",
  /ad_user_data["']?\s*:\s*["']denied/.test(tag));
check("revocation issues gtag consent update with ad_personalization denied",
  /ad_personalization["']?\s*:\s*["']denied/.test(tag));

// --- consent-state handling --------------------------------------------------
check("uses getConsentSnapshot + subscribeConsent (existing consent abstraction)",
  /getConsentSnapshot/.test(tag) && /subscribeConsent/.test(tag));

// --- layout wiring: client component only, no unconditional script -----------
check("layout renders GoogleAdsTag (mount point)",
  /GoogleAdsTag/.test(layout));
check("layout does NOT contain a hardcoded googletagmanager script",
  !/googletagmanager/.test(layout));

// --- invariant: consent.ts contract untouched --------------------------------
check("consent.ts still defaults everything to off (no consent → null snapshot)",
  !/advertising:\s*true/.test(consent));

console.error(`\n${passed} pass, ${failed} fail`);
process.exit(failed ? 1 : 0);
