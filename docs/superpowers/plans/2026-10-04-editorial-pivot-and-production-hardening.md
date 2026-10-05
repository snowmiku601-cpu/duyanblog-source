# Editorial Pivot to Research-Led Reviews + Production Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended for this repository). Main Claude implements sequentially; no fresh-agent-per-task fanout; the repository cap is **two subagents total** (`.claude/rules/agent-routing.md`). At most ONE independent hostile reviewer for the final branch review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-position duyanblog.com from a fictional "hands-on testing" publication into a research/evidence-led review publication, and clear the confirmed production blockers (non-inverting dark-mode band/footer, staging-vs-production indexing, rate-limit IP-spoof bypass with an account-scoped backstop, stored-XSS SVG uploads, newsletters that cannot confirm, unlabelled editorials) so the site is ready for real content, real affiliate — and, **only after a separate authorized AdSense integration**, advertising.

**Architecture:** Single branch; main Claude executes tasks sequentially. Workstream A makes the editorial model truthfully research/evidence-led (copy, seeds, methodology, policies, SEO — no invented first-hand testing). Workstream B hardens production with one confirmed defect per task. Demo state is data-driven via `Article.isDemo` (the single source of truth, through templates, sitemap/feeds, review-schema and noindex). Schema stays minimal: `SourceCitation.checkedAt` (date-only) + `Article.isDemo` (boolean, default false); nothing larger. The gate runs after every code-changing task.

**Tech Stack:** Next.js 16 (security floor first — Task 1), React 19, TypeScript strict, Tailwind 4 with **real theme color tokens** (`--color-*` in `src/app/globals.css`, per Correction 1), Prisma 6 + MySQL (one baseline `20261004000000_init`), Zod 4, scrypt auth, `src/proxy.ts` redirect service, Playwright MCP for non-visual verification, Hostinger Business deploy (`.claude/playbooks/deploy-hostinger.md`).

**Spec:** Audit + planning session of 2026-10-04 (two read-only audit agents + main-agent live verification) and the 20 correction requirements. The plan argues from the audit — every task traces to a confirmed finding.

## Global Constraints

- **Copy is English on the site, docs, code and seeds; chat is Vietnamese** (CLAUDE.md R0).
- **Budget ratchet:** `.claude/CLAUDE.md` + `.claude/rules/` + `AGENTS.md` stay under 24 KB (`npm run validate:docs`). No auto-loading-rule prose added by any task.
- **The gate before any commit:** `npm run lint && npm run typecheck`, then `npm run validate:docs && npm run slop`; if code changed, `npm run build` then `npm run test` against a running dev server.
- **Never seed a User; never bypass `ALLOW_DEMO_SEED` / `ALLOW_ADMIN_BOOTSTRAP`** (admin-safety). `seed:demo` is wipe-and-insert and never runs in a build/production pipeline (playbook non-negotiable 3).
- **Every admin mutation revalidates** (`revalidatePath()` / `invalidateSettingsCache()`) or edits stay invisible up to 300 s (admin-safety §5).
- **No fabricated numbers/claims/sources outside the labelled demo seed** (content-integrity). After this plan even demo content stops *implying* first-hand testing as fact.
- **MySQL-canonical schema, one baseline migration; every schema change is a new versioned migration applied with `npm run db:migrate` before any build.**
- **Production deps only on the host** (playbook non-negotiable 4); anything build/runtime-critical stays in `dependencies`.
- **Vision rule:** no screenshot interpretation by a text-only route. Visual fixes are token/CSS fixes verified by computed style; `snapshot/` captures, when taken, are read only by `duyan-vision-reader`. `deepseek-v4-flash`/`deepseek` never receives image input. (`IMAGE READ FAILURE` → continue on non-visual evidence.)
- **No Redis / no object storage in this MVP; no new dependency creep.**
- **Implementable by ONE main Claude sequentially.** No task requires parallel agents.

## Review Focus

Five failure modes the audit implies, pinned to tasks and verified by probe or smoke:

1. **Dark mode must still be readable on the methodology band and footer** — band is intentionally non-inverting (Correction 1). Verified by computed-style probe in both themes in Task 2; semantic-contrast check is part of READY-FOR-REAL-CONTENT.
2. **Life/`robots.txt` must not deindex production; staging must not advertise production sitemaps.** Fail-closed via `ALLOW_INDEXING` (Correction 2). Acceptance is semantic, not byte-identical (Task 3).
3. **A spoofed `X-Forwarded-For` must not reset the admin-login limiter.** IP/edge bucket + normalized-email bucket, so rotating a spoofed XFF cannot produce unlimited attempts against one account (Correction 3). Live controls prove 429 holds.
4. **No uploaded file may execute as script on the served origin.** SVG uploads are disabled raster-only; existing uploaded SVGs are audited and removed/quarantined (Corrections 4). Trusted source-controlled `public/logo/*.svg` remains.
5. **Demo fiction must never leak to crawler surfaces anywhere.** `Article.isDemo` gates noindex, sitemap, feeds, and review schema uniformly (Corrections 5–6); smoke asserts demo slugs absent from sitemap/feed and no `Review` schema on demo pages.

---

## Task 1: Next.js security floor (verify current stable at implementation time)

