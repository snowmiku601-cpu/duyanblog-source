# CTA Production Readiness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this
> plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Duyan commerce surface present real content as real and demo content as
visibly fictional — driven by the existing `Article.isDemo` truth, without a schema change,
while rendering `pick.imageUrl` and making the affiliate disclosure verifiable.

**Architecture:** `Article.isDemo` (already used for `DemoNotice` + `noIndex`) becomes a
REQUIRED `isDemo: boolean` prop on `ArticleRenderer` and `ComparisonTable`, threaded from all
five article route call sites. `MerchantOffer`/`ComparisonOffer` gain an optional `isDemo`
prop (default `false`), so offer cards render "sample/fictional" wording only when the
enclosing article (or `/deals` page-level `demo_mode`) is demo. `/deals` sources
`settings["demo_mode"] === "true"` OR `offer.article?.isDemo` and loses its seed-CLI empty
state and fabricated "checked today" date. Affiliate disclosure drops the unverifiable
"it costs you nothing extra" for neutral wording. `pick.imageUrl` renders as a decorative
`alt=""` image inside the existing card (schema has no truthful alt field).

**Tech Stack:** Next.js 16 App Router (React 19 server components), TypeScript strict, Tailwind 4,
Prisma 6, Zod 4. Tests: existing `scripts/smoke.mjs` (running-server rendered checks) plus a new
structural guard `scripts/test-cta-readiness.mjs` following the `test-newsletter-semantics.mjs`
pattern (deterministic, no framework added).

**Spec:** `docs/superpowers/specs/` — approved in-chat design (bounded path), amendments 1–6.
No schema change. No migration. No production DB write.

## Global Constraints

- `Article.isDemo` is the single article-level demo source of truth. No new Prisma field or
  migration.
- `isDemo` on `ArticleRenderer` is a REQUIRED prop (fail-closed); every call site passes
  `article.isDemo` explicitly.
- "it costs you nothing extra" must not appear anywhere on the site — use: "we may earn a
  commission from the merchant. It never changes our verdicts".
- `rel="sponsored noopener"` and `/go/OFFER_ID` routing are unchanged — never weaken.
- Demo wording is not deleted wholesale; demo content stays unmistakably labelled. Real
  content must never say "demo".
- No fabricated data (prices, ratings, review counts, badges, alt-text). A sparse real card
  beats a fabricated rich card.
- No raw merchant URL in article prose; `go:OFFER_ID` only.
- `/deals` must never expose `seed:demo` to visitors, and never claim a price-check date from
  `new Date()`. Neutral wording: "Deals can change without notice. Check the merchant page for
  current price and availability."
- Production must never receive demo seed.

## Review Focus

1. A future `ArticleRenderer`/`ComparisonTable` caller might omit demo state → compile-time
   failure, not silent real-looking demo. Covered by the required `isDemo` prop (Task 2/4)
   pinned by the structural guard (Task 1).
2. `/deals` on a demo site must still label every offer sample, and an offer attached to a
   demo article must stay labelled even when `demo_mode=false`. Pinned in Task 5.
3. An empty `/deals` in production must show a truthful empty state, never a seed/CLI
   instruction. Pinned in Task 5.
4. `pick` cards: image present (renders, no CLS) and image absent (intentional layout); alt
   never invented from `name`. Pinned by smoke (Task 3) + visual check (Task 8).
5. A real comparison must never show the demo-only footer; a demo comparison must. Pinned in
   Task 4 via the footer split + structural guard.

---

### Task 1: Structural CTA-readiness guard (deterministic, no server)

**Files:**
- Create: `scripts/test-cta-readiness.mjs`
- Modify: `package.json` (add `"test:cta": "node scripts/test-cta-readiness.mjs"`)

**Interfaces:**
- Produces: `npm run test:cta` → exit 0 when every listed invariant holds; read-only over
  source. Later tasks satisfy its assertions.

- [ ] **Step 1: Write the failing structural guard**

```js
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
```

- [ ] **Step 2: Run it, expect failures (guard + no assertions yet → exit clean but empty).**
  Then add the real assertions in steps 3–5.

- [ ] **Step 3: Assert demo indicators are only behind a conditional (never unconditional).**

```js
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
  /we may earn a commission from the merchant/.test(affiliateLink));
```

- [ ] **Step 4: Assert `isDemo` is a REQUIRED prop everywhere and threaded correctly.**

```js
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
```

- [ ] **Step 5: Assert /deals hygiene (no seed CLI, no fabricated date, demo source wired).**

```js
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
```

- [ ] **Step 6: Finalize and wire package.json.**

```jsonc
// package.json scripts: add
"test:cta": "node scripts/test-cta-readiness.mjs"
```

