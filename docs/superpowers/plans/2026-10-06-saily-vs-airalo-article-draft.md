# Saily vs Airalo — First Real Article Draft — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a CMS-ready, evidence-led versus article draft (`saily-vs-airalo`) — content-first, zero monetization — plus its media assets, ready for owner editorial review, without publishing.

**Architecture:** The deliverable is a structured JSON blocks draft (validate with the repo's own `serializeBlocks`) persisted as a **local-DB article row** in `status: "draft"` (drafts never render publicly), plus a machine-checkable gate script that pins the content-integrity rules (no go: links, no fake testing language, table limits, checked dates, source coverage). Media are Pexels photos downloaded into `public/images/` (Git-managed convention) with manifest refresh.

**Tech Stack:** Next.js 16 (existing app), Prisma 6 + local MySQL (`duyanblog_dev`, port 3307), Zod 4 (`src/lib/content-schema.ts`), tsx scripts, Pexels MCP (search) + direct download of Pexels CDN URLs.

**Spec:** Owner brief (2026-10-06, this session's chat record) + this session's research gate — evidence ledger at `.superpowers/sdd/2026-10-06-saily-vs-airalo-research/ledger-notes.md` (git-ignored). This plan is the written artifact; the brief's two research AMENDMENTS (Airalo Japan 1GB conflict handling; bounded methodology wording) are quoted verbatim in Task 1/Task 2 below.

## Global Constraints

- `isDemo = false`; no demo author; if no real author exists in DB → STOP before persistence and report.
- NO affiliate anything: no `AffiliateOffer`, no affiliate ID, no `go:` links, no partnership claim, no merchant CTA card.
- No fake first-hand language: never "we tested / in our tests / we experienced / we found the connection faster".
- Methodology wording (owner-verbatim): "This comparison is based on published pricing, documentation and policies checked on [date]. Duyan did not conduct first-hand performance testing for this article."
- Airalo Japan 1GB validity is CONFLICT/RECHECK — owner-verbatim: do NOT write "Airalo 1GB is only valid for 3 days" as settled fact; re-fetch official page; if still conflicting → record conflict, exclude from verdict, no Saily advantage derived from it.
- Tables: ordinary `table` blocks only, ≤40 rows × 8 cols (schema hard limit); NO `comparisonEmbed`, no `pick` with `offerId`, no `offerEmbed`.
- No fake Review/Product/Offer JSON-LD (repo already enforces).
- Official provider links as plain external links only (renderer gives `rel="nofollow noopener"` automatically).
- Sources block carries checked dates; every material claim traces to the ledger.
- No overall winner; scenario-based; "if there is no meaningful winner, say so".
- Do NOT publish: `status: "draft"`, `publishedAt` unset. Indexing stays off. LOCAL/TEST DB only.
- English for all shipped strings; Vietnamese for chat with owner.

## Review Focus

- A price in a table that no longer matches the provider's live page (refresh-at-draft must re-verify; each table caption carries its own check date).
- The Airalo Japan 1GB claim resurfacing as a settled fact anywhere (TL;DR, tables, decision rows) despite the conflict ruling.
- Vendor marketing phrasing leaking unattributed ("30 million users", "By the creators of NordVPN", security-feature list).
- Scope callout drifting into absolutes ("Nobody has ever used…") — owner's bounded wording only.
- A `go:` link or "Get it" CTA appearing via muscle memory (this article must have zero affiliate surface).
- `serializeBlocks` rejections from table shape (rows >8 cells) or >25 source items.

---

### Task 1: Evidence refresh at draft time (volatile facts only)

**Files:**
- Modify: `.superpowers/sdd/2026-10-06-saily-vs-airalo-research/ledger-notes.md` (append refresh section)

**Interfaces:**
- Consumes: session research ledger (2026-10-06 fetches), Playwright browser session.
- Produces: `LEDGER-REFRESHED 2026-10-06` values for: Saily Japan/Europe/Global ladders, Airalo Japan/Europe/Discover ladders, unlimited/FUP terms, refund wording, destination labels, Airalo Japan 1GB conflict resolution. Later tasks consume these exact numbers.

- [ ] **Step 1: Re-fetch Saily plan pages** (Japan, Europe, Global) via Playwright; record plan ladders + validity + any wording change.
- [ ] **Step 2: Re-fetch Airalo plan pages** (Japan, Europe, Discover) + unlimited FAQ; specifically resolve the Japan 1GB validity conflict (does a 1GB/7-day-class plan now exist? does the 3-day grouping still bind 1GB?). Record either the resolved ladder or `CONFLICT REMAINS`.
- [ ] **Step 3: Spot-check refund pages** (Saily refund article; Airalo refund help article) for wording changes.
- [ ] **Step 4: Append `## DRAFT-TIME REFRESH (2026-10-06)` to the ledger** with per-page results, explicit `CHANGED`/`UNCHANGED` markers vs the research-gate values, and the conflict ruling.
- [ ] **Step 5: Verify** — every number that will appear in Task 3's tables has a same-day ledger line. Expected: a complete value list, zero "probably".

### Task 2: Media — Pexels selection + download

**Files:**
- Create: `public/images/articles/saily-vs-airalo/{hero,train,sim}*.jpg` (exact names at execution)
- Modify: `public/images/.media-manifest.json` (via `npm run media:manifest`)

**Interfaces:**
- Consumes: Pexels MCP (`pexels_search_photos`, `pexels_get_photo`).
- Produces: 3 local image files + web paths (`/images/articles/saily-vs-airalo/...`) + a metadata record (photo ID, photographer, Pexels page URL, dimensions, alt) for Task 3's image blocks and the final report.

- [ ] **Step 1: Search Pexels** — `traveler phone airport`, `smartphone map train travel`, `sim card phone`; pick 1 hero + 2 supporting (landscape, ≥1200px wide, editorial/context only).
- [ ] **Step 2: Record metadata** for each: photo ID, photographer, Pexels page URL, dimensions, chosen download URL, placement, truthful alt.
- [ ] **Step 3: Download** into `public/images/articles/saily-vs-airalo/` (convention: Git-managed media; do not touch unrelated files). If download via MCP is unsupported, fetch the documented CDN URL with curl and verify content-type + dimensions with `npm run media:manifest`.
- [ ] **Step 4: Refresh manifest**: `npm run media:manifest` → `.media-manifest.json` includes the 3 new paths.
- [ ] **Step 5: Verify** — `sharp` reads all 3; filenames snake-case; no file outside the new directory changed.

### Task 3: Write the article draft (blocks JSON) + integrity gate script

**Files:**
- Create: `content/drafts/saily-vs-airalo.json` (blocks + article meta; import-ready)
- Create: `scripts/test-article-draft-saily-vs-airalo.mjs` (structural gate, same pattern as `test-cta-readiness.mjs`)

**Interfaces:**
- Consumes: Task 1 ledger values; Task 2 image paths; schema `src/lib/content-schema.ts` (`serializeBlocks` via tsx).
- Produces: draft JSON whose top level = `{ type: "versus", slug, title, deck, tldr, categoryId, isDemo: false, blocks: [...] }` — the exact shape Task 4 imports.

- [ ] **Step 1: Write the gate script FIRST (TDD RED)** — checks, each with a control that must NOT match: (1) zero occurrences of `go:` anywhere; (2) no banned first-hand phrases (`we tested`, `in our tests`, `we experienced`, `our benchmark`); (3) no absolute scope wording (`Nobody on our team`); (4) every `table` block ≤40 rows/≤8 cells per row; (5) block types ⊆ supported 15; (6) sources block exists, ≥12 items, every item label ends with a checked date `(checked 2026-10-06)`; (7) no `offerId`/`offerEmbed`/`comparisonEmbed`/`pick`; (8) TL;DR exists and does not contain `overall winner` phrasing; (9) Airalo-Japan-1GB sentence, if present, contains the conflict qualifier; (10) all image `src` values exist under `public/images/`; (11) `npm run slop` patterns on the two prose-heaviest fields pass. Script prints PASS/FAIL lines and exits non-zero on any FAIL.
- [ ] **Step 2: Run it against a stub** — Expected: FAIL (draft missing).
- [ ] **Step 3: Write the draft** (`content/drafts/saily-vs-airalo.json`): structure = callout(warning, owner-verbatim bounded methodology, today's date) → opening paragraph → pricing heading + 3 tables (Japan/Europe/Global, per-caption dates) → coverage discussion (4 figures with on-page labels; units differ; no winner) → installation & activation (per docs) → hotspot & top-up → unlimited/FUP → refunds & support → privacy & extras (attributed vendor claims) → who-should-choose lists (scenario-based) → FAQ (5–8 real-intent questions) → sources (official URLs + checked dates) → divider. Images: hero concept via `image` blocks at opening + 1 supporting; prosCons only where ledger supports.
- [ ] **Step 4: Validate with the repo's own parser** — `npx tsx -e "import {serializeBlocks} from './src/lib/content-schema'; ..."` over the draft's blocks → zero throw.
- [ ] **Step 5: Run the gate → GREEN** (11/11 PASS), `npm run slop -- --rows` read-and-judged.
- [ ] **Step 6: Commit** draft + gate script.

### Task 4: Local persistence (draft row) or explicit STOP

**Files:**
- Modify: local DB only — `Article` row via a tsx one-shot script (not committed) or documented SQL
- Create: `scripts/README-article-draft-import.md` (how the owner imports/approves)

**Interfaces:**
- Consumes: Task 3 draft JSON; local MySQL `duyanblog_dev`.
- Produces: an `Article` row `status: "draft"`, `isDemo: false`, real author, unpublished (`publishedAt` null).

- [ ] **Step 1: Resolve authorship** — query local DB `Author` table. The seed authors are fictional (`DemoNotice` by design). **If only demo authors exist → do NOT attach any of them. STOP and report required owner info** (real author name/role/bio/slug) as the brief demands; deliverable remains the draft JSON (still fully reviewable). If the owner previously created a real author row, use it.
- [ ] **Step 2: If proceeding** — insert draft row via `serializeBlocks` + Prisma in a local-only script (DATABASE_URL points at `duyanblog_dev`); `categoryId` = software or travel per taxonomy; verify with a read-back query: status=draft, publishedAt null, isDemo=false, blocks parse to N blocks.
- [ ] **Step 3: Write the import README** (exact commands, approval path via admin).
- [ ] **Step 4: Verify** — local only; production untouched (no script in this task ever receives the production DATABASE_URL).

### Task 5: Verification + one editorial review + repair

**Files:**
- Modify: only what the review finds broken (one repair pass)

**Interfaces:**
- Consumes: everything above.
- Produces: verified draft + review verdict + final report inputs.

- [ ] **Step 1: Gates for changed files** — `npm run lint && npm run typecheck`; `node scripts/test-article-draft-saily-vs-airalo.mjs` → 11/11; `npm run validate:docs` (worklog/plan additions); `npm run slop`.
- [ ] **Step 2: Rendered check (local, draft invisible publicly is EXPECTED)** — verify the draft renders in the admin preview or via a local page probe of the blocks (draft status means the public route 404s — that itself is a check: `/compare/saily-vs-airalo` must 404 publicly while unpublished).
- [ ] **Step 3: ONE editorial reviewer** (subagent, general-purpose) over the draft JSON + ledger: unsupported claims, stale pricing vs Task 1 refresh, hidden vendor marketing, fake-firsthand implication, asymmetric comparison, premature winner, SEO slop, media misrepresentation, source gaps.
- [ ] **Step 4: ONE repair pass** from findings; re-run gates; ledger the result.
- [ ] **Step 5: Worklog entry (Task ID 23)** + commit; final report in Vietnamese with all confirmations; STOP for owner review. **Do not publish, do not merge to production, no indexing change.**