The audit checked `node_modules/next` = **16.1.3**. The official stable line is newer; **at implementation time, verify the current official stable/patched Next.js release** (official Next.js security/release info), then upgrade to that patched stable (never canary/prerelease), regenerate the npm lockfile, and run all gates. Also normalize the toolchain toward Node 22 + npm + `package-lock.json`, and remove the stale foreign `bun.lock` (scaffold `nextjs_tailwind_shadcn_ts`; Hostinger runs npm, not Bun) rather than maintain two lockfiles for symmetry.

**Files:** `package.json` (next + eslint-config-next), `package-lock.json` (regenerated), remove `bun.lock`.

**Interfaces:** produces a `node_modules/next@<patched stable>` that later tasks build against.

- [ ] **Step 1: Check current state** — `node -e "console.log(require('./node_modules/next/package.json').version)"` → likely `16.1.3`.
- [ ] **Step 2: Fetch the current official stable** — `npm view next version` (and consult the Next.js security/changelog). Record the number actually used in the commit message.
- [ ] **Step 3: Bump + install** — set the resolved version in `package.json` (+ `eslint-config-next`); `npm install` regenerates `package-lock.json`.
- [ ] **Step 4: Remove `bun.lock`** if the host/npm build is the source of truth (verify no script references bun at build time) — `git rm bun.lock`.
- [ ] **Step 5: Verify install** — `node -e "console.log(require('./node_modules/next/package.json').version)"` equals the recorded stable.
- [ ] **Step 6: Fast gate** — `npm run lint && npm run typecheck` (exit 0).
- [ ] **Step 7: Full gate** — `npm run build && npm run test` (build passes, smoke ≥50).
- [ ] **Step 8: Commit** — `fix(security): upgrade Next.js to <version> (patched stable)`. Rollback: `git checkout -- package-lock.json` + `npm ci`.

## Task 2: Real dark-mode color tokens for the band and footer (non-inverting)

The live computed-style probe proved the band renders light-on-light in dark mode (`bg oklch(0.93)` = `color oklch(0.93)`) because `--ink` inverts while the text is a hardcoded light literal. **Use real Tailwind theme color tokens — not a fragile `@utility` scheme** (Correction 1).

**Files:** globals.css; `src/app/page.tsx` (lines 383, 400, 406, 409); `src/components/site-footer.tsx`; `src/components/editorial/section-heading.tsx` (remove dead `dark` prop, zero call sites verified).

**Interfaces:** produces `--color-band-bg` / `--color-band-fg` (plus soft variants) usable as `bg-band-bg`, `text-band-fg`, `text-band-fg/70`, `bg-band-fg/15`.

- [ ] **Step 1: Define theme tokens** — in `:root` and `.dark`, add **CSS variables mapped through the Tailwind 4 theme mapping** (the file already maps `--color-sun`, `--color-vermilion`, `--color-ink`, etc. under the `@theme` block / `:root` near lines 100–117; add the band pairs in the same mapping):
  ```css
  /* Light: dark ink band, cream text. Dark: still dark band, cream text. */
  --band-bg: oklch(0.252 0.02 55);      /* dark panel both themes */
  --band-fg: oklch(0.93 0.012 82);      /* cream text */
  --band-fg-soft: oklch(0.93 0.012 82 / 0.65);
  /* dark overrides: --band-bg becomes oklch(0.14 0.015 55); --band-fg/-soft unchanged */
  ```
  Register them in the Tailwind 4 theme color map in globals.css (the same place the existing `--color-*` vars are mapped) so `bg-band-bg`, `text-band-fg`, `text-band-fg/70`, `bg-band-fg/15`, `border-band-fg/15` all work.
- [ ] **Step 2: Point the homepage band** at the tokens (`page.tsx:383,400,406,409`): `bg-band-bg text-band-fg`, `bg-band-fg/15`, `text-band-fg-soft`.
- [ ] **Step 3: Point the footer** at the tokens (replace every `oklch(0.93…)` literal; drop `dark:bg-card`).
- [ ] **Step 4: Remove the dead `dark` prop** from `SectionHeading` (grep `dark={` → 0 after).
- [ ] **Step 5: Verify both themes with computed style (not pixels)** — Playwright `navigate` → `browser_evaluate` reading `getComputedStyle` and `window.matchMedia('(prefers-color-scheme: dark)')` (or toggle `.dark`), assert band stays dark-panel + cream-text in both themes and footer follows.
- [ ] **Step 6: Gate + commit.** Rollback: revert CSS/JSX.

## Task 3: Fail-closed indexing — `ALLOW_INDEXING=true` only on real production

Staging may block indexing; **production is the only place indexing is enabled, explicitly** (Correction 2). Do not guess from domain suffixes as the primary mechanism.

**Files:** `src/app/robots.ts`; `scripts/smoke.mjs` (semantic check only).

**Interfaces:** consumed by Task 3's production branch only; Task 12 reuses the same origin/flag helper.