```js
check(`guard file self-declares its count (${passed} checks)`, passed > 0);
console.log(`\n${passed} CTA-readiness structural checks passed.`);
process.exit(process.exitCode ?? 0);
```

- [ ] **Step 7: Run `npm run test:cta` — expect FAILs on Invariants 2–3 (props not yet wired).**
- [ ] **Step 8: Commit** (guard only, expected failing) — message `test: add CTA-readiness structural guard`.

---

### Task 2: Make demo context required and thread it (renderer passes it down)

**Files:**
- Modify: `src/components/editorial/article-renderer.tsx` (props + pick/offerEmbed/comparisonEmbed + pick card render)
- Modify: `src/components/affiliate/merchant-offer.tsx` (`isDemo` prop on MerchantOffer + ComparisonOffer + demo label)
- Modify (call sites): `src/app/reviews/[slug]/page.tsx`, `src/app/best/[slug]/page.tsx`,
  `src/app/compare/[slug]/page.tsx`, `src/app/guides/[slug]/page.tsx`, `src/app/articles/[slug]/page.tsx`
- Modify: `src/app/compare/[slug]/page.tsx` (ComparisonTable `isDemo`)

**Interfaces:**
- Consumes: `Article.isDemo` on every route's `article` row.
- Produces: `ArticleRenderer({ blocks, articleSlug, isDemo, ... })` REQUIRED;
  `ComparisonTable({ items, articleSlug, caption, isDemo, ... })` REQUIRED;
  `MerchantOffer({ offer, articleSlug, compact, isDemo?, className })`;
  `ComparisonOffer({ offer, articleSlug, isDemo? })` (used by pick + pick uses it directly).

- [ ] **Step 1: merchant-offer.tsx — add `isDemo` prop + conditional sample label.**

```tsx
export function MerchantOffer({ offer, articleSlug, compact = false, isDemo = false, className }) {
  // ...existing header/price/note...
  {isDemo && (
    <span className="text-xs font-medium uppercase tracking-wide text-ochre">Sample offer · fictional data</span>
  )}
  {!isDemo && (
    <span className="text-xs text-muted-foreground">on {offer.merchantName}</span>
  )}
  // ...the CTA stays as-is (rel="sponsored noopener" unchanged)...
  {!compact && <AffiliateDisclosure className="mt-4 border-t border-border pt-3" />}
}
```

`ComparisonOffer` gains `isDemo = false` and renders `{isDemo ? "Sample data" : ...}` nothing
extra — its CTA text stays `Check price` / `Get it — ${price}`.

- [ ] **Step 2: article-renderer.tsx — add REQUIRED `isDemo`, thread through.**

```tsx
export async function ArticleRenderer({ blocks, articleSlug, className, dropCap = false, isDemo }: {
  blocks: Block[];
  articleSlug?: string;
  className?: string;
  dropCap?: boolean;
  isDemo: boolean; // REQUIRED — fail closed: a caller cannot omit demo state
}) {
```

Case `pick`: pass `isDemo` to `ComparisonOffer`, drop "(demo merchant)" → conditional sample chip:
```tsx
<ComparisonOffer offer={offer} articleSlug={articleSlug} isDemo={isDemo} />
{offer.price && <span className="font-medium text-foreground">{offer.price}</span>}
<span className="text-xs text-muted-foreground">via {offer.merchantName}</span>
{isDemo && <span className="text-xs font-medium uppercase tracking-wide text-ochre">sample data</span>}
```
Case `offerEmbed`: `<MerchantOffer ... isDemo={isDemo} />`. Case `comparisonEmbed`:
`<ComparisonTable ... isDemo={isDemo} />`.

Also render `pick.imageUrl` (Task 3 adds the block; this task wires the prop).

- [ ] **Step 3: all five call-site pages pass `article.isDemo` to ArticleRenderer, and compare passes it to ComparisonTable.**

```tsx
<ArticleRenderer blocks={blocks} articleSlug={article.slug} isDemo={article.isDemo} />
<ComparisonTable items={comparisonItems} articleSlug={article.slug} caption={article.comparison?.title ?? article.title} isDemo={article.isDemo} />
```

- [ ] **Step 4: run `npm run test:cta` — expect all Invariant 2 checks to pass now.**
- [ ] **Step 5: `npm run lint && npm run typecheck`** — expect clean.
- [ ] **Step 6: Commit** — `feat(cta): thread required isDemo demo context through commerce surfaces`.

---

### Task 3: Pick card — render `imageUrl` and keep image-absent layout intentional

**Files:**
- Modify: `src/components/editorial/article-renderer.tsx` (pick block)

