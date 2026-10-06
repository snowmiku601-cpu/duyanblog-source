# DUYANBLOG.COM — Build Worklog

Project: duyanblog.com — independent editorial review publication (Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, Prisma).

---

Task ID: 1
Agent: Z.ai Code (lead)
Task: Research (Impeccable / Neo Mirai + real review publishers), plan, self-critique, final plan.

Work Log:
- Fetched impeccable.style/neo-mirai/ and /cases/neo-mirai/ via page_reader; studied structure and copy voice.
- Web-searched review-site UX patterns (Wirecutter, TechRadar, NN/g comparison-table guidance).
- Fetched impeccable.style/slop/ for anti-AI-slop guidance.

Stage Summary (research distillation):
- Neo Mirai principles to adopt (not copy): warm paper ground, charcoal type, single controlled red accent, amber/ochre support, sun/circle geometry, numbered editorial sections ("Day 01 — New Frontiers" style), manifesto band with inverted background, asymmetric grids, hairline rules, aggressive typographic scale contrast, restrained motion, confident short headline voice ("Systems with warmth. Machines with a human horizon.").
- Review-publisher principles: comparison tables = consistency + scannability + simple layout (NN/g); "Best overall / Best for X" badges; byline + updated + reviewed dates near top; disclosure near first offer link; methodology link adjacent to scores; mobile comparison = stacked cards not squashed table; pros/cons scannable; trust pages one click away.
- Anti-slop rules enforced in DESIGN pass: no card soup, no equal-weight everything, no glassmorphism/gradient blobs, no generic hero copy, every decoration needs a job.

FINAL PLAN (self-critiqued):
1. Critique outcomes: (a) user-requested Drizzle+PostgreSQL is impossible in this sandbox (Prisma+SQLite only) → build Prisma/SQLite, keep schema portable, document Postgres path; (b) `npm run build` cannot run in sandbox (platform rule) → validate via dev server + lint + typecheck + HTTP smoke script; (c) cut over-engineering: no NextAuth (minimal DB-backed session auth with scrypt), no i18n framework, no Redis/ES, no real ad networks, no rich text editor (validated JSON block editor in admin MVP).
2. Content model: typed JSON blocks validated by Zod discriminated union (paragraph/heading/list/quote/callout/stats/comparisonEmbed/offerEmbed/pick/image/faq/sources/divider/table).
3. Design: original nón lá geometric logo (SVG set), Fraunces (display) + Inter (UI/body), warm-paper token system in globals.css, sun-disc + hairline motifs, numbered section labels, no blue/purple.
4. Pages: home, category hubs (/software /travel /tech), /reviews/[slug], /best/[slug], /compare/[slug] (+ vs teaser), /guides/[slug], /articles/[slug], /deals, /search, /authors, /authors/[slug], /about, /contact, /methodology, 8 policy pages, /admin (login, dashboard, articles, categories, authors, merchants, offers, comparisons, settings, messages), /go/[offerId] click router, 404.
5. SEO: Metadata API, canonicals, OG/Twitter, JSON-LD (Organization, WebSite, BreadcrumbList, Article, Person — no fake Review/Product ratings on demo content), sitemap.ts, robots.ts, RSS feed.xml, internal linking, no duplicate article URLs (single canonical slug route per type).
6. Affiliate: AffiliateLink/AffiliateButton/MerchantOffer/ComparisonOffer/AffiliateDisclosure/AdSlot components; /go/[offerId] 302 click router (works with zero consent, rel="sponsored nofollow? — sponsored only", no deceptive redirects); AffiliateClick logging with consent snapshot.
7. Consent: necessary/analytics/advertising, nothing optional loads before consent; affiliate navigation independent of consent; CMP replaceable (adapter in src/lib/consent.ts).
8. Security: scrypt password hashing, DB-backed hashed session tokens, HttpOnly/SameSite=Lax/Secure(prod) cookies, origin checks on mutations, Zod validation everywhere, rate limiting on login + public POSTs, security headers, no default creds, admin bootstrap via CLI script only, no runtime auto-seed (seed:demo refuses production).
9. Delegation: Task 3-a = /admin build (subagent), Task 3-b = handoff docs (subagent); Task 2 + 4 + 5 by lead.

---
Task ID: 3-b
Agent: general-purpose
Task: Handoff documentation (README, ARCHITECTURE, PRODUCT, DESIGN, EDITORIAL_GUIDE, SEO_GUIDE, AFFILIATE_INTEGRATION, HOSTINGER_DEPLOYMENT)