- [ ] **Step 1: Rewrite `robots.ts`** — fail-closed:
  ```ts
  const ALLOW_INDEXING = process.env.ALLOW_INDEXING === "true";
  export default function robots() {
    if (!ALLOW_INDEXING) {
      return { rules: [{ userAgent: "*", disallow: "/" }] }; // localhost, preview, Hostinger staging, unknown clones
    }
    return {
      rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/admin/", "/api/", "/go/", "/search"] }],
      sitemap: `${site.url}/sitemap.xml`,
      host: site.url,
    };
  }
  ```
  - `.env.example`: `# ALLOW_INDEXING=true — set ONLY on the real production deployment. Unset/false ⇒ Disallow: / .`
  - Do not rely on `host.endsWith("hostingersite.com")`.
- [ ] **Step 2: Smoke check (semantic only)** — assert `robots.txt` returns 200 and, when `ALLOW_INDEXING` is unset, contains `Disallow: /`; when set, contains `Allow: /` + a `Sitemap:` line. **Not** byte-identical source-vs-live.
- [ ] **Step 3: Gate + commit.**
- [ ] **Step 4: Operator (not code)** — set `ALLOW_INDEXING=true` in the production env before the domain swap; leave it unset on the demo subdomain. Verify semantics after deploy: production allows + sitemap; staging blocks.

Rollback: revert `robots.ts`.

## Task 4: Rate limiter — stop trusting a spoofable IP; add an account-scoped bucket

The audit confirmed **no auth bypass** (login still verifies scrypt on `db.user.findUnique`; the defect is IP attribution only): `clientIp()` reads the first hop of raw `XFF`, so a client minting a fresh key per request defeated login 5/min (live: 10/10 no 429; constant-XFF control 429 on attempt 6). Per Correction 3, do **not** assume `TRUST_PROXY=true` auto-makes XFF trustworthy; verify the proxy contract, document the assumption, fail safe, and add a defense-in-depth account/email bucket that does not rely on IP.

**Files:** `src/lib/rate-limit.ts`; `src/app/api/admin/auth/login/route.ts`; `.env.example`; `.claude/playbooks/deploy-hostinger.md` (document the Hostinger edge assumption + `TRUST_PROXY`).

**Interfaces:** `clientIp(request, {trustProxy?})`; a new `rateLimitBucket` helper; login uses email bucket.

- [ ] **Step 1: Verify the proxy contract (read-only)** — inspect live request headers (`curl -H "X-Forwarded-For: 1.2.3.4" -D - …/api/newsletter` and check whether the edge overwrites/forwards it; use the Hostinger API if available). Record the finding in the commit. If unverifiable → default `trustProxy=false`.
- [ ] **Step 2: Default-untrusted `clientIp`** — trust XFF only when `TRUST_PROXY=true` is set **and** the Step-1 verification succeeded; otherwise return `x-real-ip` or a stable per-process key (`"__noproxy__"`), never the client-supplied header.
- [ ] **Step 3: Account-scoped bucket for login** — in `login/route.ts`, add a per-`email` window (5/min) alongside the IP window, plus a small **process-global login bucket** (e.g. 50/min across all accounts) so rotating XFF cannot produce unlimited attempts against one account even if IP attribution is spoofed. Keep it in-memory; no Redis.
- [ ] **Step 4: Live controls** — spoof run (rotating XFF, one email) must 429; constant-XFF control must 429; different-email spoof burn must hit the global bucket eventually. Same on newsletter.
- [ ] **Step 5: Document** in the playbook: Hostinger edge contract assumption + `TRUST_PROXY=true` only where verified.
- [ ] **Step 6: Gate + commit.**

Rollback: revert `rate-limit.ts`.

## Task 5: Raster-only CMS uploads + audit existing SVGs

SVG uploads are disabled (stored-XSS vector on the edge-served path with no CSP/nosniff). Also **audit the media location for already-uploaded SVGs** — trusted code-owned SVGs (`public/logo/*.svg`, `favicon.svg`) remain; untrusted uploaded/editor-controlled SVGs are removed/quarantined (Correction 4). Formats become raster-only: **JPEG, PNG, WebP, AVIF** (drop GIF too — no demonstrated need).

**Files:** `src/app/api/admin/media/route.ts` (remove SVG from `SIGNATURES`, `EXT_BY_MIME`, regex; update copy); admin media UI hint text; a read-only scan step over `public/images/`; `ARCHITECTURE.md` note.

**Interfaces:** media upload accepts only the four raster formats.

- [ ] **Step 1: Remove SVG + GIF** from `SIGNATURES`, `EXT_BY_MIME`, `extFromName` regex; error copy → "use .png, .jpg, .webp or .avif".
- [ ] **Step 2: Update admin dropzone/hint copy** (grep `svg`/`GIF` in `src/components/admin/*` + `src/app/admin/media/*`).
- [ ] **Step 3: Audit existing media** — `find public/images -iname '*.svg'` (and GIF). Classify each: trusted code-owned (repo path, referenced by `src/`/`public/`) vs untrusted upload (editor-controlled). Remove/quarantine untrusted; keep trusted.
- [ ] **Step 4: Probe** — upload `test.svg` → 400, no file written; valid PNG → 200; unauth → 401.
- [ ] **Step 5: Verify no attacker-controlled SVG is publicly served** — re-list `public/images/*.svg`; curl each remaining SVG path returns image bytes with no embedded script (grep for `script`/`onload`).
- [ ] **Step 6: Gate + commit.**

Rollback: re-add formats (no data migration).

## Task 6: Demo state is data-driven — `Article.isDemo` renders `DemoNotice`