**Interfaces:**
- Consumes: `pick.imageUrl` (schema-supported since content-schema.ts).
- Produces: rendered `<Image src={block.imageUrl} alt="" .../>` in the pick header when present.

- [ ] **Step 1: In the `pick` case, render the image in the header row.**

```tsx
{block.imageUrl && (
  <div className="relative ml-auto h-16 w-24 shrink-0 overflow-hidden rounded-sm border border-border bg-muted md:h-20 md:w-28">
    <Image
      src={block.imageUrl}
      alt=""                       // decorative: schema has no truthful alt field; the product
      fill                         // name sits in adjacent text (content-integrity: never invent alt)
      sizes="112px"
      className="object-cover"
    />
  </div>
)}
```

Place it in the flex header next to rank+badge/name. When absent, the header keeps the exact
current layout (rank + name), so image-absent never looks broken.

- [ ] **Step 2: `npm run lint && npm run typecheck`** — clean.
- [ ] **Step 3: Commit** — `feat(cta): render pick.imageUrl with decorative alt in pick cards`.

---

### Task 4: ComparisonTable demo-aware footer

**Files:**
- Modify: `src/components/comparison-table.tsx`

**Interfaces:**
- Consumes: `isDemo: boolean` prop (REQUIRED).
- Produces: footer text that is demo-aware — never "examples in this demo" on a real
  comparison; labelled sample on a demo one.

- [ ] **Step 1: Add `isDemo` required prop and branch the footer.**

```tsx
export function ComparisonTable({ items, articleSlug, caption, isDemo, className }) {
  // ...
  <p className="border-t border-border px-4 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
    {isDemo ? (
      <>Buy links are affiliate links — we may earn a commission. Prices and availability are shown as examples in this demo.</>
    ) : (
      <>Buy links are affiliate links — we may earn a commission if you buy through them. Check the product page for current price and availability.</>
    )}
  </p>
```

- [ ] **Step 2: ensure the `compare` call site (Task 2) already passes `isDemo`.**
- [ ] **Step 3: `npm run lint && npm run typecheck`** — clean.
- [ ] **Step 4: Commit** — `feat(cta): make comparison table footer demo-aware`.

---

### Task 5: /deals demo source of truth + production hygiene

**Files:**
- Modify: `src/app/deals/page.tsx`

**Interfaces:**
- Consumes: `getSiteSettings()` (already imported? no — add import), `offer.article?.isDemo`.
- Produces: `pageDemoMode = settings["demo_mode"] === "true"`; per-offer
  `isDemo={pageDemoMode || offer.article?.isDemo === true}`.

- [ ] **Step 1: import `getSiteSettings`, read demo_mode, thread into MerchantOffer.**

```tsx
import { getSiteSettings } from "@/lib/settings";
// in the page:
const settings = await getSiteSettings();
const pageDemoMode = settings["demo_mode"] === "true";
// per offer card:
<MerchantOffer offer={offerToView(offer)} articleSlug={offer.article?.slug}
  isDemo={pageDemoMode || offer.article?.isDemo === true} className="flex-1" />
```

- [ ] **Step 2: production-hygiene copy fixes.**

Empty state → truthful:
```tsx
<p className="rounded-md border border-dashed border-border p-8 text-sm text-muted-foreground">
  No active deals right now.
</p>
```
Footer → neutral + sample statement only when `pageDemoMode`:
```tsx
<p className="mt-10 text-xs text-muted-foreground">
  Deals can change without notice. Check the merchant page for current price and availability.
  {pageDemoMode && <> Merchants, offers and discounts on this page are fictional sample data.</>}
</p>
```
- [ ] **Step 3: `npm run test:cta`** — Invariant 3 all pass.
- [ ] **Step 4: `npm run lint && npm run typecheck`** — clean.
- [ ] **Step 5: Commit** — `feat(cta): source /deals demo status from demo_mode + article.isDemo; remove seed CLI + fabricated date`.

---

### Task 6: Affiliate disclosure — neutral, verifiable wording

**Files:**
- Modify: `src/components/affiliate/affiliate-link.tsx`

**Interfaces:**
- Produces: `AffiliateDisclosure` box variant with no "it costs you nothing extra".

- [ ] **Step 1: Replace the box-variant wording.**