Work Log:
- Read worklog (Task 1 plan + conventions), then inspected the actual code before writing: package.json scripts; prisma/schema.prisma (20 models), prisma/seed.ts (fictional dataset: 3 authors, 3 categories, 7 merchants, 7 offers, 1 comparison, 6 published articles, 1 methodology entry, settings ads_enabled=false / demo_mode=true, sample Redirect); prisma/migrations (2 applied).
- Inspected all of src/lib (site, auth, seo, consent, comparison, content-schema, settings, rate-limit, queries, offers, format, db) and key components (logo + public/logo/*.svg + favicon.svg sources, site-header/footer, consent-manager, affiliate-link/merchant-offer/ad-slot, article-renderer, inline-text, comparison-table, newsletter-form, json-ld, section-heading, article-header, article-extras, reveal), plus app routes (layout, page, reviews/best/compare/[slug], search, sitemap, robots, feed.xml, go/[offerId], api/newsletter, api/contact), next.config.ts, .env.example, src/content/policies.ts, scripts/smoke.mjs, scripts/admin-bootstrap.ts, globals.css.
- Wrote the 8 docs at repo root, every claim anchored to a file path; used tables for commands, tokens, models, checklists; each "do not change casually" rule states its failure mode.

Stage Summary:
- Docs cover: quick start + full command table + structure (README); request lifecycle, ISR/revalidate map (300/120/600/900/3600), blocks pipeline, comparison engine (winnerFor/sortable/direction), auth, consent double gate, settings cache, redirect model with middleware wiring options, trade-offs with upgrade paths (ARCHITECTURE); audiences, business model, 5-type URL map, trust principles, expansion list (PRODUCT); nón lá construction, exact oklch tables light+dark, Fraunces axes constraint, motifs, motion, do-not-change list, anti-slop checklist (DESIGN); block grammar incl. go: rule, 15-block reference, review requirements, tone, admin workflow contract (EDITORIAL_GUIDE); metadata/JSON-LD inventory + no-fake-ratings rule, sitemap/robots/feed, canonical type+slug enforcement, publishing checklist (SEO_GUIDE); affiliate component inventory, offer model, /go router + logging, sponsored rel, demo→real swap steps, AdSlot enablement, CMP caveat (AFFILIATE_INTEGRATION); VPS-vs-managed, Postgres switch, standalone build notes, env table, security checklist, backups, SMOKE_BASE_URL smoke test (HOSTINGER_DEPLOYMENT).
- Could not verify from code / gaps flagged in docs: (1) the /admin UI does not exist yet in the repo (only auth plumbing, bootstrap script, User/Session models); smoke.mjs already expects /admin → 307, which currently fails — documented as known state. (2) NEXT_PUBLIC_ADS_ENABLED and NEXT_PUBLIC_ANALYTICS_PROVIDER appear only in .env.example/comments — no code reads them; docs state the runtime gate is the ads_enabled DB setting and that the analytics adapter is a no-op queue. (3) [label](ref:SLUG) is documented in content-schema.ts comments but NOT implemented in inline-text.tsx (renders as plain text) — flagged in EDITORIAL_GUIDE. (4) SQLite file location: .env.example says file:./db/custom.db and the file exists at repo-root db/ (not prisma/db/); HOSTINGER_DEPLOYMENT tells the operator to verify resolution before scheduling backups. (5) "reviews" smoke page list vs current routes matches; nothing else assumed without source.

---
Task ID: 3-a
Agent: full-stack-developer
Task: Protected /admin area + /api/admin routes

Work Log:
- Read worklog + conventions (schema, auth.ts, content-schema.ts, rate-limit.ts, settings.ts, site.ts, globals.css tokens, existing shadcn set, contact API pattern).
- Created server helpers: `src/lib/admin-api.ts` (guardAdmin = same-origin + requireAdminApi, parseBody Zod helper, prismaErrorMessage P2002/P2003/P2025 mapping, shared slug/id/text/date field schemas); `src/lib/admin-revalidate.ts` (revalidateLists for / + /reviews /best /compare /guides /articles /deals /authors /search; revalidateForArticle → type-path article + category hub via articleTypePaths; revalidateEverything for taxonomy changes; revalidateSettings); `src/lib/admin-client.ts` (client fetch wrapper api() → {ok,data,error}, slugify, toLocalInput, formatDate); `src/lib/admin-articles.ts` / `admin-offers.ts` / `admin-comparisons.ts` (payload schemas + shared mutation helpers — route files may only export HTTP handlers per Next rules).
- Admin chrome: `src/app/admin/layout.tsx` (server, no auth check) → `_components/admin-shell.tsx` (client; desktop sidebar + mobile top bar + nav with Lucide icons, "View site" new tab, logout posting to /api/admin/auth/logout; hides chrome on /admin/login). `_components/`: form-row, status-badge (StatusBadge/ReadBadge), json-field (collapsible JSON textarea validating on blur + parseJsonField), delete-row-button (confirm + DELETE + toast).
- Pages (each protected page calls requireAdminPage itself): /admin → redirect dashboard; /admin/login (server redirect if session; client LoginForm, inline 401/429/403 error, bootstrap note); /admin/dashboard (11 stat cards: published/drafts/reviews/comparisons/authors/categories/merchants/active offers/subscribers/unread messages + affiliate-click hint, 5 recent articles, 5 latest messages); /admin/articles (status filter + title search via GET form, JS filtering for SQLite case-insensitive, sticky-header table in max-h-96 scroll-thin, empty state); /admin/articles/new + [id] → shared client article-form (all spec fields incl. featured switch, datetime-local dates, comma tags, collapsible Blocks/Scores/Sources JSON textareas with helper text for block types + go:OFFER_ID inline links); categories/authors/merchants CRUD tables + create/edit dialogs, slug auto-suggest, delete confirm, FK-friendly 409 toasts; /admin/offers (table + dialog, https-only URL, deal/active switches, click counts); /admin/comparisons list + new/[id] editor pages (items editor with per-item attributes/pros/cons JSON, offer select, order); /admin/redirects (inline create + table, from "/" and to "/"|https:// validation, 301/302); /admin/messages (unread badges, mark read/unread, Dialog full message, auto-mark-read on open, mailto reply); /admin/settings (ads_enabled/demo_mode switches, raw rows table with inline edit, add key/value form).
- API routes under /api/admin (every mutation: guardAdmin → isSameOrigin 403 → requireAdminApi 401 → Zod 400; try/catch 400/500): auth/login (rateLimit login:ip 5/60s, verifyPassword, createSession+setSessionCookie, 401 "Invalid email or password"), auth/logout, articles POST, articles/[id] PUT (full replace of tags connect-or-create / scores / sources + ArticleRevision snapshot per save, all in $transaction, revalidateForArticle), articles/[id]/status POST (auto publishedAt on first publish), categories POST + [id] PUT/DELETE (delete pre-counts articles → 409 "Cannot delete: N articles reference it"), authors (focusAreas comma→string[]→JSON; reviewer SetNull revalidate), merchants (offers count guard), offers (https-only, revalidate /deals + linked article), comparisons POST/[id] PUT (replaceItems transaction, JSON-stringified attributes/pros/cons) /DELETE, redirects POST/[id] DELETE, messages/[id]/read POST, settings PUT (key whitelist or /^[a-z_]{2,40}$/, upsert + invalidateSettingsCache() + revalidate "/", "layout").
- Verification: bunx eslint on all admin files → 0 problems (project-wide lint's only 3 errors are pre-existing in consent-manager.tsx / site-header.tsx, other tasks' files). Bun unit-run of validators: serializeBlocks/parseBlocks roundtrip OK, invalid block → readable error, comparisonSchema OK, offer http rejected / https accepted, article payload datetime-local → Date transform OK. Curl suite: /admin 307→dashboard, /admin/login 200, all protected pages 307→login when signed out, all /api/admin/* 401 without session, wrong-creds login 401. Fixed one bug found by smoke test (bad relative import in comparisons/[id]/page.tsx).
- Not done deliberately: no seed of any admin user (lead bootstraps via npm run admin:bootstrap) so authenticated in-browser flows remain to be smoke-tested by the lead after bootstrap; pre-existing errors in src/app/search/page.tsx ("breadcrumbJsonLd is not defined") and src/app/authors/[slug]/page.tsx ("parseBlocks is not defined") belong to other tasks — flagged here for the lead.

Stage Summary:
- Full /admin area exists and is wired end-to-end: login (rate-limited, scrypt-verified DB sessions) → dashboard → articles editor (JSON blocks validated server-side by content-schema, revisions snapshotted every save, tags upserted, publish/unpublish quick action) → categories/authors/merchants/offers/comparisons/redirects CRUD → contact inbox → settings with cache invalidation + site-wide revalidation. All mutations are API routes with same-origin + session + Zod guards; public pages are revalidated via admin-revalidate helpers (sitemap/feed excluded per plan).
- Login: POST /api/admin/auth/login {email,password} sets dy_admin_session HttpOnly cookie (7d); /admin/* pages call requireAdminPage() and redirect to /admin/login when absent; API routes return 401 JSON. No admin account exists yet — run `npm run admin:bootstrap -- --email … --password …` then sign in at /admin/login.
- Left out (intentional, MVP scope): no revision viewer/restore UI, no article delete, no WYSIWYG (JSON block editor only), no newsletter-subscriber management page, redirects not yet consumed by middleware (documented for future edge config), messages have no delete/assign (read-toggle only).

---
Task ID: 3-a-fix
Agent: full-stack-developer
Task: Fix all TypeScript errors in admin files

Work Log:
- src/lib/admin-api.ts: root-cause fix — parseBody() now generic over `S extends z.ZodType` returning `z.output<S>` (previously `schema: z.ZodType` collapsed every caller's `parsed.data` to `unknown`, which produced the ~90 "data is of type 'unknown'" errors across articles/comparisons/offers/authors/merchants/categories/redirects/messages/settings routes); also removed the `as string | null` cast in optionalTextField (narrowing makes it unnecessary).
- src/app/admin/articles/article-form.tsx: replaced nullable-prop-shaped `ArticleFormArticle` with canonical form-state type `ArticleFormState` — every input-backed field is a string ("" = empty), so inputs never receive null and no `?? ""` defensive code is needed; nullable Prisma fields are converted at both boundaries (edit page null → "", payload "" → null); readingMinutes validated locally as an integer 0–600 before the payload (was string|number hybrid with possible NaN); reviewerId trimmed at the boundary.
- src/app/admin/articles/[id]/page.tsx: builds `ArticleFormState` now — readingMinutes number → String() (or "") at the boundary; toLocalInput already normalized the dates.
- src/app/admin/messages/messages-client.tsx + messages/page.tsx: added `createdAt: string` to MessageRow and pass `m.createdAt.toISOString()` from the server query (type now matches its usage in formatDate cells + dialog).
- No `any`, no `@ts-ignore`, no `@ts-expect-error` anywhere; all other admin route files needed no edits once parseBody's Zod outputs were properly typed.

Stage Summary:
- tsc --noEmit: 0 errors in admin scope (full project also typechecks, exit 0); bun run lint: exit 0.
- Curl against running dev server: GET /admin/login → 200; POST /api/admin/auth/login with wrong creds → 401 {"error":"Invalid email or password"}; POST /api/admin/articles without session → 401 {"error":"Unauthorized"}; dev.log shows clean compiles, protected /admin pages still 307 to login when signed out.

---
Task ID: 2
Agent: Z.ai Code (lead)
Task: Core site build — design system, content model, all public pages, seed

Work Log:
- Prisma schema (20 models incl. User/Session, Article/Revision/Tag, Merchant/AffiliateOffer/AffiliateClick, Comparison/Item, ReviewScore, SourceCitation, NewsletterSubscriber, ContactMessage, Redirect, SiteSetting, MethodologyEntry) + 3 versioned migrations.
- Design system in globals.css: warm-paper oklch tokens (light+dark), Fraunces/Inter via next/font (vietnamese subset, variable, axes:["opsz"] — do NOT add fixed weights), nón lá logo SVG set (evenodd rib knockouts, works at 16px).
- Zod discriminated-union content blocks (15 types) + server ArticleRenderer; comparison engine (src/lib/comparison.ts + client ComparisonTable with sort/direction/winner dots + mobile cards); affiliate components (AffiliateLink/Button rel="sponsored", MerchantOffer, AffiliateDisclosure, AdSlot double-gated, /go/[offerId] 302 click router with anonymous logging).
- All public routes: /, /reviews /best /compare /guides /articles (+[slug]), /[category], /deals, /search, /authors(+[slug]), /about, /contact(+API), /methodology(+[entry]), 8 policy pages, sitemap.xml (31 URLs), robots.txt, feed.xml (6 items), custom 404/error.
- Demo seed (6 articles, 7 offers, 7 merchants, 3 authors, 1 comparison, methodology entry, settings ads_enabled=false) via explicit `npm run seed:demo` only.

Stage Summary:
- KEY BUGS FOUND+FIXED: format.ts self-import deadlocked Turbopack compile forever (0% CPU hang) — never import a module from itself; public/robots.txt conflicted with app/robots.ts; missing breadcrumbJsonLd/parseBlocks/articleCardSelect exports; Fraunces `axes` incompatible with fixed `weight` (must be variable); Reveal got a 2.5s fallback timer so content can never stay hidden.

---
Task ID: 4
Agent: Z.ai Code (lead)
Task: Delegated tasks 3-a (admin) + 3-b (docs); integration fixes

Work Log:
- 3-a (full-stack-developer): full /admin (login, dashboard, articles+form with JSON blocks/scores/sources, categories, authors, merchants, offers, comparisons, redirects, messages, settings) + /api/admin/* (same-origin+session+Zod guards, revalidatePath, revision snapshots, FK-guarded deletes).
- 3-b (general-purpose): README, ARCHITECTURE, PRODUCT, DESIGN, EDITORIAL_GUIDE, SEO_GUIDE, AFFILIATE_INTEGRATION, HOSTINGER_DEPLOYMENT written from actual code.
- Integration fixes: mounted-pattern → useSyncExternalStore hook (use-mounted) + consent store (getConsentSnapshot/subscribeConsent) to satisfy react-hooks/set-state-in-effect; NEXT_PUBLIC_ADS_ENABLED fallback wired into isAdsEnabled; removed undocumented ref: link type; tsconfig excludes for template folders (examples/skills/mini-services); admin type errors fixed via 3-a-fix (generic Zod parseBody).

Stage Summary:
- lint: 0 errors. tsc --noEmit: 0 errors (whole project). All admin pages 307→login signed out, 200 with session; wrong creds 401; unauthenticated API mutations 401.

---
Task ID: 5
Agent: Z.ai Code (lead)
Task: QA (browser-verified), hostile review, packaging

Work Log:
- npm run test (smoke): 30/30 PASS — all public routes 200, 404 for unknown, 302 for /go/*, 307 for /admin, 400 invalid newsletter POST.
- agent-browser QA: homepage (light+dark) renders fully with consent banner; Accept all persists; comparison sort + direction toggle + "(best)" winner dot verified in DOM; review page mobile 390px no horizontal overflow, score dial 8.3 + breakdown + FAQ + sources render; contact form end-to-end (message landed in admin inbox, unread badge); admin browser login → dashboard stats correct; /go/off_meridian_2yr → 302 to declared merchant URL and AffiliateClick row created; console clean, zero page errors.
- QA admin account (LOCAL DEV DB ONLY, delete before production): editor@duyanblog.test / dy-QA-2026-xk7-admin (created via admin:bootstrap, not a default).
- package-lock.json generated (npm install --package-lock-only). .env.example committed. engines node>=20.
- NOT RUN: `npm run build` — forbidden in this sandbox (platform rule); validated via dev server + typecheck + lint + smoke instead. Run it in Claude Code before deploying.

Stage Summary:
- Everything browser-verified works; repo is portable (no Arena-specific code; DATABASE_URL from env; NEXT_PUBLIC_SITE_URL drives canonicals).

---
Task ID: 6
Agent: Z.ai Code (lead) — scheduled webDevReview round 1
Task: Status assessment, QA, feature additions (tags/progress/admin-delete), styling depth

Work Log:
- Status: baseline stable — 30/30 smoke PASS, clean console, server healthy. Chose feature development over bugfixing.
- FEATURE: Tag/topic-cluster pages — /tag/[slug] (published-only article lists, breadcrumbs + ItemList JSON-LD, sitemap inclusion, 404 for unknown tags, empty state); TagChips component added at the end of all 5 article types (reviews/best/compare/guides/articles). Seed corrected: eSIM roundup no longer tagged "hosting"; new "privacy" tag on the VPN guide; reseeded via explicit seed:demo.
- FEATURE: ReadingProgress bar — fixed 3px solid-primary bar, rAF-throttled scaleX transform, on all article pages; verified in browser (scaleX 0 → 0.72 at 60% scroll).
- FEATURE: RSS autodiscovery — buildMetadata now emits <link rel="alternate" type="application/rss+xml"> on every page (added in buildMetadata so page-level alternates don't drop it).
- FEATURE: Admin article DELETE (completes CRUD) — /api/admin/articles/[id] DELETE with session+origin guards, FK cascade note (comparison survives via SetNull), targeted revalidation; Actions column added to admin articles list. DeleteRowButton now router.refresh()es after success (fixes stale-list UX for ALL admin deletes).
- STYLING: print stylesheet (chrome off, ink-on-paper, external link hrefs expanded, sidebar/newsletter hidden); consistent :focus-visible outlines across links/buttons/inputs; h1/h2 text-wrap balance; ArticleCard hover lift (translate + soft shadow).
- Validation: lint 0 errors, tsc --noEmit 0 errors, smoke 30/30 PASS, browser-verified tag page + progress bar + delete auth guard (401 unauthenticated).

Stage Summary:
- New routes: /tag/[slug]; new API: DELETE /api/admin/articles/[id]. Tags now in sitemap (4 tag URLs).
- Incident note (not a code bug): the sandbox reaps the dev server process occasionally — first smoke run after a reseed reported 30 failures because the server was down; restart + rerun passed 30/30. Future rounds: check `ss -ltn | rg 3000` and restart with `(setsid bun run dev </dev/null >/dev/null 2>&1 &)` before testing.

Recommended next steps (priority order):
1. TOC scrollspy active-section highlighting on guides (client TOC wrapper).
2. Reading time auto-calculation on save (admin) instead of manual field.
3. /compare index enrichments (show comparison tables inline as teasers).
4. Consider middleware wiring for the DB Redirect table (currently admin-managed but not enforced at runtime — see ARCHITECTURE.md).
5. Optional: prev/next article navigation within a category.

---
Task ID: 7
Agent: Z.ai Code (lead) — scheduled webDevReview round 2
Task: Status assessment, browser QA, feature development (TOC scrollspy, prev/next, related fill, compare teaser, reading-time auto-calc, "/" shortcut), styling fixes.

Work Log:
- STATUS ASSESSMENT: baseline stable — dev server healthy (port 3000), smoke 30/30 PASS, tsc 0 errors, lint 0 errors. agent-browser QA passed on: home (light + mobile 390px, no overflow), review page (score dial, criteria bars, sources), comparison table (winner dots, CTAs) + mobile stacked cards, search, tag, guide pages, admin login → dashboard with correct stats, cookie consent persistence. No console errors. Verdict: stable phase → feature development round (no bugs blocking).
- FEATURE: TOC scrollspy — new client component `src/components/editorial/toc-nav.tsx` (IntersectionObserver, rootMargin -96px/-66% band, topmost-visible-heading wins, aria-current="location", vermilion left-rail + bold active state, ochre hover). `TableOfContents` (server) now extracts headings and delegates to TocNav; client bundle ships no content. Verified: active section tracks scroll at y=1000/2400/3600 on /guides/choose-a-vpn.
- FEATURE: Prev/next within article type — new query `getAdjacentArticlesByType(type, currentId, reference)` (publishedAt gt/lt neighbours, take 1 each) + server component `src/components/editorial/prev-next.tsx` (hairline 2-col grid: older left, newer right, muted "You are reading the newest/oldest one" empty slot, no-JS). Wired into all 5 article pages (reviews/best/compare/guides/articles), each with targeted placement before footer notes. Browser-verified direction logic on both reviews (Auralis = newest → muted right slot; TerraSIM = oldest → muted left slot).
- FEATURE: Related-reading fallback — `getRelatedArticles` now fills empty grid slots with latest published articles from any category when the same-category pool is < 3. Review pages never render a half-empty 3-col grid.
- FEATURE: /compare index teaser — new query `getComparisonTeasers()`; TypeIndex renders a versus-only "In numbers — The tables behind the verdicts." band with per-item score chips (Cloudpeak 7.8 / Harborstack 7.1) linking to the linked versus article. Copy fix: hero no longer promises "comments" (none exist) — "then disagree with us properly."
- FEATURE: Reading-time auto-calc (admin) — `estimateReadingMinutes(blocks)` in admin-articles.ts (word-count walk skipping url/href/src/alt/credit/id/image keys, 200 wpm, clamp 1–600); POST + PUT /api/admin/articles use it when payload readingMinutes is null/0. Form hint updated ("Leave empty to auto-calculate…≈200 wpm"); EDITORIAL_GUIDE.md note added. E2E-verified via real admin API: PUT with readingMinutes null → 200, DB now holds computed value; article re-rendered with "3 min".
- FEATURE: "/" search shortcut — SiteHeader keydown handler ("/" outside inputs → router.push("/search)"), kbd hint on the search icon (desktop), new client `SearchInput` autofocuses + selects existing query on /search. Verified in browser: pressing / navigated /deals → /search.
- STYLING: homepage "05 Guides" adaptive layout — single-guide case renders FeatureCard (8 cols) + "Why guides" side panel with "Browse all guides" link (4 cols) instead of a half-empty 2-col grid (fixes the empty right column seen in QA). Deals page: removed duplicated badge (external red ribbon + internal amber chip showed "Best overall" twice) — single MerchantOffer chip remains, cards equal height (flex-1), review link now uses articlePath() (was hardcoded /reviews/).
- VALIDATION: tsc --noEmit 0 errors; eslint 0 errors; smoke 30/30 PASS; dev.log clean; agent-browser verified all new UI (desktop + the PrevNext/related flow), zero console errors. No reseed needed; no schema change this round.

Stage Summary:
- New files: src/components/editorial/toc-nav.tsx, src/components/editorial/prev-next.tsx, src/components/search/search-input.tsx. Changed: toc.tsx, queries.ts (2 new queries + related fallback), type-index.tsx, site-header.tsx, search/page.tsx, page.tsx (home), deals/page.tsx, admin-articles.ts, api/admin/articles/route.ts + [id]/route.ts, article-form.tsx, EDITORIAL_GUIDE.md, all 5 [slug] article pages.
- Note: Auralis review readingMinutes changed 9 → 3 (auto-computed) via the e2e admin test — displayed value is now honest to word count. Test artifacts cleaned up; QA admin account unchanged (delete before production).

Recommended next steps (priority order):
1. Middleware wiring for the DB Redirect table (admin-managed but not enforced at runtime — see ARCHITECTURE.md; remaining gap from the original plan).
2. Article revision viewer/restore in /admin (revisions already snapshot on every save).
3. Newsletter subscribers management page in /admin (data exists, no UI).
4. Scrollspy for review/versus pages that have headings (TableOfContents is currently only mounted on guides).
5. Search: swap JS filter for SQLite FTS5 when the corpus grows (documented in ARCHITECTURE.md).

---
Task ID: 8
Agent: Z.ai Code (lead) — scheduled webDevReview round 3
Task: Status assessment, browser QA, feature development (runtime DB redirects, admin revisions viewer/restore, admin subscribers page, review TOC), styling depth.

Work Log:
- STATUS: baseline stable after server reap + restart (known sandbox issue) — smoke 30/30, tsc 0, lint 0. Chose feature development over bugfixing (no blocking bugs found; console clean on all QA pages).
- FEATURE 1 — Runtime DB redirects (closes the LAST gap from the original plan): new `src/proxy.ts` (Next 16 `proxy.ts` convention — middleware's successor; Node runtime; `export const config = { runtime: "nodejs", matcher: [...] }` excluding _next, /api, /go, /admin, feed/sitemap/robots/favicon/images/logo, and dotted file paths). Serves the admin-managed Redirect table: GET/HEAD only, in-memory 30s TTL cache (positive+negative, max 1000 entries), chain resolution up to 3 hops with visited-set loop guard (single hop for the visitor, first hop's status code), query-string preservation for relative targets (UTMs), absolute https targets supported, every failure falls through to normal routing (never breaks a request). Verified via curl: seeded /old-esim-guide → 302 → /best/best-esim-providers, ?utm_source=test preserved, unknown paths 404, / 200; dev.log shows `proxy.ts: 3ms` per request.
- FEATURE 2 — Admin revision viewer/restore: 3 API routes (GET /api/admin/articles/[id]/revisions list of 50 latest with byte/block counts; GET .../revisions/[revisionId] full snapshot with Zod-parsed blocks; POST .../revisions/[revisionId]/restore — revalidates stored blocks against the CURRENT content grammar (409 on stale format), snapshots current title+blocks as "Auto-backup before restore" revision, then updates article + revalidates paths). New client component `revisions-section.tsx` in the article edit page: collapsible section, lazy-loads on expand (event handler, not effect — react-hooks/set-state-in-effect fix), sticky-header table (date/title/note/blocks/size), View dialog with pretty-JSON preview + Copy JSON + Restore, separate confirm dialog. E2E-verified in browser: restore created the auto-backup row, page reloaded with restored content. `api()` helper in admin-client.ts extended with "GET".
- FEATURE 3 — Admin subscribers page: /admin/subscribers (server: requireAdminPage + list + count) + `subscribers-client.tsx` (search by email/source with "N of M shown" live region, CSV export via Blob with quoted-escaping, per-row DeleteRowButton). API DELETE /api/admin/subscribers/[id] with guardAdmin. Nav item "Subscribers" (AtSign icon) added to admin-shell; new ConfirmedBadge (Confirmed/Pending) in status-badge.tsx — replacing the borrowed Read/Unread badge. Dashboard "Subscribers" StatCard now links to the page (StatCard gained optional href + hover/focus styles). E2E-verified: 3 test subscribers created via public API, search filter 1-of-3, delete removed the row + DB row.
- FEATURE 4 — TOC scrollspy on reviews: TableOfContents mounted at the top of the sticky sidebar on /reviews/[slug] (renders only when ≥2 h2 headings; auralis-note-14-review has 4). Browser-verified: numbered TOC renders, active section tracks scroll (aria-current="location" on "03 Battery and display"), guides already had it.
- STYLING (deep polish): (1) Editorial drop caps — ArticleRenderer gained `dropCap` prop (first-paragraph ::first-letter in Fraunces 600, 3.4em, vermilion, floated); enabled on /guides/[slug] + /articles/[slug]; browser-verified computed style float:left/57.8px and screenshot. (2) Analogue paper grain — fixed body::after SVG feTurbulence noise veil, opacity 0.032 light / 0.045 dark, pointer-events none, disabled in print. (3) text-wrap: pretty on .prose-body. (4) Zebra striping + hover on article table block rows (odd:bg-muted/25). (5) BackToTop client component (rAF-throttled scroll listener, appears after 720px, smooth scroll, hidden in print) wired into all 5 article pages — click-verified scrolls to 0. (6) Footer watermark — rotated 288px nón lá LogoMark at 6%/5% opacity, aria-hidden wrapper, bottom-right; light+dark screenshots verified.
- VALIDATION: lint 0 errors (fixed 1 new: effect setState → handler-based lazy load), tsc --noEmit 0 errors, smoke all PASS incl. 2 new checks (/admin/subscribers 307, /old-esim-guide 302 → script now 33 checks), dev.log clean, zero console errors across all QA'd pages.
- DOCS: ARCHITECTURE.md §8 rewritten (proxy.ts is live; removed "nothing reads this table" + option list; documented cache/hops/query/loop behaviour; trade-off row swapped to chain-protection note). README structure tree (+proxy.ts, +admin routes) and "Known state" section updated (admin no longer "not built"). EDITORIAL_GUIDE workflow §9 rewritten for the real UI (revision history/restore, reading-time auto-calc). AFFILIATE_INTEGRATION §8 note: legacy redirects are navigation, separate from /go, work regardless of consent.
- BUGFIX note (tooling, not app): Turbopack dev watcher missed a globals.css edit until a manual mtime bump — new .dropcap/text-wrap rules were absent from the served chunk while base-layer rules applied. If CSS looks stale after editing globals.css, touch the file or clear .next.

Stage Summary:
- New files: src/proxy.ts; src/app/api/admin/articles/[id]/revisions/route.ts + [revisionId]/route.ts + [revisionId]/restore/route.ts; src/app/admin/articles/[id]/revisions-section.tsx; src/app/api/admin/subscribers/[id]/route.ts; src/app/admin/subscribers/{page.tsx,subscribers-client.tsx}; src/components/editorial/back-to-top.tsx.
- Changed: admin-shell (nav), status-badge (ConfirmedBadge), dashboard/page (linkable StatCards), admin-client (GET), article-renderer (dropCap + zebra), all 5 article pages (BackToTop), guides+articles pages (dropCap), reviews/[slug] (TOC), globals.css (grain/dropcap/pretty/print), smoke.mjs (+2 checks), ARCHITECTURE.md, README.md, EDITORIAL_GUIDE.md, AFFILIATE_INTEGRATION.md.
- All original-plan gaps now closed: DB redirects enforced at runtime; revisions browsable/restorable; subscribers manageable; TOC on both sidebar layouts.
- Demo data: 2 fictional subscribers remain (hai.nguyen@/linh.tran@example.vn) so the subscribers page is non-empty; 1 extra "Auto-backup before restore" revision exists on the Auralis article from the restore e2e test. QA admin account unchanged (editor@duyanblog.test — delete before production).

Recommended next steps (priority order):
1. Sitemap/RSS for tag + subscriber-visible niceties are done; consider per-category RSS feeds (feed.xml?category=slug).
2. Comparison table: sticky header row + column highlighting on hover for desktop scannability.
3. Admin: revision diff view (side-by-side title/blocks summary instead of raw JSON).
4. Middleware/proxy: add a redirect-chain validator in the admin redirects form (warn when `to` matches another redirect's `from` and hop count > 3).
5. Search: FTS5 when corpus grows (documented path).

---
Task ID: 9
Agent: Z.ai Code (lead) — scheduled webDevReview round 4
Task: Status assessment, browser QA, feature development (comparison-table upgrades, per-category RSS, share button, admin redirect-chain validator), styling depth.

Work Log:
- STATUS ASSESSMENT: baseline stable — dev server healthy, tsc 0 errors, lint 0 errors, smoke 30/30, browser QA sweep of home/compare/review pages found NO blocking bugs (an "empty hero" on first screenshot was a pre-paint capture; verified hero renders at opacity 1 immediately after load). Chose feature development over bugfixing.
- FEATURE 1 — Comparison table upgrades (core engine): (a) sticky thead — product names/scores/CTAs stay pinned under the site header (top-16) while scrolling long tables; implemented `useHasOverflowX` (ResizeObserver) that switches the wrapper between overflow-x-auto (when horizontal scrolling is needed) and overflow-visible (when not) because an overflow scroll-container would trap the sticky element; (b) column hover highlight — event-delegated mouseover sets hoverCol, cells carry data-col, tint applied via new `.col-tint` utility (inset box-shadow 9999px color-mix primary 6%) which composites over bg-card/odd-stripes/bg-inherit without replacing them; (c) "Editors' pick" vermilion chip (Medal icon) on the highest-scored item in editors' order, desktop header + mobile cards; (d) score meters — hairline track + vermilion fill (score×10%) with role="img" aria-label under each score.
- FEATURE 2 — Per-section RSS: /feed.xml?category=<slug> filters by category (channel title/link/description adapt, per-item <category> tags, atom:link self, unknown slug → 404); buildMetadata gained `rss` override so category pages autodiscover /feed.xml?category=<slug>; category hub hero shows a "Subscribe to this section" chip (Rss icon, vermilion hover border).
- FEATURE 3 — Share button: new client `src/components/editorial/share-button.tsx` (Web Share API on supporting devices → clipboard fallback with toast "Link copied", destructive toast fallback with raw URL when clipboard is blocked; icon Link2→Check after copy, hydration-safe — no navigator-dependent rendering); mounted in the shared ArticleHeader meta row (sm:ml-auto right-aligned, hairline divider) so all 5 article types get it.
- FEATURE 4 — Admin redirect-chain validator: redirects-client now computes chain analysis live while typing (useMemo, no effect-state): duplicates and self-loops blocked; walks the redirect graph (including the hypothetical new row) in both directions; >3 hops blocked with the message matching the proxy's actual MAX_HOPS=3 behaviour; 2–3 hops get an amber warning with full path preview (e.g. "/legacy/esim → /old-esim-guide → /best/best-esim-providers"); loop detection via visited-set restructure (resolveChain returns {chain, looped}); table badges rows that chain (×2/×3/loop with title tooltips).
- STYLING: chip made block-level (flex w-fit) so it never flows inline with the product name; .col-tint uses inset shadow rather than bg class to coexist with bg-inherit sticky row headers; sticky header z-order: corner cell z-30, item cells z-20, body row headers z-10 (below site header z-50).
- VALIDATION: tsc --noEmit 0 errors; eslint 0 errors; smoke extended with 2 RSS checks (35 total) — ALL PASS (one full-failure run mid-round was the known sandbox server reap; restarted with setsid and re-ran clean); browser-verified: sticky thead at scrollY=1979, column tint compositing over stripes, Editors' pick + meters on desktop and mobile 390px (0 horizontal overflow), category RSS chip + <link rel=alternate> pointing at feed.xml?category=software, share button e2e (Copied state + toast), chain validator e2e (2-hop warning, duplicate block, self-loop block, real 4-hop block created via API then cleaned up — DB back to the single seeded redirect), console clean, dev.log clean.
- DOCS: ARCHITECTURE.md §8 (admin chain validator documented; trade-off row updated to "client-side only — mirror in Zod if multiple editors"), SEO_GUIDE.md §3 (per-section feeds + autodiscovery + chip).

Stage Summary:
- New files: src/components/editorial/share-button.tsx. Changed: comparison-table.tsx (sticky/hover/pick/meters), globals.css (.col-tint), feed.xml/route.ts (category feeds), seo.ts (rss override), [category]/page.tsx (metadata + chip), article-header.tsx (share), redirects-client.tsx (validator + badges), smoke.mjs (+2), ARCHITECTURE.md, SEO_GUIDE.md.
- No schema change, no reseed needed. QA admin account unchanged (editor@duyanblog.test — delete before production).
- Incident note: sandbox reaped the dev server mid-round (second occurrence) — smoke run failed wholesale with "fetch failed"; recovery = `(setsid bun run dev </dev/null >/dev/null 2>&1 &)`, wait for port 3000, re-run.

Recommended next steps (priority order):
1. Admin revision diff view (side-by-side title/blocks summary instead of raw JSON) — revisions infrastructure is fully in place.
2. Mirror the redirect-chain validator into the POST /api/admin/redirects Zod schema (server-side enforcement) if multi-editor workflows become real.
3. Search upgrades: category filter chips on /search + FTS5 when corpus grows (documented path).
4. Comparison: remember sort preference per session (localStorage) or deep-linkable sort (?sort= param).
5. Home page: "Latest from the deals desk" strip wired to active offers (deals data exists, home lacks a deals teaser).

---
Task ID: 10
Agent: Z.ai Code (lead) — scheduled webDevReview round 5
Task: Status assessment, browser QA, feature development (server-side redirect enforcement, revision diff view, search chips + highlighting, deep-linkable comparison sort, home deals desk), styling depth.

Work Log:
- STATUS ASSESSMENT: baseline stable — dev server healthy, tsc 0 errors, lint 0 errors, smoke 35/35 PASS, agent-browser sweep (home light, deals, console) found NO blocking bugs. Chose feature development over bugfixing. Found + fixed one pre-existing a11y bug along the way (dangling aria-labelledby on home sections, see STYLING).
- FEATURE 1 — Server-side redirect-chain enforcement: new shared pure lib `src/lib/redirect-chain.ts` (normalizePath, resolveChain with visited-set, analyzeChain → {blocked, warning, hops}, hopCountsFor; MAX_HOPS=3 mirrored from proxy.ts). POST /api/admin/redirects now re-runs analyzeChain over ACTIVE rows (runtime serves active only) and returns 400 with the exact client messages (duplicate / self-loop / >3 hops); success may carry a `warning` (2–3 hops) which the admin toast displays. redirects-client.tsx refactored onto the shared lib (duplicate check considers ALL rows since the DB path is unique; hop badges use active rows only). E2E via curl with a real session: duplicate 400, self-loop 400, hop-1→hop-2 created (no warning), hop-2→hop-3 created (2-hop warning in response body), hop-3→seeded-redirect BLOCKED 400 with full 4-hop path preview (/hop-1 → … → /best/best-esim-providers), /into-chain→/hop-1 allowed with 3-hop warning. Test rows deleted afterwards; seeded /old-esim-guide still 302s correctly.
- FEATURE 2 — Admin revision diff view: RevisionsSection now receives `current={{title, blocks}}` (parsed) from the edit page. View dialog rebuilt with Tabs: "Summary diff" (default) computes a pure-client diff — identical verdict banner, "Restoring this snapshot would bring back/remove …" list (title changes, gained/lost headings, gained/lost block-type composition, emerald vs vermilion tints), stat strip (Words vs with ±Δ, Blocks vs, First-change block index) and side-by-side snapshot/current heading outlines (§ / – level markers); "Raw JSON" tab keeps the pretty-print + Copy JSON. E2E: made a real title change via the admin form (→ new revision), opened the OLD revision — diff correctly showed "bring back the title … (current: '… — QA diff check')", 509 vs 509 words ±0, identical outlines; then restored via the dialog → page reloaded with the original title, auto-backup revision created. Identical-snapshot case verified too ("nothing would change on restore").
- FEATURE 3 — Search upgrades (/search): new `cat` searchParam + chip row (All sections + each category, vermilion active state, aria-current, q preserved via hidden input on resubmit); filtered empty state offers "Try all sections"; case-insensitive query-term highlighting via new server-safe `Highlight` component (<mark>, regex-escaped, applied through ArticleRow's optional `highlight` prop) + `mark` styling in globals.css (sun/42% background, box-decoration-break clone). Verified: ?q=esim highlights "eSIM" in titles; ?cat=software shows active chip + "Nothing for 'esim' in Software & AI"; mobile 390px chips wrap cleanly.
- FEATURE 4 — Deep-linkable comparison sort: sort state moved from useState to the URL (?sort=<attr>&dir=high|low) via useSyncExternalStore (getServerSnapshot = editors' order → hydration-safe; popstate + custom duyanblog:sort event; replaceState on change so sharing the URL shares the sort; bogus/stale labels fall back to editors' order). Verified: select → URL updates + rows reorder (Renewal price $16.99 first on high, $6.50 first on low after reload with ?dir=low), unknown label → editors' order, zero console errors.
- FEATURE 5 — Home "From the deals desk" (new section 05): wired to active isDeal offers (take 3, merchant included) with editorial hairline rows — merchant eyebrow, offer label, sun-tinted badge chip, dealText, amber price + USD, vermilion "View deal" AffiliateButton (rel=sponsored, /go 302 + click logging re-verified, test click rows cleaned), affiliate footnote with disclosure link. Guides renumbered 05→06. Empty-safe (section hidden when no active deals).
- STYLING/A11Y: FIXED dangling aria-labelledby — SectionHeading gained an optional `id` applied to its h2; home sections now pass picks-title/deals-title/guides-title/sections-title (the div#sections-title duplicate removed). Diff-dialog rows polished (flex-wrap items-baseline, gap). `data-scroll-behavior="smooth"` added to <html> (Next 16 router smooth-scroll warning). Dark-mode verified for deals strip + diff dialog.
- VALIDATION: tsc --noEmit 0 errors; eslint 0 errors; smoke extended with /search?q=esim&cat=software (36 checks) — ALL PASS after one documented server-reap restart; browser-verified all five features (desktop + 390px, light + dark), console clean, dev.log clean.
- DOCS: ARCHITECTURE.md §9 trade-off row updated — chain rules now enforced on both sides via the shared lib (was "client-side only").
- Demo-data note: the Auralis article now carries 4 revisions (2 historical + "QA diff check" artifacts + auto-backup) — harmless demonstration data; QA admin account unchanged (editor@duyanblog.test — delete before production).

Stage Summary:
- New files: src/lib/redirect-chain.ts, src/components/editorial/highlight.tsx.
- Changed: api/admin/redirects/route.ts (server enforcement), admin/redirects/redirects-client.tsx (shared lib), admin/articles/[id]/page.tsx + revisions-section.tsx (diff view), search/page.tsx (chips + cat filter), components/editorial/article-card.tsx (highlight prop), components/comparison-table.tsx (URL sort), app/page.tsx (deals desk + renumber + aria ids), components/editorial/section-heading.tsx (id prop), app/globals.css (mark), app/layout.tsx (data-scroll-behavior), scripts/smoke.mjs (+1 = 36), ARCHITECTURE.md.
- All five round-9 recommendations implemented: revision diff view, server-side chain mirror, search chips, deep-linkable sort, home deals strip.

Recommended next steps (priority order):
1. Newsletter double opt-in / confirmation flow (subscribers currently land as Pending; no confirmation email infrastructure — documented decision needed).
2. Per-tag RSS or JSON feed? Tags are in sitemap; feeds exist per category only.
3. Admin dashboard: recent AffiliateClicks widget (click log data exists, no UI).
4. Image handling: hero/pick images are fixed /images/*.png paths — consider an upload endpoint or at least path validation hints in the admin form.
5. Production readiness sweep in Claude Code: `npm run build` (forbidden in this sandbox), migrate SQLite → Postgres per HOSTINGER_DEPLOYMENT.md, delete the QA admin account.

---
Task ID: 11
Agent: Z.ai Code (lead) — scheduled webDevReview round 6
Task: Status assessment, browser QA, bug fixing (leftover half-built media library), feature development (newsletter double opt-in, per-tag RSS, media picker polish), styling depth.

Work Log:
- STATUS ASSESSMENT: read worklog (round 10 = 36 smoke checks green, 5 recommendations listed). Baseline tsc found **2 pre-existing errors**: a previous session had started the media-library feature (`src/lib/media.ts` written, `media: string[]` added to `ArticleFormOptions`) but died before wiring callers/UI. Prioritised completing it over new work (covers recommendation #4).
- BUGFIX (QA-found): `listPublicImages()` returned `/public/images/…` instead of `/images/…` (relative-to-cwd bug; the lib had never been exercised). Fixed to build paths relative to `public/images`. This was invisible until the datalist rendered.
- FEATURE A — Media library in the article editor (completes the leftover): new `src/app/admin/articles/hero-media-field.tsx` — Input + datalist of library paths, "Browse" dialog (thumbnail grid, scroll-thin), live advisory status line (in library / not in library / remote-URL warning / load failure via img onError with keyed remount), live preview thumbnail (aspect-video, w-48). Both admin article pages (`new`, `[id]`) call `listPublicImages()` in Promise.all and pass `media`. Styling depth: active path gets a vermilion border + "IN USE" chip (aria-pressed), hover/focus rings consistent.
- FEATURE B — Newsletter double opt-in (recommendation #1, decision made): migration `20260928173719_newsletter_double_opt_in` adds `confirmToken @unique` + `confirmExpiresAt`; `confirmed` default flipped to false. POST /api/newsletter rewritten: new/pending addresses get a fresh 24-byte token + 48h expiry; confirmed re-subscribe is a no-op (`alreadyConfirmed: true`); unsubscribe tokens never rotated; **non-production only** returns `confirmUrl` in the body (documented decision — no SMTP infra; production emails it). New `/newsletter/confirm` page (force-dynamic, noindex): validates token + expiry, flips confirmed, burns the token (replay-safe); five states (done/already/expired/invalid/missing) on one editorial page with sun motif. NewsletterForm copy updated ("Almost there — check your inbox…") + dev-shortcut link (only when confirmUrl present). Admin subscribers: confirmToken exposed, MailCheck "copy confirmation link" action on pending rows, header copy updated, CSV exports confirmed/pending, pending rows get amber tint + "AWAITING OPT-IN" micro-label. Dashboard Subscribers stat now counts confirmed only with a pending hint.
- FEATURE C — Per-tag RSS (recommendation #2): `/feed.xml?tag=<slug>` (channel `— #Tag`, items carry section + #tag categories, unknown slug 404, category+tag together → 400); tag pages autodiscover via buildMetadata `rss` override and show a "Follow this tag" chip when they have stories.
- STYLING/DETAILS: confirmed "red dot" under header search = the intentional `/` kbd hint (not a bug); media dialog grid + preview polish; subscribers pending-row tint; dev.log checked repeatedly, console clean everywhere.
- VALIDATION: tsc 0 errors, eslint 0 errors/0 warnings, smoke extended 36 → **42 checks ALL PASS** (+4 tag-feed checks, +4 double-opt-in e2e: subscribe→confirmUrl→confirm→replay, bogus token). agent-browser verified: media field (status/dialog/pick/failure/"In use"), newsletter flow e2e via the real footer form → confirm page "You're in.", admin subscribers pending UI, tag chip desktop + 390px + dark, confirm page desktop + 390px, zero horizontal overflow, zero console errors. One documented dev-server reap mid-round (recovered via setsid restart, third occurrence).
- DOCS: ARCHITECTURE.md §9 "Newsletter double opt-in" added (§10 = trade-offs renumbered), incl. the non-production confirmUrl decision and the media library; SEO_GUIDE.md §3 feed row documents per-tag feeds + tag chip.
- CLEANUP: QA subscriber rows (smoke-*, browser-qa@, pending-demo@ @duyanblog.test) deleted — list back to the 2 seeded demo subscribers. QA admin password re-bootstrapped via the documented CLI (editor@duyanblog.test — still delete before production). Article hero value left untouched (QA mutations discarded by reload, nothing saved).

Stage Summary:
- New files: src/app/admin/articles/hero-media-field.tsx, src/app/newsletter/confirm/page.tsx, prisma/migrations/20260928173719_newsletter_double_opt_in/.
- Changed: src/lib/media.ts (path bug), admin/articles/{article-form,new/page,[id]/page}, api/newsletter/route.ts, components/newsletter-form.tsx, admin/subscribers/{page,subscribers-client}, admin/dashboard/page.tsx, feed.xml/route.ts, tag/[slug]/page.tsx, scripts/smoke.mjs (+6 = 42), ARCHITECTURE.md, SEO_GUIDE.md, prisma/schema.prisma.
- All three features QA'd in-browser; worklog recommendations #1, #2, #4 from round 10 are now done.

Recommended next steps (priority order):
1. SMTP/email provider integration (Resend/Postmark) so double opt-in actually emails the confirm link — the only missing piece; remove the dev confirmUrl shortcut once wired.
2. Image upload endpoint (admin) writing into public/images — the picker reads the folder, so uploads would appear automatically.
3. Admin comparisons editor: image field for ComparisonItems could reuse the same media picker (extract it to a shared component).
4. Comparison: remember sort preference per session (localStorage) on top of the ?sort= deep link.
5. Production readiness sweep in Claude Code: `npm run build`, SQLite → Postgres per HOSTINGER_DEPLOYMENT.md, delete the QA admin account, flip `demo_mode` setting.

---
Task ID: 12
Agent: Z.ai Code (lead) — scheduled webDevReview round 7
Task: Status assessment, agent-browser QA + bug fixing (image-format regression), then feature work: media upload endpoint + shared picker, email transport, sort persistence, loading skeletons, JSON Feed, styling details.

Work Log:
- STATUS ASSESSMENT: read worklog (round 11 ended green: 42 smoke checks, tsc/eslint clean). Baseline re-verified: tsc 0, eslint 0, smoke 42/42, dev.log healthy.
- BUGFIX (agent-browser QA found): every image in public/images (all 11) was JPEG data saved with a .png extension — the Next.js image optimizer rejected the mismatch and returned **400 for every /_next/image request** across the site (first caught as 3 "broken" images on the comparison table). Fixed by re-encoding all files to true PNG (sharp, palette-compressed, filenames unchanged so no DB references moved); optimizer now 200s. Also purged .next/cache/images. Root cause is likely the original image generation tool; the new upload endpoint now byte-sniffs to keep this class of bug out permanently (and admin previews surface load failures live). QA note: naive `img.complete && naturalWidth===0` checks also flag lazy-loaded offscreen images — verify with forced eager load or fetch status.
- Dev server reaped twice this round (documented sandbox issue, 4th/5th occurrence); both times recovered with the setsid restart. Smoke-suite "fetch failed" storms = server dead, not app bugs.
- FEATURE A — Media uploads + shared picker: new `POST /api/admin/media` (admin-guarded via guardAdmin, same-origin): one `file` field + optional single-segment `folder` (strictly validated, no traversal); layered validation = extension whitelist → byte-signature sniff (PNG/JPEG/WebP/GIF/AVIF/SVG magic) with reported-MIME fallback → 5 MB cap → slugified name with -2/-3 collision suffixes (never overwrites). New shared `MediaField` (`src/components/admin/media-field.tsx`) generalizes the old HeroMediaField (deleted) and adds drag-and-drop / pick-to-upload inside the browse dialog: uploading spinner, role=alert error line, returned path auto-selected, session uploads appear in the grid with a "New" chip; "In use" marker + live preview + datalist + status line preserved. Wired into the article hero AND every comparison-item image (both editor pages now load `listPublicImages()` and pass `media`). E2E via browser file-input upload: 74-byte valid PNG → field became `/images/qa-upload-test.png`, grid showed the New tile; artifact + QA edit discarded afterwards.
- FEATURE B — Email transport: new `src/lib/email.ts` — `sendMail()` with three providers: RESEND_API_KEY set → plain fetch POST to Resend HTTP API (no SDK, EMAIL_FROM configurable); no key + non-production → console transport (logs full message, delivered:false); no key + production → disabled with loud warning. `newsletterConfirmEmail()` ships branded plain-text + minimal inline-CSS HTML. Newsletter route now actually sends the double-opt-in email after token creation; the dev confirmUrl shortcut only appears when the console transport was used (nothing was really emailed) — a configured provider never echoes the URL in any environment. smoke logs show `[email:console]` lines. .env.example documents RESEND_API_KEY/EMAIL_FROM.
- FEATURE C — Sort persistence: comparison tables remember the reader's last sort (`duyanblog:sort` in localStorage, global, try/catch-guarded): applies on return when no ?sort= deep link is present and the label exists in that table; deep links always win; clearing to editors' order removes the preference. Verified in browser: set → leave → return applies it; deep link overrides; clear → pref null (fixed a first-pass bug where clear didn't removeItem — caught by re-testing).
- FEATURE D — Loading skeletons + details: shared `SectionSkeleton`/`ArticleSkeleton` (`src/components/editorial/section-skeleton.tsx`) mirroring the real editorial layout (eyebrow + display bars + card grid / prose + TOC), aria-busy+role=status; loading.tsx added for all 6 section indexes + 6 story/tag routes + search (13 files). globals.css: `h2/h3/h4[id], [data-anchor] { scroll-margin-top: 6rem }` so TOC/share anchor jumps clear the sticky header.
- FEATURE E — JSON Feed 1.1 at `/feed.json` mirroring RSS scopes (?category / ?tag, same 404/400 guards, 20 latest, same cache headers); buildMetadata gained a `jsonFeed` autodiscovery override; category + tag hubs emit it.
- VALIDATION: tsc 0 errors; eslint 0 errors; smoke extended 42 → **47 checks ALL PASS** (+4 JSON Feed incl. valid-1.1 structure/scope/404/400, +1 unauthenticated POST /api/admin/media → 401). agent-browser verified: media picker (dialog/grid/in-use/New/upload-e2e), sort persistence flow, compare + article pages render with zero horizontal overflow; dev.log checked repeatedly (only expected [email:console] lines). QA subscribers (7 smoke-* rows) deleted — list back to the 2 seeded demo subscribers.
- DOCS: ARCHITECTURE.md §9 rewritten for the email transport + new §9b "Media library & uploads" + trade-off row for local-filesystem uploads; SEO_GUIDE.md feed table gained the /feed.json row.

Stage Summary:
- New files: src/app/api/admin/media/route.ts, src/lib/email.ts, src/components/admin/media-field.tsx, src/components/editorial/section-skeleton.tsx, src/app/feed.json/route.ts, 13× loading.tsx.
- Changed: src/app/api/newsletter/route.ts (real email send), src/components/comparison-table.tsx (localStorage pref), src/lib/seo.ts (jsonFeed), tag/[category] pages (autodiscovery), admin/articles/article-form.tsx + admin/comparisons/{comparison-editor,new/page,[id]/page} (shared picker), globals.css (scroll-margin), scripts/smoke.mjs (+5 = 47), .env.example, ARCHITECTURE.md, SEO_GUIDE.md. Deleted: admin/articles/hero-media-field.tsx. Re-encoded: all 11 public/images/*.png to true PNG.
- Round-11 recommendations: #2 (upload endpoint) DONE, #3 (shared picker in comparisons editor) DONE, #4 (sort persistence) DONE, #1 (email provider) DONE at the transport level — Resend needs only RESEND_API_KEY set in production.

Recommended next steps (priority order):
1. Set RESEND_API_KEY on the production host + verify EMAIL_FROM with a real domain sender; delete the dev confirmUrl shortcut trigger path once live (it's env-gated already, so optionally keep).
2. Production readiness sweep in Claude Code: `npm run build`, SQLite → Postgres per HOSTINGER_DEPLOYMENT.md, delete the QA admin account (editor@duyanblog.test), flip demo_mode setting.
3. Media library management page (list/delete/rename uploads — currently picker-only; a stray upload can only be removed on disk).
4. Newsletter: admin "send test email" action + a "resend confirmation" button on pending subscriber rows once the provider is live.
5. Consider per-image width/height hints or a build-time manifest to eliminate the last layout-shift risk on slow ISR hits.

---
Task ID: 13
Agent: Z.ai Code (lead) — scheduled webDevReview round 8
Task: Status assessment, agent-browser QA, then feature work: media library management page, newsletter admin actions (resend + test email), styling details (print refinements), dashboard media stat, docs.

Work Log:
- STATUS ASSESSMENT: read worklog (round 12 ended green: 47 smoke checks, tsc/eslint clean, recommendations listed). Baseline re-verified: tsc 0 errors, eslint 0 errors, smoke 47/47, dev server healthy. agent-browser sweep of 18 public+admin routes found ZERO console errors and zero horizontal overflow. Dashboard "Recent affiliate clicks" widget from round 10's list turned out to already exist — so the two genuinely open worklog items were the media management page and the newsletter admin actions. Chose feature development.
- BUGFIX (QA-caught, real SEO bug): `src/lib/seo.ts` fell back to `/og-default.png` but the file lives at `/images/og-default.png` — every page WITHOUT an explicit og:image (home, category hubs, policy pages…) emitted a broken og:image URL (verified `/og-default.png` → 404). Fixed the fallback to `/images/og-default.png`; home now emits a 200-resolving og:image. SEO_GUIDE.md row corrected too. The bug surfaced BECAUSE the new media page showed og-default.png as "Unused — safe to delete", which would also have broken the site — leading to the next feature.
- FEATURE A — Media library management page (`/admin/media`, nav "Media", completes round-12 recommendation #3): new `src/lib/media-usage.ts` builds a path → refs map via parallel queries (Article.heroImage + image/pick blocks JSON, Category.heroImage, ComparisonItem.imageUrl — exact-path matching, guarded JSON parse) plus CODE_REFERENCED paths (og-default.png is code-protected with a "Site default OG image (code)" ref). Server page attaches size + mtime per file. Client grid: 16:9 thumbnails with "IN USE"/"UNUSED" chips (emerald/amber, dashed border for unused), name/kind/size/added-date, usage chips linking to the referencing admin pages (max 2 + "+n more"), copy-path, open-full-size, confirm-dialog delete. Upload dropzone (drag + pick) reuses POST /api/admin/media; uploads appear instantly with a "New" chip. Controls: search, All/In-use/Unused filters with counts, sort (name/newest/largest), "x of y shown". Header line: file count · on-disk total · used/unused split.
- NEW API — `DELETE /api/admin/media?path=…` (admin-guarded, same-origin): lexical path containment (must start `/images/`, normalize+resolve inside public/images — `/images/../x` → 400 escape), then a SERVER-SIDE usage re-check → 409 + the exact refs (a stale client can never orphan a page), then unlink; ENOENT → 404. E2E: 409 for the Auralis hero with the exact ref label; traversal probes (4 shapes) all refused; unauth DELETE → 401; upload (74-byte valid PNG via browser file input) → tile appeared → dialog delete → file gone from disk + grid; 409-in-UI shows a destructive toast naming the referencing pages. og-default.png delete now refused with the code ref.
- FEATURE B — Newsletter admin actions (round-12 recommendation #4): `POST /api/admin/subscribers/[id]/resend` (pending rows only) rotates the confirm token (old links die immediately), re-emails the branded confirmation, returns the fresh token (UI row is patched — the copy-link button stays truthful) and, mirroring the signup route's policy, the confirmUrl ONLY on the dev console transport. Subscribers page: "Send" icon button on pending rows with per-row spinner; delivered → success toast, console transport → toast + auto-copy the fresh link. `POST /api/admin/email/test` + `adminTestEmail()` template: sends a branded probe to the signed-in admin via the exact confirmation path; Settings gained an "Email transport" card showing the live provider (Resend live / Console dev / Disabled — derived from env, mirroring sendMail's priority) with a Send-test-email button (first implementation 502'd on the console transport because delivered:false was treated as failure — fixed: console is success-with-delivered:false, real failures are 502). E2E: test email logged with "Requested by: QA Editor"; resend flow verified (email logged, old confirm link dead, toast correct).
- FEATURE C — Styling details: print CSS gained `print:hidden` on prev/next nav and the share button (reading-progress and back-to-top already had it) so printed articles are pure editorial content; dashboard gained a "MEDIA FILES 11 · images under /images" stat card linking to /admin/media. Media page itself is a new styled surface consistent with the admin editorial language (THE DESK eyebrow, hairline borders, vermilion accents, tabular-nums).
- VALIDATION: tsc 0 errors; eslint 0 errors; smoke extended 47 → **50 checks ALL PASS** (+unauth DELETE 401, +traversal-never-2xx, +/admin/media 307 redirect). Smoke header documents that back-to-back runs can trip the newsletter rate limiter (5/60s) — observed and confirmed as limiter-working-as-designed, not flakiness. agent-browser verified: media page desktop + 390px + dark (no overflow), unused-filter state, delete/refusal flows, settings card, dashboard stat; console clean; dev.log clean. Dev server reaped once mid-round (6th documented occurrence, setsid restart).
- DOCS: ARCHITECTURE.md §9 gained "Admin actions" (resend token-rotation semantics, test-email probe, console-transport response contract); §9b gained DELETE endpoint + media management page paragraphs. SEO_GUIDE.md og-default path fixed.
- CLEANUP: 5 QA subscriber rows (smoke-*, resend-qa@) deleted — back to the 2 seeded demo subscribers; QA test PNG deleted from the library via the feature itself; QA admin password re-bootstrapped via the documented CLI (editor@duyanblog.test — still delete before production).

Stage Summary:
- New files: src/app/admin/media/{page,media-client}.tsx, src/app/api/admin/subscribers/[id]/resend/route.ts, src/app/api/admin/email/test/route.ts, src/lib/media-usage.ts.
- Changed: api/admin/media/route.ts (DELETE handler), admin/_components/admin-shell.tsx (Media nav), admin/subscribers/subscribers-client.tsx (resend action), admin/settings/{page,settings-client}.tsx (transport card + probe), admin/dashboard/page.tsx (media stat), src/lib/email.ts (adminTestEmail), src/lib/seo.ts (OG fallback FIX), components/editorial/{prev-next,share-button}.tsx (print:hidden), scripts/smoke.mjs (+3 = 50), ARCHITECTURE.md, SEO_GUIDE.md.
- Round-12 recommendations: #3 (media management page) DONE, #4 (newsletter test email + resend) DONE at the transport/UI level. #1 (set RESEND_API_KEY in production) remains an ops task, #2 remains the Claude-Code production sweep, #5 (per-image dimension hints) remains open.

Recommended next steps (priority order):
1. Production readiness sweep in Claude Code: `npm run build`, SQLite → Postgres per HOSTINGER_DEPLOYMENT.md, delete the QA admin account (editor@duyanblog.test), set RESEND_API_KEY + verify EMAIL_FROM, flip demo_mode.
2. Per-image width/height hints (or a build-time manifest) to eliminate the last layout-shift risk on slow ISR hits.
3. Scheduled publishing (publishAt ≤ now → visible) — the only common editorial capability still missing.
4. Media: folder support in the management page (uploads API already accepts a folder param; the page doesn't expose it yet) + bulk delete of unused files.
5. Admin: media storage warning when the on-disk total crosses a threshold (e.g. 100 MB) — data already shown in the page header.

---
Task ID: 14
Agent: Z.ai Code (lead) — scheduled webDevReview round 9
Task: Status assessment, agent-browser QA, then feature work: scheduled publishing, media bulk delete + storage warning, image-dimensions manifest, docs.

Work Log:
- STATUS ASSESSMENT: read worklog (round 13 ended green: 50 smoke checks, tsc/eslint clean). Baseline: tsc 0, eslint 0, but the dev server was dead on arrival (curl 000 — 7th documented reap; setsid restart). After restart: smoke 50/50, agent-browser sweep of 10 public routes clean (the lone "✗" errors line is the CLI's empty-error marker). Round-13 recommendations triaged: #1 ops-only, so this round = #3 scheduled publishing (the flagship), #4/#5 media items, and #2 partially (dimension manifest).
- FEATURE A — Scheduled publishing (no schema change needed): new `liveDateGuard()` in `src/lib/queries.ts` — `status: "published"` AND (publishedAt null OR publishedAt ≤ now) — composed into EVERY public surface: 9 shared fetchers (incl. getPublishedArticleBySlug → scheduled story URL renders not-found, getAdjacentArticlesByType merges via AND so future-dated neighbours never appear as prev/next), home roundup, search, tag pages (nested article filter), author profiles (AND-composed with the existing OR), /feed.xml, /feed.json, sitemap (both article and tag-link queries). Legacy safety: null publishedAt stays visible. Admin bypasses the guard: `isScheduled()` + amber **Scheduled** badge in StatusBadge (also on the dashboard's recent list), a **Scheduled filter** on the articles list (published/scheduled split in JS), dashboard "N scheduled for later" hint on Published, and the form hint now explains scheduling. ISR caveat documented: goes live within one revalidate cycle (≤300 s) after the publish moment.
- SCHEDULED E2E (browser + curl, real session): created `qa-scheduled-story` (published, +24h) via POST /api/admin/articles → story URL rendered the not-found shell with ZERO title occurrences, sitemap/feed/search all excluded it (dev-mode note: dynamic-segment notFound returns 200 + not-found shell in dev — pre-existing Next behavior, never-existing slugs behave identically; content-hiding is the assertion that matters). Flipped publishedAt to the past through the REAL form → title appeared, sitemap included it. Re-scheduled via the form again → amber Scheduled badge, Scheduled filter "7 total · showing 1", public surfaces re-hidden. QA article deleted (back to 6 seeded articles).
- FEATURE B — Media bulk delete + storage warning: shared `src/lib/media-delete.ts` (validateMediaPath containment + deleteMediaFile with usage re-check) now backs the single DELETE (refactored, status mapping preserved) and the new `POST /api/admin/media/bulk-delete` ({paths ≤100}, one usage snapshot for the whole batch, per-path deleted/skipped outcomes). Media page: **Delete unused (N)** amber button in the header → confirm dialog (states the freed size + that per-file server re-checks skip, not delete, anything that gained a reference) → summary toast ("Deleted N · skipped M" with reasons, or freed-size on full success). Amber **storage note** (HardDrive icon) appears when the on-disk total passes 80 MB. E2E: bulk-deleted the unused test PNG → toast "Deleted 1 file", tile gone, file removed from disk.
- FEATURE C — Image-dimensions manifest (round-12 #2, partial): `src/lib/media-manifest.ts` — `public/images/.media-manifest.json` sidecar (dotfile → never listed by the image walk); upload route records sharp width/height best-effort after write; deletes (single + bulk) clean their entries via removeFromManifest; `npm run media:manifest` (scripts/media-manifest.ts) backfills — ran it, 11/11 existing images recorded (1344×768 editorial art, 1024×1024 squares). Media tiles now show a tabular-nums "1344 × 768" chip. E2E: uploaded the 8×8 test PNG → manifest gained it, tile showed "8 × 8" after reload; bulk delete removed both file and manifest entry.
- VALIDATION: tsc 0 errors; eslint 0 errors; smoke extended 50 → **51 checks ALL PASS** (+unauth bulk-delete 401). One mid-round server reap (fetch-failed storm, recovered). agent-browser verified: media page with dimension chips (light, desktop), scheduled badge + filter, bulk-delete flow; console clean; dev.log clean.
- DOCS: ARCHITECTURE.md §2 gained the scheduled-publishing paragraph (guard, ISR caveat, legacy safety, admin badge); §9b gained bulk-delete + dimensions manifest paragraphs and the page description updated. EDITORIAL_GUIDE.md §9 workflow gained the Schedule step (3) for editors.
- CLEANUP: QA scheduled article deleted via the API (6 articles = seeded set); test PNG + manifest entry removed through the feature itself; no QA subscribers this round.

Stage Summary:
- New files: src/lib/media-delete.ts, src/lib/media-manifest.ts, src/app/api/admin/media/bulk-delete/route.ts, scripts/media-manifest.ts, public/images/.media-manifest.json (generated).
- Changed: src/lib/queries.ts (liveDateGuard + 9 fetchers), app/feed.xml + feed.json routes, app/page.tsx, search, tag/[slug], authors/[slug], sitemap.ts (guard), admin/_components/status-badge.tsx (Scheduled badge + isScheduled), admin/articles/page.tsx (Scheduled filter + badge), admin/dashboard/page.tsx (scheduled hint + badge), admin/articles/article-form.tsx (hint), admin/media/{page,media-client}.tsx (dimensions, bulk delete, storage note), api/admin/media/route.ts (shared delete lib + sharp dims), package.json (media:manifest), scripts/smoke.mjs (+1 = 51), ARCHITECTURE.md, EDITORIAL_GUIDE.md.
- Round-13 recommendations: #3 (scheduled publishing) DONE, #4 (bulk delete; folder support still open) PARTIAL, #5 (storage warning) DONE, #2 (dimension hints) PARTIAL (admin-visible manifest; public next/image already dims-safe).

Recommended next steps (priority order):
1. Production readiness sweep in Claude Code: `npm run build`, SQLite → Postgres per HOSTINGER_DEPLOYMENT.md, delete the QA admin account (editor@duyanblog.test), set RESEND_API_KEY + verify EMAIL_FROM, flip demo_mode.
2. Media folder support in the management page (the uploads API accepts `folder`; the page/UI don't expose it yet) + folder column in the grid.
3. A "scheduled" chip could surface on the public home/type indexes is intentionally NOT wanted (hidden is hidden) — instead consider a tiny admin "Publishing queue" card listing upcoming scheduled stories with countdowns.
4. Newsletter open-rate/clicks tracking would require the email provider's webhooks — defer until Resend is live.
5. Dev-quirk worth documenting for the production QA pass: dynamic-segment 404s return 200 + not-found shell in dev; verify real 404 statuses after `next build`.

---
Task ID: 15
Agent: Claude Code (lead) — production deployment to Hostinger Business
Task: Full deployment of duyanblog to the client's Hostinger Business plan (Node.js web app),
MySQL, temporary subdomain; superpowers process (brainstorming → spec → plan → 3-pass review →
execute).

Work Log:
- DISCOVERY: the account (u257278613, order 1009151112, hostinger_business_v3) hosts the
  client's static sites (thesmartaistack.com, jellyreviews.com) but shared static hosting
  cannot run this server app. The Business plan's Node.js web-app layer (next/express apps,
  git/archive source, MySQL) is the vehicle — no new spend (owner constraint).
- REPO (3 commits): provider → mysql + ONE baseline migration 20261004000000_init
  (SQLite chain unreplayable; long columns @db.LongText/@db.Text with @default removed);
  docs/env updates (incl. .gitignore !.env.example); build chain now
  `prisma generate && next build --webpack && cp…` + start:node; removed the pre-existing
  `runtime: nodejs` config that Next 16 rejects in proxy files; moved build-critical Tailwind
  packages (@tailwindcss/postcss, tailwindcss, tw-animate-css) to dependencies because the
  host installs production deps only.
- PLATFORM: created duyanblog-test.hostingersite.com; MySQL u257278613_duyanblog
  (srv2123.hstgr.io) with a locally-generated known password; env written ONCE
  (NODE_ENV, NEXT_PUBLIC_SITE_URL, DB_*, DATABASE_URL @127.0.0.1) — never replace again;
  bootstrap ran LOCALLY over a temporary remote rule: migrate deploy (clean), seed
  (6 articles/7 offers/1 comparison), admin editor@duyanblog.test, negative control refused.
- BUILD: GitHub connection unavailable (client's account — owner cannot authorize) → archive
  fallback (git archive zip → hosting_deploy-js-application). 3 failed builds taught:
  Turbopack panics on globals.css in the sandboxed build (→ --webpack);
  @tailwindcss/postcss then tw-animate-css missing from production install (→ dependencies).
  4th build COMPLETED, prerendered 57/57 pages from MySQL. Live.
- VERIFY: smoke 51/51 PASS (fixed the newsletter double-opt-in expectation for production
  no-confirmUrl). duyan-runtime-verifier found /go/does-not-exist → 302 to 0.0.0.0:3000
  (request.url upstream origin; smoke never asserts Location) → fixed via site.url
  (relative → 500; Next needs absolute). Redeployed; /go 302 → public /deals.
  Deploy-twice check passed: demo data survives repeated builds; guards armed (no ALLOW_*).
- OWNER TODO: manual admin check, replace editor@duyanblog.test + password, register
  duyanblog.com, then the swap checklist (playbook).

Stage Summary:
- New: prisma/migrations/20261004000000_init, docs/superpowers/specs + plans, .claude/playbooks/deploy-hostinger.md.
- Changed: prisma/schema.prisma (mysql + LongText), package.json (build/start:node/deps),
  src/proxy.ts (runtime config removed), src/app/go/[offerId]/route.ts (site.url fallback),
  scripts/smoke.mjs (production opt-in), scripts/validate-docs.mjs (file:line resolves),
  .gitignore (!.env.example), .env.example/README/ARCHITECTURE/HOSTINGER_DEPLOYMENT (MySQL),
  risk-register (C3-C5 closed, R7 open).
- Validation: smoke 51/51 live; verifier PASS after fixes; gates lint/typecheck/validate:docs/slop green.
- Live URL: https://duyanblog-test.hostingersite.com (demo content, labelled).

Recommended next steps (priority order):
1. Owner: manual admin check on the live site (login, one edit, consent banner).
2. Replace the temporary admin account + password before any real content ships.
3. Register duyanblog.com → follow playbooks/deploy-hostinger.md §domain-swap.
4. Real → replace demo merchants/offers/content per AFFILIATE_INTEGRATION.md; flip demo_mode.
5. Set RESEND_API_KEY for live double opt-in emails; then the dev confirmUrl shortcut becomes
   unreachable by itself.

---
Task ID: 16
Agent: Claude Code (lead) — isolated local toolchain + implementation of
docs/superpowers/plans/2026-10-04-editorial-pivot-and-production-hardening.md
Tasks 1–16 (checkpoint BEFORE Task 17).

Environment (this session, NOT committed):
- Portable Node 22.23.3 at `E:\duyanblog-dev\node22\node-v22.23.3-win-x64` (npm 10.9.9).
  Activate per shell: `export PATH="/e/duyanblog-dev/node22/node-v22.23.3-win-x64:$PATH"`.
- Local MySQL 8.4.11 at `127.0.0.1:3307`, DB `duyanblog_dev`, dedicated user
  `duyanblog_dev`. Server: `...\mysql84\mysql-8.4.11-winx64\bin\mysqld.exe
  --defaults-file=E:\duyanblog-dev\my.ini`. Password in
  `E:\duyanblog-dev\.dbpass.notcommitted`. Seeded once with demo data.
- `.env` (gitignored): `DATABASE_URL="mysql://duyanblog_dev:<redacted>@127.0.0.1:3307/duyanblog_dev"`,
  `NEXT_PUBLIC_SITE_URL="https://duyanblog-test.hostingersite.com"`.
- QA admin (LOCAL ONLY, delete before production): `qa@duyanblog.test`, password in
  `E:\duyanblog-dev\.qapass.notcommitted`.

Committed 2026-10-05 (15 commits, ahead of origin/main):
3389bde → f9367c8 — Tasks 1–16 (range base eca9383):
- 1 security: Next 16.1.3→16.3.8 (patched stable); removed stale bun.lock; fixed
  smoke.mjs TDZ + /go-fallback checks.
- 2 theme: non-inverting band/footer tokens (--band-bg/--band-fg).
- 3 seo: robots.ts fail-closed via ALLOW_INDEXING (production-only enables index).
- 4 security: rate limiter ignores spoofable XFF + per-email + process-global buckets.
- 5 security: raster-only media uploads (SVG stored-XSS vector + GIF removed).
- 6 editorial: Article.isDemo single demo gate (schema+migration+seed+templates).
- 7 seo: demo excluded from sitemap/feeds/search + noindex on demo pages.
- 8–10 copy: research/evidence-led site/home/about/methodology ("How we review",
  "we do not run our own benchmarks").
- 11 evidence: SourceCitation.checkedAt (date-only) renders "checked <date>".
- 12 editorial: six seeds + bios + playbook de-tested (first-hand→source-led).
- 13 home: "0 paid placements" hardcoded stat → "Editorially independent".
- 14 privacy: cookie policy discloses real storage keys; banner role=region.
- 15–16 privacy: truthful privacy policy (conditional rights, honest retention,
  transient IP) + minimal click data (sourcePath only; drops consentAnalytics/
  referer/sessionHash via migration).

Verified per task: lint 0, typecheck 0, validate:docs PASS, build 0, smoke 51/51.
Live probes: SVG→400/PNG→200; isDemo noindex; /go click sourcePath only (crafted
Referer stores NULL); dark band computed-style non-inverting (light 0.252/0.93,
dark 0.15/0.93).

Safety rules in force:
- NEVER broad-kill `node.exe` (kills 9router on :20128 / the model connection).
  Kill only the verified PID listening on :3000 whose command line is
  `.next/standalone/server.js`. This session's server currently runs under
  system Node 24 (C:\Program Files\nodejs) at PID 604 — restart under Node 22.
- Never touch Hostinger/production DB; local DB only. Never commit .env.
- `next dev` (16.3.8) auto-injects an "agent rules" block into tracked AGENTS.md
  on each run — restore it after runs / do NOT commit it.

Next: Task 17 (terms/corrections/editorial-policy truthful; no pseudo-legal
placeholders; no public corrections ledger) → then 18 (AI-crawler decision, docs
only) → 19 (AdSense readiness doc) → 20 (search correctness) → 21 (newsletter
truthful) → 22 (media persistence gate) → 23 (docs/env/allowlist) → 24 (final
branch gate + hostile review).

Task ID: 17
Agent: Claude Code (lead) — completion of
docs/superpowers/plans/2026-10-04-editorial-pivot-and-production-hardening.md
Tasks 17–24 (inline, superpowers:executing-plans).

Environment: same isolated Node 22.23.3 + local MySQL duyanblog_dev as Task 16.

Committed 2026-10-05 (8 commits, aa39818 → 83d4477; full branch 3389bde..83d4477):
- 17 policy truthful: Corrections 10 — no 7-day SLA, "re-check the cited
  sources", children-under-13, present-tense ads (no network configured).
- 18 AI-crawler decision: default allow, recorded in risk register (D1).
- 19 ADSENSE_READINESS.md NOT READY + drop "flip the switch" implication.
- 20 search DB-side filter (searchArticles, LIMIT 30) vs take-100 JS pass.
- 21 newsletter truthful: transport "none" → 503 + rollback, never fake.
- 22 media: production uploads 403 without MEDIA_PERSISTENT + admin banner.
- 23 docs/env/allowlist: EDITORIAL_GUIDE evidence-led, settings allowlist
  narrowed to ads_enabled+demo_mode, risk register C6–C8 closed.
- (T24 fix) 83d4477 soft-404 + limiter floor (see below).

Final branch review: one hostile duyan-runtime-verifier run (default FAIL).
Findings → fixes (commit 83d4477):
- SOFT-404 (MAJOR→fixed): folder-level loading.tsx in 5 segment routes
  (reviews/best/compare/guides/articles + 6 [slug] loadings) made notFound()
  stream HTTP 200. Debug: bare probe/[slug] returned 404 but reviews/[slug]
  (bare too) 200 → isolated to the folder-level Suspense boundary. Removed
  11 loading boundaries. Verified: 6 bogus slugs 404, real 200, smoke 60/60.
- NEWSLETTER LIMITER (MAJOR→fixed): x-real-ip forgeable rotation defeated the
  5/min/IP window. Added process-global newsletter:global 60/min bucket
  (login's Correction 3 pattern). Verified attempt #6 → 429, smoke 60/60.
- Deferred MINORs (ledger): demo content on listing ItemList JSON-LD (R1 gate
  prevents crawler exposure); footer vermilion-period contrast 2.93:1
  sub-AA; 375px viewport untested by reviewer.
Reviewer CONFIRMED: band/footer non-inverting both themes; robots fail-closed;
demo noindex + plain-Article JSON-LD; zero demo slugs in sitemap/feed/search;
canonical origin; no /_next/image 400s; admin 307s; newsletter 503; media guard.

Validation: lint 0, typecheck 0, validate:docs PASS (budget 239XX/24000B),
slop 0, build 0, smoke 60/60.

Plan complete. READY-FOR-REAL-CONTENT gates met (isDemo single source, no
hands-on claims, newsletter truthful/disabled, media Git-managed, dark band
non-inverting, Next 16.3.8 patched stable). Remaining owner decisions:
register duyanblog.com + ALLOW_INDEXING; jurisdiction/legal; newsletter
provider; media persistence choice; AI-crawler default (allow); AdSense as a
separate later task.

Task ID: 18
Agent: Claude Code (lead) — PR #1 independent-review fixes (5 merge-blockers).

On branch hardening/editorial-pivot-production-readiness, commit eec4843:
- 1 media: byte signature authoritative; MIME cannot compensate invalid bytes;
  test:media 11/11 (fake .png w/ SVG+image/png refused; real raster accepted).
- 2 rate-limit: untrusted clientIp ignores BOTH XFF and x-real-ip (fallback
  __untrusted__); contact added contact:global bucket; smoke rotating headers
  → 429 (newsletter + contact).
- 3 newsletter confirmUrl from site.url canonical origin, never request.url
  (0.0.0.0 leak class); asserted in smoke + unit.
- 4 newsletter: no path reports failed delivery as completed signup —
  provider none → 503+rollback, resend failure → truthful 503 (pending kept);
  unit asserts no ok:true-without-delivery.
- 5 Node canonical start (npm start → node); bun-types removed, @types/node
  added; README Next ^16.3.8 + admin-UI drift fixed; HOSTINGER_DEPLOYMENT note.

Gates: lint 0, typecheck 0, validate:docs PASS, slop 0, build 0, smoke 61/61
x2 (deterministic), test:media 11/11, test:newsletter 5/5, diff --check clean.

Task ID: 19
Agent: Claude Code (lead) — PR #1 final-review fix pass (narrow; no redesign).

Branch hardening/editorial-pivot-production-readiness, commit 1a94f9f:
- rate-limit availability: clientIp() → null when TRUST_PROXY unset; per-IP
  bucket only when a TRUSTED IP exists (no shared anonymous 5/min bucket that
  one visitor drains into 429s for everyone). login/newsletter/contact key
  normalized per-account/email buckets + higher global floor (60/300/300 per
  min). Smoke 63/63 x3 proves: rotating forged headers do NOT mint fresh
  trusted-IP buckets; one email/sender limited on its own bucket; a DIFFERENT
  account is NOT blocked by another's limit.
- admin fail-closed: requireAdminPage/Api deny role!==ADMIN (Api 403,
  pages redirect); login refuses non-ADMIN sessions (403). EDITOR reserved.
  test:admin-auth 6/6 (ADMIN allowed, EDITOR denied, forged session rejected).
- test-newsletter-semantics re-labeled truthful STRUCTURAL guard (not a
  mocked Resend delivery test); assertions tightened to the two shipped
  invariants. 7/7.

Gates: lint 0, typecheck 0, validate:docs PASS, slop 0, build 0, smoke 63/63
x3, test:admin-auth 6/6, test:media 11/11, test:newsletter 7/7.

---
Task ID: 20
Agent: Claude Code (lead) — bootstrap state-sync after Spaceship production cutover.

Context: production is LIVE on Spaceship (`duyanblog.com`), Hostinger demo subdomain is
rollback/reference. New Claude sessions were loading stale Hostinger-era bootstrap state
(CLAUDE.md described `duyanblog.com later`, "one baseline migration", bun dev server,
Hostinger as current deployment target). Docs/memory fixed; no app code, no DB, no indexing
changes. PR #4.

- `.claude/CLAUDE.md` — "Where the project" block updated to Spaceship production
  (`https://duyanblog.com`, CloudLinux Node app, Node 22.23.3, cPanel selector,
  `experimental.cpus: 2` validated, Hostinger = rollback/reference + do-not-touch,
  `ALLOW_INDEXING=false` until content-launch review). Build rule #1 + Build target now point
  to package.json as authoritative: `prisma migrate deploy` runs BEFORE `next build`; schema
  managed only by canonical migrations, never rewrite an applied migration. Canonical commands:
  `npm run start:node` is the runtime (package.json start/start:node are node — no bun);
  build comment simplified.
- `.claude/memory/production-now-runs-on-spaceship.md` (new) — durable ops fact: Spaceship is
  production, Hostinger is rollback/reference; indexing gated by real-content launch review;
  production never receives demo seed; build uses `prisma migrate deploy`; cpus:2 validated.
  Transient facts excluded: no article counts, no exact migration count. Indexed in
  `.claude/memory/README.md`.
- `.claude/rules/operating-rhythm.md` — new "Superpowers — process aid" (auto-load, minimal):
  use an installed `superpowers:*` skill when it matches (brainstorm → plans → execute,
  systematic-debugging, TDD, verification-before-completion, review before merge), smallest fit;
  **Duyan governance precedes Superpowers** (rules/playbooks beat generic steps; two-agent cap,
  one reviewer, gates still bind); gate + validate:docs before reporting, verification claims
  include command+output+exit.
- `.claude/rules/README.md` — operating-rhythm index line notes Superpowers; re-derive line
  uses `validate-docs`.
- `.claude/rules/content-integrity.md` — trimmed duplicated core-rule wording (paid for the
  Superpowers rule inside the 24 KB auto-load cap; the cap was not raised).
- Notes: Hostinger playbook untouched (still the rollback/reference doc).

Docs gate: validate:docs PASS — auto-load budget 23950B ≤ 24000B; slop 0; git diff --check
clean. (Final state after independent-review amendments; earlier intermediate figures are
superseded by this entry.)

---
Task ID: 21
Agent: Claude Code (lead) — CTA production readiness (PR #5, branch feat/cta-production-readiness).

Goal: every commerce surface renders real content as real and demo content as visibly
fictional, driven by the existing Article.isDemo truth. Superpowers flow: brainstorm
(bounded, in-chat design + amendments 1-6) → writing-plans (committed plan) →
executing-plans inline + TDD → verification → one hostile review → repair pass →
one independent-review repair pass.

- Demo context is REQUIRED (fail closed): ArticleRenderer, ComparisonTable and
  MerchantOffer all take isDemo: boolean (no default); all five article routes + compare
  pass article.isDemo; /deals and the review sidebar thread their own truth.
- MerchantOffer: "(demo)" hardcoded label removed; "Sample offer · fictional data" chip
  only in demo context. Pick: "(demo merchant)" removed for a renderer-owned conditional
  "sample data" chip; ComparisonOffer stays CTA-only. pick.imageUrl now renders
  (decorative alt="" — no truthful alt field; never invented from the product name).
- ComparisonTable footer demo-aware; a pick with an offer CTA carries its own adjacent
  inline AffiliateDisclosure (guides/editorials have no page-level one). Launch constraint
  recorded: until a separate inline-go disclosure pass, the first real content wave uses
  structured commerce surfaces (pick/offerEmbed/comparison), not inline [go:OFFER_ID]
  links on guide/editorial pages.
- /deals: demo from settings["demo_mode"] OR offer.article?.isDemo; demo-aware lead,
  linked-article line branches on article truth ("Sample article: view the demo review");
  truthful empty state (no seed CLI); fabricated new Date() price-check claim removed;
  metadata description neutral in both modes.
- Disclosure: unverifiable "it costs you nothing extra" replaced with neutral commission
  wording; methodology + business-rules links, rel="sponsored noopener", /go routing
  unchanged.
- Tests: scripts/test-cta-readiness.mjs structural guard now in the normal test gate
  ("test": "npm run test:cta && node scripts/smoke.mjs"); 27 checks; mutation-tested
  (ungated pick chip / footer ternary / MerchantOffer label / (demo) in real branch all
  FAIL the guard); smoke extended to 52 checks (2 rendered demo-label checks).
- No schema change, no migration, no production DB write, no deployment, no indexing
  change. Hostinger/Spaceship untouched.

Gates: lint 0, typecheck 0, test (guard+smoke) all PASS on a local standalone production
build, build 0, validate:docs PASS (budget 23950B), slop 0, diff --check clean.

---
Task ID: 22
Agent: Claude Code (lead) — Saily vs Airalo RESEARCH GATE (first real article candidate; research only, no article written).

Superpowers: brainstorming (research/spike path) → structured research → verification-before-completion. Two agents total (cap respected): seo-cluster (SERP/intent) + general-purpose (one hostile evidence review). No TDD (not a code task).

- PHASE 0 verified: origin/main = 4b94a68 (PR #5 merged), local main fast-forwarded, feature branch deleted. Production robots.txt confirmed Disallow: / (ALLOW_INDEXING not enabled). Hostinger/Spaceship untouched. No DB writes, no schema change, no deploy.
- OFFICIAL EVIDENCE (first-party, browser session 2026-10-06, WebFetch was 403-blocked by Cloudflare — Playwright used): saily.com (home, all-destinations "209 destinations", Japan/Europe/Global plan pages incl. prices+validity, refund policy, hotspot, top-up, ToS 2026-08-27, "By the creators of" NordVPN logo) and airalo.com (home "200+ locations / 30M users / 53 languages", Japan/Europe/Discover plan pages, refund/hotspot/top-up/validity help articles, unlimited-packages FAQ with FUP "3GB/day at 20 Mbps then reduced, resets 24h"). Scratch ledger (git-ignored): .superpowers/sdd/2026-10-06-saily-vs-airalo-research/ledger-notes.md — every claim has URL + checked date + vendor-claim labelling.
- SERP (seo-cluster agent; WebSearch tool returned 0 results even for control query — used Brave SERP instead, no numeric metrics, UNAVAILABLE where unmeasurable): exact-match "saily vs airalo" SATURATED (Saily's own blog #1; 4 Nord-family domains; Holafly/Surfshark vendor content). New-domain verdict: cannot win head term; realistic entry = long-tail per-destination; differentiator gap = no documented symmetric same-methodology comparison (internal rationale only). Cluster order: (c) how much eSIM data do I need (softest, entry) → (b) best eSIM for Europe → saily-vs-airalo → (a) best eSIM for Japan → (d) best travel eSIM 2026 (pillar, last).
- HOSTILE REVIEW (default DO-NOT-SHIP): 3 BLOCKER + 8 MAJOR + 5 MINOR, all repaired in the research artifact: Japan basket not like-for-like (1GB/7d vs 1GB/3d) → availability-noted tables, no in-row verdicts; "Saily cheaper" contradicted by Global basket (cent-level alternation) → "no consistent price advantage"; 54-row table would be silently dropped by table block limits (40 rows) → per-destination tables ≤12 rows; unit-mismatched coverage counts (209 destinations vs 200+ locations vs 121 vs 168 "Countries and Networks") → quotes carry on-page labels, no winner; Airalo unlimited FUP fetched and made symmetric; unstable same-day ratings excluded; vendor claims quarantined with inline attribution; img-alt corporate fact demoted to attributed presentation; absence-claim about Airalo privacy retracted; scope callout ("we did not buy/install/test") promoted to first block; CTA placeholders removed from v1 (official links only, no affiliate fabrication); per-table check dates + 8-week staleness rule; "Class A/B/C" taxonomy dropped for renderer-real terms; US basket dropped (asymmetric data); Saily's own comparison table + all vendor blogs barred as evidence.
- BLUEPRINT (validated against current schema): type=versus, slug=saily-vs-airalo; blocks = callout(warning, scope) → paragraph open → TL;DR (scenario-based, no overall winner) → per-destination static table blocks (Japan/Europe/Global, dates in captions) → pricing/coverage/installation(per docs)/hotspot & top-up/refunds & support/privacy & extras → who-should-choose sections → prosCons per provider → FAQ → sources (all official URLs + check dates). comparisonEmbed NOT used at launch (its footer claims affiliate links exist); switch when real AffiliateOffer rows land. Images: Pexels editorial only (hero + 2-3 contextual, alt concepts recorded, never implying the photo shows either app). Video: official setup tutorials exist (link-only; no video block, no schema change).
- VERDICT (recommendation A): WRITE SAILY VS AIRALO NEXT — evidence exists for a defensible, symmetric, properly-labelled versus; conditions before drafting: swap scratch prices into tables with fresh check same-day, owner confirms no-affiliate launch, Pexels picks + hero, indexing still off so no SEO rush.
- SCOPE: research only. No article DB rows, no AffiliateOffer rows, no seed, no publish, no indexing change, no deploy, no Prisma change, no CTA code change. Nothing committed except this worklog entry.

---
Task ID: 23
Agent: Claude Code (lead) — Saily vs Airalo FIRST REAL ARTICLE DRAFT (branch content/saily-vs-airalo-draft; not merged; not published).

Superpowers lightweight: writing-plans (committed plan docs/superpowers/plans/2026-10-06-saily-vs-airalo-article-draft.md) → executing-plans inline → verification-before-completion → ONE editorial reviewer → one repair pass.

- Evidence refresh same-day (2026-10-06, second browser session): everything UNCHANGED except Airalo Japan 20GB/30d $24.00→$25.00. Airalo Japan 1GB conflict ruling: two same-day fetches both place 1GB in the 3-day group → catalogue grouping confirmed; article wording stays page-descriptive ("listed under the 3-day group"), no validity claim beyond grouping, no Saily advantage derived. Owner's bounded methodology wording used verbatim in the first block.
- Draft: content/drafts/saily-vs-airalo.json (versus, slug saily-vs-airalo, isDemo=false, 35 blocks, 3 static tables Japan/Europe/Global with per-table check dates — Japan final = 15 rows, 8-question FAQ, 19 sources — 18 external all dated 2026-10-06, incl. both official homepages backing homepage-derived claims). TL;DR scenario-based, no overall winner, names the one wide gap (Europe 10GB/30d Airalo $31.00 vs Saily $35.99). Zero affiliate surface: no go:, no offerId, no commerce blocks. Pexels attribution = plain-text image credit + a linked attribution paragraph (renderer untouched — image credit never parses Markdown, so no affiliate surface can hide there).
- TDD: gate script test-article-draft-saily-vs-airalo.mjs written FIRST (watched FAIL on missing draft), then draft; extended across review rounds to a final 26 checks (prose-pairs-must-exist-in-tables mutation-tested; plain-text credit + go:-free credit + attribution-paragraph-with-photo-ID checks; homepage-claim→homepage-source completeness); validate with repo's serializeBlocks (35/35 round-trip); slop scan 0 hits on draft.
- Media FINAL: ONE Pexels hero photo (15068317 airport phone) — the two supporting backups (5448160, 33277478) were removed in independent review as dead weight (a SIM-card flat lay on an eSIM article misleads). Image credit stays PLAIN TEXT ("Towfiqu barbhuiya / Pexels"); the reader-visible Pexels photo-page link lives in the paragraph immediately after the hero block; the article renderer is unchanged from base (an InlineText-over-credit attempt was fully reverted as an affiliate-surface risk).
- Persistence: LOCAL duyanblog_dev only — Article row status="draft", isDemo=false, publishedAt=null, category=travel. The draft uses author `duyan` / byline `Duy An Tran`. Owner confirmed public byline: Duy An Tran (2026-10-06). (Fictional seed authors unused.) Production row does NOT exist yet — a git merge ships draft JSON + media only; production import is an explicit owner-approved step, publishing a separate later action. Public route /compare/saily-vs-airalo verified 404 while unpublished; hero image serves 200. Import/approval notes: scripts/README-article-draft-import.md (incl. 8-week price re-verification rule).
- Editorial review (ONE reviewer): 5 BLOCKER + 6 MINOR → all repaired in one pass (Japan mid-size arithmetic; unlimited post-cap not-comparable; unsourced 200+→"209 destinations found"; TL;DR/closing name the Europe gap instead of blanket parity; ratings block cut; superlatives replaced; hotspot claim verify-then-recorded). Post-repair: gate 20/20, slop 0, schema 34/34, lint 0, typecheck 0, validate:docs PASS, diff --check clean; DB re-synced.
- Independent review round 2 (PR #6): Japan table completed with the compared-but-missing rows (Airalo 10GB/30d $18.00, 5GB/30d $11.00 — now 15 rows); FAQ coverage line quotes "209 destinations found"; Pexels credits render as links (renderer figcaption → InlineText); unused media removed; byline gate + production-import truth written into README; "Privacy and extras" heading renamed "Extras and security features" (it never compared privacy practices); homepage-derived claim families now require their homepage source with the checked date (gate check 15). Final gate 24/24.
- Scope: NO production DB mutation (local only), NO publish, NO indexing change, NO deploy, NO schema change, Hostinger/Spaceship untouched. Not merged — awaiting owner review.