**`Article.isDemo` is the source of truth** (Corrections 5–6). DemoNotice is **conditional**, never unconditional. Reorder: schema + templates first, then crawler/noindex behavior.

**Files:** `prisma/schema.prisma` (+ migration); `prisma/seed.ts` (`isDemo: true` on the six seeded articles); the five article page templates (`reviews/best/compare/guides/articles/[slug]/page.tsx`): replace any unconditional `<DemoNotice />` with `{article.isDemo && <DemoNotice />}`; **`src/app/articles/[slug]/page.tsx` currently imports `DemoNotice` but never renders it** — this task mounts it conditionally.

**Interfaces:** produces `Article.isDemo: boolean` (default false) read by templates, sitemap/feeds, and JSON-LD.

- [ ] **Step 1: Schema + migration** — `isDemo Boolean @default(false)`; migration = `ADD COLUMN isDemo BOOLEAN NOT NULL DEFAULT FALSE`.
- [ ] **Step 2: Seed** — set `isDemo: true` on all six seeded articles.
- [ ] **Step 3: Templates** — in all five `[slug]/page.tsx`: `{article.isDemo && <DemoNotice />}`. Real articles (`isDemo: false`) never inherit DemoNotice.
- [ ] **Step 4: Verify** — demo pages show "Sample content:", a real-state article (create a temporary `isDemo:false` row locally, or assert the guard) shows no notice.
- [ ] **Step 5: Gate + commit.**

Rollback: revert schema/templates (migration reversible).

## Task 7: Uniform demo crawler gating + noindex (no production/staging branching)

`Article.isDemo === true` → **noindex, excluded from sitemap, excluded from RSS/JSON feeds, no Review/Product rich-result schema — everywhere** (Correction 6). Staging can still render demo pages by direct URL (robots already blocks indexing there), so demo content is excluded from staging sitemap/feed too. `isDemo=false` default means real content is unaffected.

**Files:** `src/lib/queries.ts` (demo guard fragment); `src/app/sitemap.ts`; `src/app/feed.xml/route.ts`; `src/app/feed.json/route.ts`; `src/lib/seo.ts` (articleJsonLd noindex flag); the five article `generateMetadata` (pass noindex when `article.isDemo`); `scripts/smoke.mjs`.

**Interfaces:** `demoExcludedWhere()` returning `{ isDemo: false }`; `shouldNoIndexDemo(article)`.

- [ ] **Step 1: Shared guard** — `export const demoExcluded = { isDemo: false }` (property rule, no origin branching).
- [ ] **Step 2: Compose into crawler surfaces** — sitemap article where + tag where; feed.xml + feed.json article where.
- [ ] **Step 3: Noindex + schema** — `generateMetadata` adds `noIndex: true` when `article.isDemo`; `articleJsonLd` omits any Review/Product-shaped schema for demo articles (it already never emits ratings; assert that).
- [ ] **Step 4: Smoke** — demo slugs absent from sitemap/feed; a demo review page carries `<meta name="robots" content="noindex">`; no `"review"`/`ratingValue` JSON-LD on a demo page.
- [ ] **Step 5: Gate + commit.**

Rollback: revert guard/where.

## Task 8: Rewrite the site-level and homepage claims (research/evidence-led)

**Files:** `src/lib/site.ts` (line 12); `src/app/page.tsx` (lines 78-81, hero; line 435, newsletter blurb); `README.md` (line 3).

**Interfaces:** no dependencies.

- [ ] **Step 1: `site.description`** → e.g. "Reviews with the evidence attached. Duyan Blog independently reviews software, travel and technology from the published specs, source documents and dated checks — methodology, trade-offs and the day we checked the numbers, all in the open."
- [ ] **Step 2: Hero + newsletter copy** (remove "we review/test", "the people who did the testing").
- [ ] **Step 3: Grep-clean** — no `we tested|we measured|we bought|hands-on|did the testing` in the touched files; allow "review/testing methodology".
- [ ] **Step 4: Gate + commit.**

## Task 9: About page — drop the buy/borrow/testing practice claim

**Files:** `src/app/about/page.tsx` (lines 36-43).

- [ ] **Step 1:** replace the physical-testing claim with the research/evidence-led description + "Where an article contains genuine first-hand work, it says so and describes exactly what was done."
- [ ] **Step 2:** grep-clean (`buy what we test|borrow when we can't|tests what`) → 0.
- [ ] **Step 3: Gate + commit.**

## Task 10: Methodology page — "How we review", the source-led model, CTA labels

**Files:** `src/app/methodology/page.tsx` (title, H1, section bodies, add evidence-first section); `src/app/page.tsx:87`, `src/components/site-header.tsx:56` (CTA "How we test" → "How we review"); `DESIGN.md:80` band note → token description.

- [ ] **Step 1:** retitle "How we review", rewrite section 2 (two names → "research-and-reasoning"), add "Evidence-first: sources and the day we checked" (quote the smARtAIStack-model stance: "We read the vendor's published pages…; we do not run our own benchmarks; where we cite an independent measurement we name its source and date. Where a vendor publishes nothing on a point, we leave it empty rather than fill it.").
- [ ] **Step 2:** CTA label swap.
- [ ] **Step 3:** DESIGN.md band note → `--band-bg`/`--band-fg`.
- [ ] **Step 4:** verify H1/text; **Step 5: Gate + commit.**