```tsx
<aside aria-label="Affiliate disclosure" ...>
  <p className="eyebrow text-muted-foreground">Why there are buy links here</p>
  <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
    Some links on this page are affiliate links. If you buy through them, we may earn a
    commission from the merchant. It never changes our verdicts, which follow our{" "}
    <Link href="/methodology" ...>published methodology</Link>{" "}
    and <Link href="/how-we-make-money" ...>business rules</Link>.
  </p>
</aside>
```
(Inline variant at `affiliate-link.tsx:79` already says "we may earn a commission if you buy
through links… It never changes our verdicts." — no "costs you nothing" there; keep it.)

- [ ] **Step 2: `npm run test:cta`** — disclosure checks pass.
- [ ] **Step 3: `npm run lint && npm run typecheck`** — clean.
- [ ] **Step 4: Commit** — `feat(cta): neutral affiliate disclosure wording (no unverifiable claim)`.

---

### Task 7: Extend smoke to rendered demo behavior

**Files:**
- Modify: `scripts/smoke.mjs`

**Interfaces:**
- Consumes: running server with demo seed (`npm run seed:demo` local).
- Produces: rendered-behavior assertions over the real demo pages.

- [ ] **Step 1: Add checks (demo seed is all `isDemo=true`):**

```js
// Rendered demo behavior (demo seed): demo labelling present, real leak absent on the
// SEO surface. best-esim-providers pick cards must render image + sample wording,
// NOT bare "(demo merchant)" or a real-looking "via X".
try {
  const res = await fetch(`${BASE}/best/best-esim-providers`);
  const html = await res.text();
  const ok = res.status === 200
    && html.includes('(sample)')          // sample chip on demo pick/offer
    && /<img[^>]*src=["']\/images\/(nomadlink|terrasim|waveline)\.png/.test(html) // pick imageUrl renders
    && !html.includes('(demo merchant)')  // old hardcoded label gone
    && !html.includes('seed:demo');       // no seed instruction on a page
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status}  /best/best-esim-providers demo pick labels + image`);
  if (!ok) failed += 1;
} catch (err) { console.log(`FAIL  ERR  /best/best-esim-providers  ${err.message}`); failed += 1; }
```

```js
// /deals demo page: sample statement present, no seed CLI, no fabricated "checked today".
try {
  const res = await fetch(`${BASE}/deals`);
  const html = await res.text();
  const ok = res.status === 200
    && html.includes('fictional sample data')
    && !html.includes('seed:demo')
    && !html.includes('prices were accurate when');
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status}  /deals demo labelling + hygiene`);
  if (!ok) failed += 1;
} catch (err) { console.log(`FAIL  ERR  /deals  ${err.message}`); failed += 1; }
```

Note: with the all-demo seed there is no real rendered surface to hit; the structural guard
(Task 1) proves real-path wording is conditional on `isDemo`. That is the designed split:
smoke proves demo still labelled; guard proves real cannot leak.

- [ ] **Step 2: Run against a running dev server with demo seed; 47 existing + 2 new pass.**
- [ ] **Step 3: Commit** — `test(cta): smoke demo pick/deals labelling + hygiene`.

---

### Task 8: Visual verification (bounded)

**Files:** none committed (screenshots are read then deleted per agent-routing vision rule).

- [ ] **Step 1: Run `npm run dev`; open `/best/best-esim-providers` desktop (1280) + mobile (375), light + dark.**
  Screenshot pick cards image-present and an image-absent pick (temporarily edit a local copy or
  use a guide page's pick if any). Confirm:
  - no overflow; image geometry intact (aspect-box, not squashed)
  - rank/badge/name hierarchy clear; CTA visible; demo warning not overpowering
  - real-candidate card (image-absent) still looks intentional
- [ ] **Step 2: If the repo has no usable browser tooling this session, report that honestly**
  (no new screenshot framework installed).

---

## Self-Review

- **Spec coverage:** Amendment 1 (required `isDemo`) → Task 1 (guard) + Task 2 (props/threading).
  Amendment 2 (/deals source) → Task 5. Amendment 3 (no new component) → Task 2 uses existing
  `ComparisonOffer`. Amendment 4 (/deals bugs) → Task 5. Amendment 5 (disclosure) → Task 6.
  Amendment 6 (pick image alt="") → Task 3. Real/demo table → Tasks 2–6. TDD/smoke → Tasks 1
  and 7. PR → handoff.
- **Placeholder scan:** all steps carry concrete code; no "TBD"/"similar to task X".
- **Type consistency:** `isDemo: boolean` consistent across renderer/table/offer props; pick
  case checks `block.imageUrl` string; smoke regexes match seed slugs/images.
- **Review Focus pins:** #1 → Task 1 guard + Task 2 props; #2/#3 → Task 5 (/deals) + Task 1
  guard; #4 → Task 3 + Task 8; #5 → Task 4 + guard. All five have tests.

**Execution method:** Native (executing-plans) — tasks share interfaces tightly (the guard
asserts what later tasks ship), small 6-code-task branch, cheap to re-run gates.