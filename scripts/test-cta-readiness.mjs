#!/usr/bin/env node
/**
 * CTA production-readiness — structural guard (deterministic, no server).
 *
 * Mirrors test-newsletter-semantics.mjs: reads source, asserts the DECISION SHAPE.
 * Goals:
 *   1. No demo wording can reach a real-backed surface (demo wording must be
 *      conditional on an isDemo flag, never unconditional).
 *   2. Demo context is REQUIRED, not optional — a future caller cannot omit it.
 *   3. No seed/CLI instruction or fabricated price-check date can appear on /deals.
 *   4. "it costs you nothing extra" (unverifiable) never renders anywhere.
 * Rendered behaviour is verified by scripts/smoke.mjs against a running server.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(root, p), "utf8");

const merchantOffer = read("src/components/affiliate/merchant-offer.tsx");
const renderer = read("src/components/editorial/article-renderer.tsx");
const comparisonTable = read("src/components/comparison-table.tsx");
const affiliateLink = read("src/components/affiliate/affiliate-link.tsx");
const dealsPage = read("src/app/deals/page.tsx");
const callSites = {
  review: read("src/app/reviews/[slug]/page.tsx"),
  best: read("src/app/best/[slug]/page.tsx"),
  compare: read("src/app/compare/[slug]/page.tsx"),
  guides: read("src/app/guides/[slug]/page.tsx"),
  articles: read("src/app/articles/[slug]/page.tsx"),
};

let passed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`PASS  ${name}`); }
  else { console.error(`FAIL  ${name}`); process.exitCode = 1; }
}

// --- Invariant 1: demo wording is conditional, not baked in ------------------
// Demo/sample tokens must only appear inside an isDemo-gated branch. A token
// inside `{isDemo && (...)}` or a `isDemo ? demoBranch : realBranch` ternary is
// fine; the same token outside any isDemo-gated context is a leak. We assert
// conditionality structurally: every occurrence of the token sits after an
// `isDemo &&`/`isDemo ?` gate opening before the next closing of that expression.
function gatedOccurrences(src, token) {
  // split on isDemo gates; anything outside a gate that contains the token fails.
  // Segments: find every `isDemo && (` ... matching close, and `isDemo ?` ... `:`.
  // Cheap structural approximation: strip isDemo-gated regions, then search.
  const stripped = src
    .replace(/\{\s*isDemo\s*&&\s*\([\s\S]*?\)\s*\}/g, "") // JSX conditional render
    .replace(/\{\s*isDemo\s*&&\s*<[\s\S]*?\/>\s*\}/g, "") // self-closing JSX
    .replace(/isDemo\s*\?[\s\S]*?:[\s\S]*?(?=[,;)}])/g, ""); // ternaries
  return stripped.includes(token);
}
check("MerchantOffer: '(demo)' only inside isDemo-gated branches",
  !gatedOccurrences(merchantOffer, "(demo)"));
check("pick path: '(demo merchant)' only inside isDemo-gated branches",
  !gatedOccurrences(renderer, "(demo merchant)"));
check("pick chip 'sample data' only inside isDemo-gated branches",
  !gatedOccurrences(renderer, "sample data"));
check("ComparisonTable footer demo wording only inside isDemo ternary",
  (() => {
    const m = comparisonTable.match(/isDemo\s*\?\s*\([\s\S]{0,400}?examples in this demo[\s\S]{0,200}?\)\s*:\s*\(/);
    return !!m;
  })());
check("affiliate disclosure no longer claims 'it costs you nothing extra'",
  !/costs you nothing extra/.test(affiliateLink));
check("affiliate disclosure neutral wording present",
  /we may earn a\s+commission\s+from the merchant/.test(affiliateLink));

// --- Invariant 2: demo context is required, never optional -------------------
check("ArticleRenderer requires isDemo",
  /isDemo:\s*boolean\s*}/.test(renderer) || /isDemo\s*:\s*boolean/.test(renderer));
check("ComparisonTable requires isDemo",
  /isDemo:\s*boolean/.test(comparisonTable));
check("MerchantOffer accepts isDemo prop (default false)",
  /isDemo\??:\s*boolean/.test(merchantOffer));
for (const [name, src] of Object.entries(callSites)) {
  check(`ArticleRenderer call site (${name}) passes article.isDemo`,
    /<ArticleRenderer[^>]*articleSlug=\{article\.slug\}[^>]*\bisDemo=\{article\.isDemo\}/.test(src));
}
check("compare page passes isDemo to ComparisonTable",
  /<ComparisonTable[^>]*\bisDemo=\{article\.isDemo\}/.test(callSites.compare));
// Every <MerchantOffer> call site must thread demo context (deals computes it,
// article-renderer forwards it, review sidebar uses article.isDemo).
const merchantCallSites = {
  deals: dealsPage,
  reviews: callSites.review,
  renderer,
};
for (const [name, src] of Object.entries(merchantCallSites)) {
  check(`<MerchantOffer call site (${name}) threads isDemo`,
    /<MerchantOffer[^>]*\bisDemo=\{/.test(src));
}

// --- Invariant 3: /deals production hygiene ----------------------------------
check("/deals never exposes seed:demo to visitors",
  !/seed:demo|seed:demo`/.test(dealsPage));
check("/deals never claims prices via new Date()",
  !/new Date\(\)/.test(dealsPage));
check("/deals empty state is truthful ('No active deals right now')",
  /No active deals right now\./.test(dealsPage));
check("/deals demo source uses demo_mode setting",
  /settings\[["']demo_mode["']\]\s*===\s*["']true["']/.test(dealsPage));
check("/deals per-offer demo falls back to article.isDemo",
  /offer\.article\?\.isDemo|article\.isDemo/.test(dealsPage));

check(`guard file self-declares its count (${passed} checks)`, passed > 0);
console.log(`\n${passed} CTA-readiness structural checks passed.`);
process.exit(process.exitCode ?? 0);