## Task 11: `SourceCitation.checkedAt` — date-only, minimal model

The only evidence additions: a source row + a check date. **No Claim/Evidence/ResearchSession/Fact/SourceSnapshot/EvidenceGraph** (Corrections 16–17).

**Files:** `prisma/schema.prisma` + migration (`checkedAt DateTime? @db.Date` — date-only, avoiding timezone shift); `src/lib/admin-articles.ts` payload; article form source rows use `<input type="date">`; `src/components/editorial/article-extras.tsx` `SourcesList` renders "checked October 4, 2026"; seed sets `checkedAt` on the five `sourceCitation.createMany` calls.

**Interfaces:** `sources: { id, label, url, order, checkedAt: Date }[]`; form converts date input → Date at UTC.

- [ ] **Step 1:** schema + date-only migration; apply `npm run db:migrate`.
- [ ] **Step 2:** admin payload (`optionalDateField` reused) + form `<input type="date">` per source.
- [ ] **Step 3:** render — `formatDate(s.checkedAt)` (already in `src/lib/format.ts`) appended to the source label; verify month/day do **not** shift (date-only cast test).
- [ ] **Step 4:** seed `checkedAt` on all 5 `createMany`.
- [ ] **Step 5:** smoke — demo review page contains "checked" + 4-digit year; must-not-match `checked NaN`.
- [ ] **Step 6:** gate (build+test) + commit. Rollback: drop migration (nullable column).

## Task 12: Rewrite the six seeded articles + playbook + bios — research-led, demo-labelled

Same as previously planned (text-only rewrite of `prisma/seed.ts`), with the "we do not run our own benchmarks" model enforced in examples, and the `Article.isDemo` gate (Task 6/7) keeping them out of crawler surfaces in production.

**Files:** `prisma/seed.ts` (bios lines 49, 56, 63; categories lines 71-96; six articles; playbook line 727), `src/app/reviews/[slug]/page.tsx` (line 143: "tested against" → "scored against").

- [ ] **Step 1:** bios + category copy (remove "tests what she writes about", "we buy or borrow what we test", etc.).
- [ ] **Step 2:** six articles — every `deck` (feeds OG/meta), `blocks`, `STATS`, and FAQ asserting first-hand measurement is rewritten source-led; any number kept is either (a) sourced to a seeded `SourceCitation` with `checkedAt` or (b) deleted. Where a stat is retained as an illustration, it says so.
- [ ] **Step 3:** playbook → the research protocol (steps read coverage map/plan terms, compare pricing pages, name independent dated reviews, leave gaps empty).
- [ ] **Step 4:** sidebar "tested against" → "scored against".
- [ ] **Step 5:** reseed (local dev DB only); grep-control `we (bought|tested|measured|timed|spent)|did the testing|ran both under load|looped|synthetic` in `prisma/seed.ts` → 0; render Auralis/TerraSIM; DemoNotice shows via `isDemo`.
- [ ] **Step 6: Gate + commit.** Rollback: seed is idempotent wipe-and-insert.

## Task 13: Homepage — replace the hardcoded "0 paid placements" stat

Do **not** invent a measured value or add a SponsoredContent schema (Correction 7). Prefer a truthful non-numeric trust statement.

**Files:** `src/app/page.tsx` (lines 123-124, the `dl` stat grid).

- [ ] **Step 1:** replace the `paid placements` cell with a design-consistent trust line, e.g. "Editorially independent" (or a short non-numeric statement consistent with the design), or remove the fourth cell and keep 3 stats.
- [ ] **Step 2:** verify the stat grid no longer renders a hardcoded number; **Step 3: Gate + commit.**

## Task 14: Consent + cookie policy — disclose every storage key actually written

**Files:** `src/content/policies.ts` (cookie-policy); `src/components/consent/consent-manager.tsx` (lines 57-60, banner `role="region"`); optional `src/components/ui/sidebar.tsx` (line 86) cookie flags.

- [ ] **Step 1:** cookie-policy "Necessary" table includes the real keys written: `dy-consent-v1` (localStorage, your choices), admin session cookie, `theme` (next-themes localStorage, written pre-consent by design), `duyanblog:sort` (localStorage, comparison sort). Include lifetime/type per key. Note `sidebar_state` only if it ships in the public tree (currently untracked scaffold) — add flags `SameSite=Lax; Secure` if retained.
- [ ] **Step 2:** banner `role="dialog" aria-modal="false"` → `role="region" aria-label="Cookie consent"`.
- [ ] **Step 3:** verify — render `/cookie-policy` lists the keys; cross-check every `localStorage`/`document.cookie` write in `src/` (grep) against the policy or explicit exemption.
- [ ] **Step 4: Gate + commit.**

## Task 15: Privacy policy — conditional rights, truthful retention, IP handling, no exact-policy promises

Do not assert exact retention periods (12/24 months) without enforceable deletion (Correction 8). Use truthful wording.

**Files:** `src/content/policies.ts` (privacy-policy).

