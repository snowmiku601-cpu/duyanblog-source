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
  "how-we-make-money affiliate copy is conditional (When an article includes …), not active",
  /When an article includes affiliate links/.test(policies),
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
// 4. FALSE CURRENT-REVENUE / AFFILIATE-GUARANTEE LANGUAGE — public copy
// ---------------------------------------------------------------------------
// The launch state has zero AffiliateOffers, zero /go/ links, no subscriptions,
// no advertising. Public copy must not claim any of these currently fund the
// site, and must not make blanket price guarantees for a future program.
const homepage = read("src/app/page.tsx");
const about = read("src/app/about/page.tsx");
const siteLib = read("src/lib/site.ts");
const footer = read("src/components/site-footer.tsx");

check(
  "homepage does NOT claim current commissions 'when you buy through our links'",
  !/we may earn a commission when you buy through our links/.test(homepage),
  "homepage hero must be current/future-neutral (no active affiliate links today)",
);
check(
  "homepage does NOT assert 'Here is exactly how that works' over a current revenue claim",
  !/we may earn a commission when you buy through our links[\s\S]{0,120}Here&apos;s exactly how that works/.test(homepage),
  "homepage revenue sentence must be neutral, not a promise about active links",
);
check(
  "About metadata does NOT claim 'reader-supported publication' as current state",
  !/independent, reader-supported publication/.test(about),
  "About description must not assert a current reader-support model",
);
check(
  "About card does NOT claim 'Commissions and subscriptions fund the work'",
  !/Commissions and subscriptions fund the work/.test(about),
  "no unverified current funding model on /about",
);
check(
  "publisherNote does NOT start with an unsupported 'Reader-supported.' assertion",
  !/publisherNote: "Reader-supported\./.test(siteLib),
  "publisherNote must not claim a funding model the site does not currently have",
);
// Task 50 (review round): no published review has ever carried a second
// editor (reviewerId null across the board), so About must not assert the
// dual-editor process as an unconditional current practice — only the
// conditional "we identify that reviewer" form is truthful.
check(
  "About does not claim a standing second-editor review process",
  !/a second\s*\n?\s*editor who checks|and, for reviews, a second/.test(about),
  "reviewer records do not substantiate a standing dual-editor process",
);
check(
  "About keeps the conditional second-editor wording",
  /Where a review has been\s*\n?\s*checked by a second editor, we identify that reviewer/.test(about),
  "the truthful conditional must remain on /about",
);
check(
  "footer does not assert commissions from existing links",
  !/we may earn a commission when you buy through links on this site/.test(footer),
);
check(
  "how-we-make-money description does NOT frame affiliate commissions + subscriptions as the current business model",
  !/business model: affiliate commissions and subscriptions/.test(policies),
  "how-we-make-money description must be current/future-neutral",
);
check(
  "how-we-make-money intro does NOT claim 'Here is exactly how we pay for it'",
  !/Here is exactly how we pay for it/.test(policies),
  "intro must not imply a current funding stream",
);
check(
  "affiliate copy does NOT promise 'at no extra cost to you'",
  !/at no extra cost to you/.test(policies),
  "blanket no-extra-cost promise on a future program cannot be guaranteed",
);
check(
  "affiliate copy does NOT promise 'the price you pay is the same' or 'sometimes better'",
  !/The price you pay is the same|sometimes better, when we negotiate a deal/.test(policies),
  "blanket same-price / sometimes-better promise cannot be guaranteed",
);

check(
  "site header utility strip does NOT claim 'Reader-supported' as current state",
  !/Independent · Reader-supported/.test(read("src/components/site-header.tsx")),
  "header trust strip must not assert a funding model the site does not currently have",
);
check(
  "homepage does NOT claim 'Affiliate revenue funds the site' as current state",
  !/Affiliate revenue funds the site/.test(homepage),
  "no current affiliate-revenue claim — the site has zero affiliate revenue today",
);

check(
  "homepage deals copy does NOT promise 'never change the price you pay'",
  !/never change the price you pay|never changes the price|does not affect the price|won.t cost more/.test(homepage),
  "a future affiliate program cannot promise customer prices are unaffected",
);

// ---------------------------------------------------------------------------
// 5. BUSINESS TRANSPARENCY (Task 50) — About/Contact truthfulness + affiliate-ready copy
// ---------------------------------------------------------------------------
// Google Ads Business Operations Verification flagged two transparency gaps:
// the About page named no operator or business contact, and the Contact page
// advertised a display-ads business ("we sell placements", "media kit") that
// does not exist. Guards below pin the corrected state. Ownership wording IS
// asserted: the owner explicitly confirmed that Nguyễn Thị Duy An owns and
// operates Duyan Blog, and the exact authorized attribution is required
// exactly once (see the Task 50.1 checks at the end of this section).

const contact = read("src/app/contact/page.tsx");
const contactEmail = "duyantresosinh@gmail.com";
const mailto = `mailto:${contactEmail}`;

const EMAIL_RE = /duyantresosinh@/;
const MAILTO_RE = new RegExp(
  `href=["']${mailto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`
);

