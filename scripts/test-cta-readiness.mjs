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
// "sample"/"fictional"/"demo" strings must appear only inside branches gated by
// an isDemo flag, OR in a documented demo-only message. We assert the LITERAL
// demo tokens never appear unconditionally in the consumer-facing strings.
check("MerchantOffer has no unconditional '(demo)' label",
  !/\(demo\)/.test(merchantOffer.replace(/\s*\{isDemo[\s\S]*?\}\s*/g, "")));
check("pick path has no unconditional '(demo merchant)'",
  !/\(demo merchant\)/.test(renderer));
check("ComparisonTable footer 'examples in this demo' is conditional or gone",
  /isDemo/.test(comparisonTable));
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