- [ ] **Step 1:** rights framed conditionally ("If you are in the EEA/UK/Switzerland, you may have rights under applicable law… practices will be reviewed with legal counsel before advertising is served") — no assertion that GDPR/CCPA currently binds.
- [ ] **Step 2:** retention: newsletter rows kept until unsubscribe or deletion request; contact messages "kept only as long as reasonably necessary for the stated purpose"; affiliate click records "kept only as long as reasonably necessary (operational accounting)". No 12/24-month claims.
- [ ] **Step 3:** IP handling — qualify: "We process a derived IP-based identifier transiently in server memory for abuse prevention; it is not persisted to the application database." Fix "That's the whole list" overclaim.
- [ ] **Step 4: Gate + commit.**

## Task 16: Minimize affiliate click data — controlled source only, drop raw Referer

Per Correction 9 — do **not** store the raw HTTP Referer; store a controlled internal source/path when supplied, else `null`. Also reassess `consentAnalytics`: the `c=1/0` hint is not useful (not reliably appended; false conflates unknown/rejected; click accounting is operational). First grep all reads/writes/reporting of `consentAnalytics`; if no real downstream use, remove the column in a dedicated migration.

**Files:** `src/app/go/[offerId]/route.ts`; `src/lib/offers.ts`; `AffiliateButton`/`AffiliateLink` (append controlled `src`); `prisma/schema.prisma` (+ migration if `consentAnalytics` removed); `AFFILIATE_INTEGRATION.md`; policy snapshot copy.

**Interfaces:** `/go` stores `{ offerId, articleId, createdAt, sourcePath }` (sourcePath = controlled `/path` or `null`); `consentAnalytics` removed iff grep shows no downstream reads.

- [ ] **Step 1: Grep `consentAnalytics`** across `src/` + DB reporting; if only the write site exists, proceed to remove (dedicated migration) — else keep and document.
- [ ] **Step 2:** `/go` — replace the raw `referer` capture with a `sourcePath` controlled value; when absent, store `null`. **No raw Referer read at all.**
- [ ] **Step 3:** buttons append a controlled `src=` (article-path or `/deals`) so the source is always available.
- [ ] **Step 4:** policy + `AFFILIATE_INTEGRATION.md` describe: "anonymous click record (offer, timestamp, controlled source page on Duyan Blog); we do not read or store your browser's Referer header and never store your IP with click data."
- [ ] **Step 5:** probe — direct `/go/<offer>` without `src=` stores `null`; with `src=…` stores `/…`; a crafted `Referer: …/search?q=medterm` is **not** stored at all (assert row has no query string).
- [ ] **Step 6: Gate + commit.** Rollback: migration reversible; `/go` logging is try/catch-trapped (navigation never breaks).

## Task 17: Terms, corrections, editorial-policy — truthful, no pseudo-legal placeholders

Per Corrections 10: no hard 7-day SLA unless guaranteed ("We aim to review correction reports promptly"); drop the "governed by the law applicable in the operator's jurisdiction, to be confirmed…" placeholder — leave jurisdiction out of production Terms and list it under owner/legal decisions; no public corrections ledger (article-level notes + admin revision history suffice).

**Files:** `src/content/policies.ts` (editorial-policy, corrections-policy, terms, how-we-make-money, advertising-disclosure).

- [ ] **Step 1: editorial-policy** — two-names line aligned to schema reality (second editor "where a review has one"); research/evidence-led framing.
- [ ] **Step 2: corrections-policy** — remove "seven days"; "We aim to review correction reports promptly."; "re-test" → "re-check the cited sources"; no public ledger promise.
- [ ] **Step 3: terms** — remove the pseudo-legal governing-law placeholder; add truthful "site does not target children under 13"; keep as-is/liability already minimal and honest.
- [ ] **Step 4: how-we-make-money + advertising-disclosure** — present-tense truthfulness: no ad network configured today; rules govern one when (or if) added; no promise about rendering that contradicts current state.
- [ ] **Step 5: Gate + commit.**

## Task 18: AI-crawler decision — record, don't implement (deferred)

The owner has not decided to block AI crawlers; current default **allow** (Correction 11). No bot arrays, no `BLOCK_AI_CRAWLERS` code.

**Files:** `.claude/rules/risk-register.md` (add an explicitly-owned decision row: "AI-crawler blocking allowed/denied as an owner decision; default allow; can be added later via a single robots group"); `README.md`/docs note (no Terms-enforcement claim).

- [ ] **Step 1:** add the decision + default to the risk register and a one-line doc note.
- [ ] **Step 2: Gate + commit** (docs-only; no code change).

## Task 19: AdSense readiness — documentation only, no fake gate

`docs/ADSENSE_READINESS.md` is kept, but **no** `NEXT_PUBLIC_ADS_CMP_ID` assert that pretends to prove CMP readiness (Correction 12). Ads stay disabled; real integration is a separate future task required before any launch.

**Files:** create `docs/ADSENSE_READINESS.md`; `AFFILIATE_INTEGRATION.md` (point at the doc; remove any "flip the switch" implication); no code change to `settings.ts`.

- [ ] **Step 1:** write the doc: current state (ads disabled, no network, no certified CMP), the launch checklist framed as a **future integration task** (choose certified CMP → integrate → verify TCF/consent/region behavior → update policies → ads.txt → test ad gating by consent/region → then enable), and a clear "NOT READY" status signal.
- [ ] **Step 2:** no runtime assert added. Gate + commit (docs-only).

