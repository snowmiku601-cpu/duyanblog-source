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
// The consent effect's revoke branch (else) must deny ALL THREE advertising
// categories together — verify the complete payload of the denied branch, not
// just the presence of the word "denied" anywhere in the file.
const effectBodiesAll = tag.match(/useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\},\s*\[[^\]]*\]\);/g) ?? [];
const revokeBody =
  effectBodiesAll
    .map((b) => (b.match(/else\s*\{([\s\S]*?)\n\s*\}/) || [])[1] ?? "")
    .find((body) => /ad_storage/.test(body)) ?? "";
check("revocation effect exists", effectBodiesAll.length >= 1 && revokeBody.includes("ad_storage"));
check("revocation effect denies ad_storage",
  /ad_storage["']?\s*:\s*["']denied/.test(revokeBody),
  "must set ad_storage denied on advertising consent withdrawal");
check("revocation effect denies ad_user_data",
  /ad_user_data["']?\s*:\s*["']denied/.test(revokeBody));
check("revocation effect denies ad_personalization",
  /ad_personalization["']?\s*:\s*["']denied/.test(revokeBody));
check("revocation effect grants nothing (all-deny payload)",
  !/["']granted["']/.test(revokeBody),
  "revocation payload must not contain any granted value");

// --- G. accepted consent must be reflected as GRANTED (Consent Mode) --------
// The gtag default consent state at load time (which happens only after
// advertising acceptance) must GRANT ad_storage + ad_user_data, keep
// ad_personalization denied (measurement consent ≠ personalization), and
// mirror analytics_storage from the independently-granted analytics consent.
check("load-time consent grants ad_storage (not blanket denied)",
  /ad_storage["']?\s*:\s*["']granted/.test(tag),
  "advertising acceptance must surface as ad_storage: granted");
check("load-time consent grants ad_user_data (not blanket denied)",
  /ad_user_data["']?\s*:\s*["']granted/.test(tag));
check("ad_personalization stays denied even when advertising granted",
  !/ad_personalization["']?\s*:\s*["']granted/.test(tag),
  "measurement consent must not silently enable personalization");
check("analytics_storage derives from analytics consent flag",
  /analytics_storage["']?\s*:\s*\$\{[^}]*analytics/.test(tag) || /analytics_storage["']?\s*:\s*["']\$\{/.test(tag),
  "analytics_storage value must be interpolated from the analytics consent flag");
check("granted consent is set as gtag default BEFORE config (ordering)",
  /consent['"],\s*['"]default[\s\S]{0,400}config['"]/.test(tag.replace(/\\n/g, "")),
  "default consent must precede config in the loaded script");

// --- consent-state handling --------------------------------------------------
check("uses getConsentSnapshot + subscribeConsent (existing consent abstraction)",
  /getConsentSnapshot/.test(tag) && /subscribeConsent/.test(tag));

// --- H. consent LIFECYCLE (review findings on PR head b4b614c) ---------------
// 1. EVERY transition — accept, revoke, and re-accept without a reload — must
//    push a real gtag consent command. The current implementation only has a
//    revoke-side effect; re-accept relies on remounting an inline Script,
//    which next/script dedupes by id for the page lifetime (never re-runs).
// 2. Analytics-only changes must also update analytics_storage.
// 3. Commands must go through the documented gtag queue contract: the exact
//    arguments-object form the loaded gtag() stub forwards, not a loose
//    plain array that only happens to resemble one.
const effectBodies = tag.match(/useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\},\s*\[[^\]]*\]\);/g) ?? [];
const allEffectCode = effectBodies.join("\n");
check("consent side effects exist as useEffect transitions (not only remounted inline scripts)",
  effectBodies.length >= 1);
// Both consent booleans must be in the effect dependency chain so that ANY
// transition (accept, revoke, analytics-only) re-issues a consent command.
check("consent effects depend on BOTH analytics and advertising transitions",
  /\[[^\]]*advertising[^\]]*\]/.test(allEffectCode) && /\[[^\]]*analytics[^\]]*\]/.test(allEffectCode),
  "analytics-only changes must re-issue analytics_storage, re-accept must re-grant");
// The granted path must exist as an actual command issuer (not only the
// load-time inline string): a granted consent command issued from an effect.
check("a granted consent command is issued from a live effect (re-accept without reload)",
  /["']granted["']/.test(allEffectCode) || /advertising\s*\?/.test(allEffectCode),
  "re-accept must actively transition consent back to granted");
check("denied path denies all three advertising categories in the effect",
  /ad_storage["']?\s*:\s*["']denied/.test(allEffectCode) &&
  /ad_user_data["']?\s*:\s*["']denied/.test(allEffectCode) &&
  /ad_personalization["']?\s*:\s*["']denied/.test(allEffectCode));
// ad_personalization must NEVER be granted anywhere, including effects.
check("ad_personalization is never granted anywhere in the component",
  !/ad_personalization["']?\s*:\s*["']granted/.test(tag));

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
