#!/usr/bin/env node
/**
 * Google tag consent coordination — structural guard (deterministic, no server).
 *
 * Covers BOTH destinations (Google Ads AW + GA4 G-) through ONE shared gtag
 * bootstrap in src/components/consent/google-tag.tsx:
 *
 *   1. IDs come only from build-time env (NEXT_PUBLIC_GOOGLE_ADS_ID /
 *      NEXT_PUBLIC_GA4_MEASUREMENT_ID); a missing ID disables that destination
 *      (and both absent = no Google anything).
 *   2. Zero external Google requests before any optional consent.
 *   3. Consent Mode v2 shape: consent default ALL-DENIED precedes every
 *      config; every transition re-issues a consent update through the gtag
 *      command contract.
 *   4. Google Ads gated by advertising consent; GA4 gated by analytics
 *      consent; ad_personalization never granted; the categories stay
 *      independent (analytics does not grant ads, ads does not grant
 *      analytics).
 *   5. Each destination is configured at most once per page session.
 *   6. GA4 page views are application-generated (send_page_view:false) and
 *      must stop when analytics consent is revoked.
 *
 * TDD: written RED against the pre-GA4 source (GoogleAdsTag-only), GREEN
 * after the coordinated GoogleTag implementation + layout wiring. Rendered
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

const tagPath = "src/components/consent/google-tag.tsx";
check("coordinated google-tag component exists", exists(tagPath));
if (!exists(tagPath)) {
  console.error(`\n${passed} pass, ${failed} fail — component missing (RED phase expected)`);
  process.exit(failed ? 1 : 0);
}

const tag = read(tagPath);
const layout = read("src/app/layout.tsx");
const consent = read("src/lib/consent.ts");
const envExample = read(".env.example");
const adsTagStill = exists("src/components/consent/google-ads-tag.tsx")
  ? read("src/components/consent/google-ads-tag.tsx") : null;

// --- IDs from env, never hardcoded -------------------------------------------
check("reads NEXT_PUBLIC_GOOGLE_ADS_ID from env (no hardcoded AW id)",
  /NEXT_PUBLIC_GOOGLE_ADS_ID/.test(tag) && !/AW-\d+/.test(tag));
check("reads NEXT_PUBLIC_GA4_MEASUREMENT_ID from env (no hardcoded G- id)",
  /NEXT_PUBLIC_GA4_MEASUREMENT_ID/.test(tag) && !/G-[A-Z0-9]{6,}/.test(tag),
  "GA4 Measurement ID must come from env");
check(".env.example documents both Google IDs (commented, unset by default)",
  /#\s*NEXT_PUBLIC_GOOGLE_ADS_ID/.test(envExample) && /#\s*NEXT_PUBLIC_GA4_MEASUREMENT_ID/.test(envExample));

// --- Consent gating: every googletagmanager reference inside a consent gate ---
function behindGate(src, gateRe) {
  const noComments = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
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
  return found;
}
// The gtag.js LOAD (any external request) must be gated on "some optional
// consent granted" — accept either an explicit `(analytics || advertising)`
// gate or an equivalent combined boolean in scope.
check("every googletagmanager reference sits behind an optional-consent gate",
  behindGate(tag, /(?:analytics\s*\|\|\s*advertising|someConsent|anyConsent|tagAuthorized)\s*&&\s*\(/g),
  "external Google requests must never precede optional consent");

// --- Consent Mode v2 defaults: all-denied BEFORE config -----------------------
// Ordering guarantee is structural: the all-denied default lives INSIDE the
// GTAG_STUB source, and the stub script is the FIRST rendered script (before
// the gtag.js loader and long before any destination config). Verify both.
const stubSource = (tag.match(/const GTAG_STUB = `([\s\S]*?)`;/) || ["", ""])[1];
check("the all-denied consent default lives inside the shared bootstrap stub",
  /consent['"],\s*['"]default['"]/.test(stubSource) &&
  /ad_storage["']?\s*:\s*["']denied/.test(stubSource) &&
  /ad_user_data["']?\s*:\s*["']denied/.test(stubSource) &&
  /ad_personalization["']?\s*:\s*["']denied/.test(stubSource) &&
  /analytics_storage["']?\s*:\s*["']denied/.test(stubSource),
  "Consent Mode v2: defaults must exist before any config, in the first script");
check("stub script renders before the gtag.js loader script",
  tag.indexOf('id="dy-gtag-stub"') >= 0 &&
  tag.indexOf('id="dy-gtag-stub"') < tag.indexOf('id="dy-gtag-js"'),
  "bootstrap must precede the library load");
const defaultCtx = (tag.match(/consent['"],\s*['"]default['"],?\s*\{[\s\S]{0,400}/) || [""])[0];
check("consent default denies ad_storage",
  /ad_storage["']?\s*:\s*["']denied/.test(defaultCtx));
check("consent default denies ad_user_data",
  /ad_user_data["']?\s*:\s*["']denied/.test(defaultCtx));
check("consent default denies ad_personalization",
  /ad_personalization["']?\s*:\s*["']denied/.test(defaultCtx));
check("consent default denies analytics_storage",
  /analytics_storage["']?\s*:\s*["']denied/.test(defaultCtx));
check("ad_personalization is never granted anywhere",
  !/ad_personalization["']?\s*:\s*["']granted/.test(tag));

// --- Per-transition consent updates ------------------------------------------
// The consent payload lives in the issueConsentUpdate helper; effects call it
// on every transition. Verify the helper's granted/denied derivation AND the
// effects' dependency wiring together.
const effects = tag.match(/useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\},\s*\[[^\]]*\]\);/g) ?? [];
const effectsCode = effects.join("\n");
const consentUpdateFn = (tag.match(/function issueConsentUpdate[\s\S]*?\n\}/) || [""])[0];
check("consent update helper derives categories from the live decisions",
  /advertising\s*\?/.test(consentUpdateFn) && /analytics\s*\?/.test(consentUpdateFn),
  "advertising consent controls ad categories; analytics controls analytics_storage");
check("consent update helper grants ad categories only under advertising consent",
  /ad_storage["']?\s*:\s*advertising\s*\?/.test(consentUpdateFn.replace(/\s/g, "").replace(":", ": ")) ||
  /ad_storage["']?\s*:\s*\$\{advertising/.test(consentUpdateFn),
  "categories must reflect the current advertising decision, not blanket-grant");
check("consent effects depend on both consent categories",
  /\[[^\]]*advertising[^\]]*\]/.test(effectsCode) && /\[[^\]]*analytics[^\]]*\]/.test(effectsCode));
check("consent effects actually issue the consent update (live effect, re-accept without reload)",
  /issueConsentUpdate\(/.test(effectsCode));

// --- One bootstrap, one library load, per-destination single config ----------
check("single shared gtag bootstrap stub",
  (tag.match(/dy-gtag-stub|GTAG_STUB/g) || []).length >= 2, // definition + use
  "one shared command-queue bootstrap");
check("exactly one gtag.js script element is rendered (shared library load)",
  (tag.match(/gtag\/js/g) || []).length === 1);
check("each destination config is issued at most once per page session (config-set guard)",
  /configured\.(add|has)/.test(tag),
  "repeated config calls would duplicate measurement");
check("GA4 config disables automatic page_view (send_page_view:false)",
  /send_page_view["']?\s*:\s*false/.test(tag));

// --- GA4 page views: application-generated, consent-gated, sanitized ---------
check("GA4 page views are pushed from an effect gated on analytics consent",
  /page_view/.test(effectsCode) && /analytics/.test(effectsCode));
check("page_view is suppressed while analytics consent is absent/revoked",
  /if\s*\(!?analytics\)|if\s*\(!analytics\)|analytics\s*\?/.test(effectsCode) || /analytics &&/.test(effectsCode));
check("page views exclude admin/authenticated routes",
  /\/admin/.test(tag));
check("page views do not send raw query strings (PII-safe pathname)",
  /pathname\.split|searchParams|location\.search.*exclude|split\(["']\?["']\)/.test(tag) || !/location\.search/.test(tag));

// --- Review findings (Task 48.1) — RED against PR head 0091198 ---------------
// F1: the loader eligibility must follow the AUTHORIZED destination, not
// `ADS_ID || GA4_ID`. Analytics-only must load the GA4 library; an
// unconfigured destination's consent must never trigger a script.
const noCommentsTag = tag.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
check("F1: the AW-first ordering regression (ADS_ID || GA4_ID) is absent",
  !/(ADS_ID\s*\|\|\s*GA4_ID)|(const\s+libraryId\s*=\s*ADS_ID)/.test(noCommentsTag),
  "analytics-only consent would load the Ads library — AW-first selection is banned");
check("F1: library id is selected from eligibility (consent AND configured id)",
  /analyticsEligible\s*\?|advertisingEligible\s*\?/.test(noCommentsTag),
  "loader must pick the first AUTHORIZED+configured destination");
// F2: explicit GA4 destination routing on every application-generated event.
check("F2: manual page_view carries explicit send_to routing to the GA4 destination",
  /send_to["']?\s*:/.test(tag) && /send_to["']?\s*:?\s*(GA4_ID|\$\{GA4_ID|GA4_ID\})/.test(tag),
  "events must be routed explicitly to G-…, never to the default (Ads) destination");
// F3: sanitized absolute page_location derived from a trusted origin.
check("F3: explicit sanitized page_location is set (site origin + clean pathname)",
  /page_location/.test(tag) && /origin/.test(tag),
  "GA4 would otherwise default page_location to the full URL incl. query strings");

// --- Task 48.2 — GA4 config context gap --------------------------------------
// GA4 defaults page_location=document.location and page_referrer=
// document.referrer — both can carry query parameters. The GA4 config AND
// every manual page_view must set BOTH explicitly, from sanitized values.
// The referrer strategy: same-origin referrer = origin + clean path;
// cross-origin = origin only; raw document.referrer never passed through.
check("48.2: GA4 config itself sets explicit sanitized page context (spreads the sanitizer)",
  /config["'],\s*GA4_ID,\s*\{\s*send_page_view:\s*false,\s*\.\.\.sanitizedPageContext/.test(tag),
  "config-time context must be sanitized, not left to GA4 defaults");
check("48.2: sanitized page_referrer helper exists (strip query/fragment, origin-only cross-origin)",
  /page_referrer/.test(tag) && (/referrer/.test(tag) && (/origin/.test(tag) || /same-origin|sanitiz/i.test(tag))),
  "raw document.referrer must never be passed through");
check("48.2: manual page_view sets page_referrer explicitly (no implicit document.referrer)",
  (tag.match(/page_referrer/g) || []).length >= 2,
  "config + manual page_view must both carry the sanitized referrer");
check("48.2: sanitized page context is shared between config and page_view (one sanitizer)",
  /function sanitize|const sanitize|safePath|cleanPath/.test(tag),
  "duplicate sanitizers drift; one shared helper");
const sanitizerBody = (tag.match(/function sanitizedPageContext[\s\S]*?(?=function issueConsentUpdate)/) || [""])[0];
check("48.2: sanitizer never passes raw document.referrer through",
  Boolean(sanitizerBody) && !/page_referrer\s*=\s*document\.referrer/.test(sanitizerBody) && /safePath|r\.origin/.test(sanitizerBody),
  "referrer must be reduced to origin(+clean same-origin path), never document.referrer raw");
check("48.2: cross-origin referrer is origin-only",
  /sameOrigin\s*\?|\?[^:]*r\.origin[^:]*:/.test(sanitizerBody) || /sameOrigin\s*\?\s*`/.test(sanitizerBody),
  "third-party URLs/identifiers must not leak through the referrer");
check("48.2: AW config also suppresses auto page_view (dl=document.location leak)",
  /config["'],\s*ADS_ID,\s*\{[\s\S]{0,120}send_page_view:\s*false/.test(tag),
  "Ads default page_view sends the raw document.location — it must be suppressed like GA4's");

// --- Task 48.3 — revocation + private-route config ---------------------------
// P0: the consent effect must be driven by "a Google integration exists and
// may have been loaded" — NOT by the current eligibility. When both consents
// flip false after a tag load, the effect must STILL issue the all-denied
// update; an early return keyed on libraryId strands the loaded tag in its
// last granted state.
const consentEffect = effects.find((e) => /issueConsentUpdate\(/.test(e)) ?? "";
check("48.3 P0: consent effect is NOT gated on current library eligibility",
  !/if\s*\(!libraryId\s*\|\|\s*!mounted\)\s*return/.test(consentEffect),
  "both-false revocation would early-return and strand granted consent on a loaded tag");
check("48.3 P0: consent effect runs when a tag was previously loaded (not eligibility-gated)",
  /!anyIntegration\s*\|\|\s*!mounted/.test(consentEffect) && /issueConsentUpdate\(/.test(consentEffect),
  "revocation after a load must still push the all-denied update — gate on integration existence, not current eligibility");
// P1: private routes must never get a bare-fallback GA4 config (the bare
// config inherits GA4's default raw page context); on private routes the
// config must be skipped entirely (later public navigation configures it).
check("48.3 P1: no bare send_page_view-only GA4 config fallback exists",
  !/config["'],\s*GA4_ID,\s*\{\s*send_page_view:\s*false\s*\}\s*\)/.test(tag),
  "private-route fallback would configure GA4 without sanitized context");

// --- wiring + invariants ------------------------------------------------------
check("layout renders GoogleTag (mount point)", /GoogleTag/.test(layout));
check("layout does NOT contain a hardcoded googletagmanager script",
  !/googletagmanager/.test(layout));
check("consent.ts still defaults everything to off (no consent → null snapshot)",
  !/advertising:\s*true/.test(consent));
if (adsTagStill) {
  check("the standalone GoogleAdsTag is retired (no duplicate tag implementations)",
    !/googletagmanager/.test(adsTagStill),
    "two competing gtag implementations would double-measure");
}

console.error(`\n${passed} pass, ${failed} fail`);
process.exit(failed ? 1 : 0);