## Task 20: Search — fix correctness, not sophistication

The `take:100` + JS-filter ceiling is a real correctness bug; **MySQL FULLTEXT is not required at this corpus** (Correction 13). Move filtering into the query (title/deck/tags) with a sensible DB `LIMIT` and no silent latest-100 ceiling. Document FULLTEXT as a later scale optimization; do not add a FULLTEXT migration now.

**Files:** `src/lib/queries.ts` (new `searchArticles(q, cat?)` Prisma query filtering title/deck/tags with `contains` case-insensitive + `orderBy publishedAt desc` + `LIMIT 30`); `src/app/search/page.tsx` (use it; keep `?cat=`, empty state, noindex); `scripts/smoke.mjs` (+ `?q=` checks).

**Interfaces:** `searchArticles(query, catSlug?) → ArticleCardData[]`.

- [ ] **Step 1:** implement DB-side filtering (title/deck/tags, published + liveDateGuard + demoExcluded), `LIMIT 30`.
- [ ] **Step 2:** wire the page; remove the JS substring filter.
- [ ] **Step 3:** smoke — `?q=esim` returns the roundup; `?q=zzz` empty; `?cat=software` narrows; demo slugs absent from prod-like results.
- [ ] **Step 4:** document "MySQL FULLTEXT as a later scale optimization" (ARCHITECTURE note). Gate + commit.

Rollback: revert query/page.

## Task 21: Truthful newsletter state (choose the smaller honest fix)

Per Correction 14 — before launch, either (A) configure a real mail provider and smoke-test a confirmation, **or** (B) disable/hide signup when no provider is configured and never pretend signup completed. Docs/ops only; no code needed if B is chosen conservatively, but the plan must pick one and enforce it via smoke.

**Files:** `src/app/api/newsletter/route.ts` (if B: return a clear "unavailable" when transport is `none` in production, or gate the UI); `src/components/newsletter-form.tsx` (if B: render disabled/hidden state); `scripts/smoke.mjs`; `docs`/env note.

**Interfaces:** production newsletter transport state is knowable via `sendMail`'s provider result.

- [ ] **Step 1:** decide A or B with the owner at execution time; implement the smaller honest option (B default if no provider key is configured).
- [ ] **Step 2:** if B — signup returns a truthful unavailable response and the form does not pretend success (or is hidden) when transport is `none` in production; dev keeps the console/confirmUrl path.
- [ ] **Step 3:** smoke — production-like (no provider) signup must NOT return `{ok:true,emailed:false}` pretending success; must be a truthful declined state.
- [ ] **Step 4: Gate + commit.** Rollback: revert route/form.

## Task 22: Media persistence — truthful, minimal path

Per Correction 15 — before editors rely on CMS uploads for real content, choose (A) durable object storage, or (B) disable production CMS upload + keep editorial media in Git/deploy. **Prefer B** (object storage would expand scope; MVP keeps everything Git-managed). No R2/S3 code now.

**Files:** `src/lib/settings.ts` or `src/app/api/admin/media/route.ts` (guard: refuse or warn when `production` + NOT a configured durable path — simplest: reject uploads in production unless `MEDIA_PERSISTENT=true` is set), `ARCHITECTURE.md` note, `docs`/playbook.

**Interfaces:** upload route consults an explicit production-media decision flag.

- [ ] **Step 1:** document current state honestly (uploads land in `public/images` in `cwd`; Hostinger host rebuilds overwrite the app dir; this is a real gate, not a nit).
- [ ] **Step 2:** implement B — in production, without an explicit `MEDIA_PERSISTENT=true` (meaning "this env persists media"), the upload endpoint refuses (403/400 with a truthful message), and admin UI shows a banner. Editorial media becomes Git-managed for production content.
- [ ] **Step 3:** playbook records the durable path for a future move to object storage (deferred).
- [ ] **Step 4: Gate + commit.**

Rollback: revert the guard.

## Task 23: Docs + env + dead code + risk register

**Files:** `EDITORIAL_GUIDE.md` (§7 labelling, §8 voice → research/evidence-led examples), `.claude/playbooks/deploy-hostinger.md` (media/`ALLOW_INDEXING`/`TRUST_PROXY`/newsletter), `.env.example` (new env vars: `ALLOW_INDEXING`, `TRUST_PROXY`, `MEDIA_PERSISTENT`, mail-related), `src/app/api/admin/settings/route.ts` (lines 12-15: narrow the key allowlist to `ads_enabled`+`demo_mode`), `src/lib/content-schema.ts` (delete the unimplemented `ref:` docstring), risk register.

- [ ] **Step 1:** editorial guide voice/examples → sourced model (no "we bought, installed and burnt through the data").
- [ ] **Step 2:** playbook env table + non-negotiables (indexing flag, trust-proxy verification, media persistence, newsletter mailbox).
- [ ] **Step 3:** `.env.example` rows; strict settings allowlist.
- [ ] **Step 4:** remove `ref:` docstring; update risk register entries.
- [ ] **Step 5: Gate + commit.**

## Task 24: Final branch review + worklog/risk sync