check(
  "About page shows the business contact email with a clickable mailto",
  EMAIL_RE.test(about) && MAILTO_RE.test(about),
  "the approved project contact email must be present and clickable",
);
check(
  "Contact page shows the business contact email with a clickable mailto",
  EMAIL_RE.test(contact) && MAILTO_RE.test(contact),
  "the approved project contact email must be present and clickable",
);

check(
  "Contact page does NOT claim display placements are currently sold",
  !/We sell (clearly-labelled )?placements/.test(contact),
  "the site does not sell display advertising today — present tense is false",
);
check(
  "Contact page does NOT reference a media kit",
  !/media kit/i.test(contact),
  "no media kit exists — offering one implies a product that isn't there",
);

check(
  "Contact advertising copy states display ads are not currently sold",
  /not currently sell/i.test(contact),
  "the corrective present-tense statement must exist once, truthfully",
);
check(
  "Contact advertising copy promises future arrangements stay disclosed and never decide verdicts",
  /clearly disclosed/i.test(contact) && /never (be )?(determine|decide)/i.test(contact),
  "future-proof sponsorship commitment required in Contact copy",
);

check(
  "About/Contact never include Ads account IDs, payments or credentials",
  // ID patterns are case-sensitive (G-[A-Z0-9] under the i flag would match
  // "g-disclosure"); the English terms are checked case-insensitively.
  !/AW-\d{8,}|G-[A-Z0-9]{6,}/.test(about + contact) &&
  !/Payments|OAuth|customer ID/i.test(about + contact),
  "internal Google identifiers must never appear on public pages",
);

// Affiliate-ready policy wording — evergreen conditionals, no brittle current-state.
check(
  "affiliate policy intro uses evergreen conditional wording (no brittle 'currently no affiliate links')",
  !/There are currently no affiliate links/.test(policies),
  "the sentence breaks the day the first affiliate link ships",
);
check(
  "how-we-make-money intro does not bundle 'no ads or affiliate links' as current state",
  !/We do not currently run ads or affiliate links/.test(policies),
  "one brittle sentence forces rewrites of evergreen policy on every affiliate addition",
);
check(
  "affiliate policy keeps the conditional 'when an article includes affiliate links' framing",
  /When an article includes affiliate links/.test(policies),
  "the evergreen mechanism description must remain",
);
check(
  "affiliate policy does not claim commissions currently fund the site",
  !/affiliate (revenue|commissions) (currently )?fund/i.test(policies),
  "no evidence of current affiliate revenue",
);
check(
  "affiliate policy does not guarantee merchant prices are unchanged",
  // Word orders caught: "never change the price you pay", "the price you pay
  // never changes", "the price you pay is never affected/unaffected".
  !/(never|does not|doesn.t) (change|affect)[a-z]* (the )?price you pay/i.test(policies) &&
  !/price you pay (are |is )?(never|does not|doesn.t) (change[a-z]*|affected|unaffected)/i.test(policies),
  "merchants control prices — blanket price guarantees are unverifiable",
);
check(
  "affiliate policy does not name affiliate partners, rates or sponsorship packages",
  !/(commission rate of|partner(s)? include|sponsorship packages? (are|start)|rate card)/i.test(policies),
  "no invented partnerships, rates or packages",
);

// Task 50.1: the owner explicitly confirmed "NGUYỄN THỊ DUY AN directly owns
// and operates Duyan Blog" — the exact attribution is now AUTHORIZED and
// REQUIRED, exactly once, with Unicode diacritics. What stays banned: any
// beyond-evidence escalation (registered company, tax ID, credentials) and
// any equation of the confirmed owner with the editorial byline Duy An Tran.
const OWNERSHIP_STATEMENT =
  "owned and operated by Nguyễn Thị Duy An, an individual based in Vietnam";
// The statement may be split by inline markup (<strong> around the name) in
// JSX source — normalize tags/whitespace before matching the exact wording.
const normalize = (s) =>
  s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").replace(/\s*([,.])\s*/g, "$1 ").trim();
const ownershipNormalized = normalize(about);

check(
  "About carries the authorized ownership statement exactly once (Unicode name)",
  (ownershipNormalized.match(new RegExp(normalize(OWNERSHIP_STATEMENT), "g")) ?? []).length === 1,
  "the statement must appear exactly once, matching the owner-authorized wording with diacritics",
);
check(
  "About ownership stays within evidence (no company/tax/credential escalation)",
  !/(registered (corporation|company)|business registration|tax identification|certified|award)/i.test(about),
  "owner confirmed ownership+operation only — no legal-entity or credential claims",
);

// Author identity stays untouched — owner confirmed website ownership only,
// NOT any relation between Nguyễn Thị Duy An and the byline Duy An Tran.
check(
  "About copy never equates the byline (Duy An Tran) with the owner name",
  !/Duy An Tran[^.]{0,80}(Nguyễn Thị|owner|operator)|Nguyễn Thị Duy An[^.]{0,80}(Duy An Tran|pen name|byline)/.test(about),
  "owner identity and editorial byline are separate concepts",
);

// ---------------------------------------------------------------------------
console.log(`\n${passed} pass, ${failed} fail`);
if (failed > 0) process.exitCode = 1;