No feature. Full gate + hostile re-verification of the exact probes that found each blocker (computed-style band/footer both themes; robots semantic; limiter controls; SVG upload 400 + no file; sitemap/feed/schema demo absence; newsletter truthful decline; `isDemo` noindex). Update `worklog.md` (Task ID 16-style entry) + risk register. This is the **one independent hostile reviewer** allowed (a single fresh `general-purpose`/`duyan-runtime-verifier` run, defaulting FAIL), else main Claude self-verifies with the same probes if the cap applies.

- [ ] **Step 1:** full gate (lint/typecheck/validate:docs/slop/build/test).
- [ ] **Step 2:** re-run the blocker probes; each must pass with controls (must-not-match included).
- [ ] **Step 3:** update worklog + risk register. Commit.

---

## Completion criteria (acceptance milestones)

### READY FOR REAL CONTENT
- Demo handling is **data-driven via `Article.isDemo`**; no unconditional `DemoNotice` anywhere; all five article types render `{article.isDemo && <DemoNotice />}`.
- No seed article, page, policy, or metadata claims first-hand testing as fact; editorial doctrine/docs teach research/evidence-led (guide, methodology, about, site copy).
- Newsletter **either genuinely works** (provider + smoke-tested) **or is honestly disabled** in production (no fake success).
- Production media path is **durable** (object storage, later) **or CMS upload is disabled + media is Git-managed** (Task 22, preferred).
- Dark/light core pages pass **semantic contrast verification** (band/footer non-inverting).
- Next.js on the **current patched stable**; build/test/docs gates pass.

### READY FOR REAL AFFILIATE
- Clear & conspicuous affiliate disclosure placed **close enough to the recommendation** for the reader to understand the commercial relationship (FTC principle; not a burdensome "unavoidable" framing).
- `/go` cannot break navigation if logging fails (try/catch, as built); destination validation remains safe (`https://` scheme, DB-sourced).
- Click data is **minimal**: offer, timestamp, controlled source path (or null); **no raw Referer query strings**; no IP with click data.
- AdSense readiness documented but **NOT ready** (see below).

### READY FOR ADSENSE — NOT READY by completion of this plan
Becomes ready only after a **separate, owner-authorized integration** verifies: real non-demo content; Google-certified CMP (where required) with working TCF; consent/region behavior; provider-specific privacy/cookie updates; `ads.txt`; live ad-script gating; invalid-click policy; production validation. `docs/ADSENSE_READINESS.md` encodes this gate (Task 19).

## Owner / legal decisions required before commercial launch
1. **Register `duyanblog.com`** + production origin swap (playbook §domain-swap); set `ALLOW_INDEXING=true` on production, leave staging blocked. Depends on Task 3.
2. **Jurisdiction / governing law / controller identity** for Terms + Privacy — to be decided by owner/legal; production Terms currently omit these truthfully rather than carry pseudo-legal placeholders (Task 17).
3. **Newsletter provider decision** (Task 21): configure Resend + verify confirmations, or disable signup honestly.
4. **Media persistence decision** (Task 22): Git-managed production media (preferred B) or a future durable store.
5. **AI-crawler block decision** — default: allow; recorded in the risk register, addable later with a single robots group (Task 18).
6. **AdSense integration** — separate authorized task before any ads serve to EEA/UK/CH (Task 19).

## Schema changes remaining
- `SourceCitation.checkedAt DateTime? @db.Date` (date-only; Task 11).
- `Article.isDemo Boolean @default(false)` (Task 6).
- **Possibly** a dedicated migration dropping `AffiliateClick.consentAnalytics`, only if the Task 16 grep confirms no downstream read (otherwise the column stays).
- No FULLTEXT migration, no object-storage schema, no Claim/Evidence subsystem, no SponsoredContent model.

## Rollback summary
Every schema task has a runnable down migration; every code task is a single-file revert; `seed:demo` is idempotent; `robots.ts`/`isAdsEnabled`/upload guard reverts restore prior behavior. The gate runs after each task, so any regression is caught within one commit.

## Final plan validation
- Task numbering is monotonic and dependency-ordered (1 security floor → 2 theme → 3 robots → 4 limiter → 5 SVG → 6 isDemo → 7 crawler gating → 8–13 editorial copy → 14–19 policy/consent/adsense → 20 search → 21 newsletter → 22 media → 23 docs → 24 review).
- No phase references a removed task; the AI-crawler task (previously 18 in an earlier draft) is a **deferred docs decision (now Task 18)**, not deleted-and-then-referenced.
- Migration ordering: `checkedAt` and `isDemo` are additive nullable/defaulted columns; no inter-migration dependency. (Optional `consentAnalytics` drop is independent.)
- No acceptance criterion requires infrastructure not implemented (AdSense is explicitly NOT-ready; object storage explicitly deferred; no Redis).
- Legal/compliance claims are conditional or truthful-present-tense; no fake gate; no exact retention promises without enforcement.
- The plan is implementable by one main Claude sequentially (each task is a self-contained test cycle).
- Docs teach research/evidence-led review — the pulp signal is removed.

**Editorial pivot (unchanged, approved):** Duyan is research/evidence-led; first-hand claims appear only where a specific article genuinely contains first-hand work and says so.

---

*Final plan corrected. No implementation changes were made. Ready for `superpowers:executing-plans` after owner approval.*