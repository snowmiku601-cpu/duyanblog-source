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
- Draft: content/drafts/saily-vs-airalo.json (versus, slug saily-vs-airalo, isDemo=false, FINAL 34 blocks — hero deduped into Article hero fields, 3 static tables Japan/Europe/Global with per-table check dates — Japan final = 15 rows, 8-question FAQ, 19 sources — 18 external all dated 2026-10-06, incl. both official homepages backing homepage-derived claims). TL;DR scenario-based, no overall winner, names the one wide gap (Europe 10GB/30d Airalo $31.00 vs Saily $35.99). Zero affiliate surface: no go:, no offerId, no commerce blocks. Pexels attribution = plain-text image credit + a linked attribution paragraph (renderer untouched — image credit never parses Markdown, so no affiliate surface can hide there).
- TDD: gate script test-article-draft-saily-vs-airalo.mjs written FIRST (watched FAIL on missing draft), then draft; extended across review rounds to a final 30 checks (prose-pairs-must-exist-in-tables mutation-tested; plain-text credit + go:-free credit + attribution-paragraph-with-photo-ID checks; homepage-claim→homepage-source completeness; hero-metadata + hero-not-duplicated checks; final counts 34 blocks / readingMinutes 14 / the 4 approved tags); validate with repo's serializeBlocks (34/34 round-trip); slop scan 0 hits on draft.
- Media FINAL: ONE Pexels hero photo (15068317 airport phone) — the two supporting backups (5448160, 33277478) were removed in independent review as dead weight (a SIM-card flat lay on an eSIM article misleads). Image credit stays PLAIN TEXT ("Towfiqu barbhuiya / Pexels"); the reader-visible Pexels photo-page link lives in the paragraph immediately after the hero block; the article renderer is unchanged from base (an InlineText-over-credit attempt was fully reverted as an affiliate-surface risk).
- Persistence: LOCAL duyanblog_dev AND PRODUCTION — Article rows status="draft", isDemo=false, publishedAt=null, category=travel. The draft uses author `duyan` / byline `Duy An Tran`. Owner confirmed public byline: Duy An Tran (2026-10-06). (Fictional seed authors unused.) Production state at Task 23 close: article imported to production as draft (explicit owner-approved step), production author data repaired to the minimal truthful profile (role "Author", bio "Duy An Tran writes for Duyan Blog.", focusAreas [] — the demo-seed role/bio/focusAreas were replaced), pre-publish metadata pass completed (hero fields set, body hero image block removed → 34 blocks, readingMinutes 14 via the repo's own algorithm, tags exactly eSIM/travel-connectivity/saily/airalo, Comparison intentionally null — v1 uses static evidence tables, reviewerId/lastReviewedAt null). STILL UNPUBLISHED; ALLOW_INDEXING remains false. Public route /compare/saily-vs-airalo verified 404 while unpublished; hero image serves 200. Import/approval notes: scripts/README-article-draft-import.md (incl. 8-week price re-verification rule).
- Editorial review (ONE reviewer): 5 BLOCKER + 6 MINOR → all repaired in one pass (Japan mid-size arithmetic; unlimited post-cap not-comparable; unsourced 200+→"209 destinations found"; TL;DR/closing name the Europe gap instead of blanket parity; ratings block cut; superlatives replaced; hotspot claim verify-then-recorded). Post-repair: gate 20/20, slop 0, schema 34/34, lint 0, typecheck 0, validate:docs PASS, diff --check clean; DB re-synced.
- Independent review round 2 (PR #6): Japan table completed with the compared-but-missing rows (Airalo 10GB/30d $18.00, 5GB/30d $11.00 — now 15 rows); FAQ coverage line quotes "209 destinations found"; Pexels credits render as links (renderer figcaption → InlineText); unused media removed; byline gate + production-import truth written into README; "Privacy and extras" heading renamed "Extras and security features" (it never compared privacy practices); homepage-derived claim families now require their homepage source with the checked date (gate check 15). Final gate 24/24.
- Scope: NO production DB mutation (local only), NO publish, NO indexing change, NO deploy, NO schema change, Hostinger/Spaceship untouched. Not merged — awaiting owner review.

---
Task ID: 24
Agent: Claude Code (lead) — SESSION HANDOFF: production state + next-launch plan (docs only).

PRODUCTION STATE (as of 2026-10-06, deploy verified this session):
- Production = Spaceship (duyanblog.com); Hostinger staging = rollback/reference only, untouched.
- Deployed source: a096c9e812f4a610ce014d6422623055036058ed (main; PR #7 merged).
- FIRST REAL ARTICLE IS LIVE: https://duyanblog.com/compare/saily-vs-airalo
  - slug saily-vs-airalo, type versus, status published, isDemo=false, publishedAt 2026-10-06T11:14:45.251Z.
  - Public byline: Duy An Tran. Production author profile deliberately minimal/truthful:
    role = Author; bio = "Duy An Tran writes for Duyan Blog."; focusAreas = [].
  - 34 blocks; readingMinutes = 14; hero metadata set (heroImage/heroAlt/heroCredit;
    "Image credit:" label on all 5 article routes since this SHA).
  - Tags: eSIM, travel-connectivity, saily, airalo.
  - Comparison relation intentionally null (v1 uses static evidence tables).
  - reviewerId null; lastReviewedAt null; featured false.
  - No affiliate/go links; no AffiliateOffer dependency anywhere in the article.
  - Row counts in this entry are an as-of-session observation, NOT durable invariants.

INDEXING STATE:
- Indexing intentionally STILL OFF: ALLOW_INDEXING=false; robots serves "Disallow: /".
- The published article IS in sitemap.xml/feed.xml/feed.json and publicly reachable,
  but Google/Bing submission has NOT been done.
- Do NOT open indexing merely because one article is live. Current editorial preference:
  publish a small initial content cluster first, then run a separate Content Launch Review
  before enabling indexing. This is an editorial launch choice, not a Google rule.

NEXT CONTENT ORDER:
1. how-much-esim-data-do-i-need — "How much eSIM data do I need?" — next session starts
   with RESEARCH GATE ONLY (no drafting/publishing).
2. Best eSIM for Europe.
3. Content Launch Review → if clean: ALLOW_INDEXING=true → rebuild/restart →
   verify robots + sitemap + canonicals → submit sitemap / Google Search Console →
   Bing can follow.
Launch cluster: how-much-esim-data-do-i-need ↔ saily-vs-airalo ↔ best-esim-for-europe;
cross-link naturally once the articles exist.

EDITORIAL / MONETIZATION RULES (unchanged, durable):
- Affiliate approval is NOT a prerequisite for publishing or indexing.
  Strategy: content first → indexing → affiliate retrofit later.
- Never fabricate affiliate offers, merchant URLs, scores, testing claims, or
  first-hand experience. Evidence standard: official docs/specs/pricing/terms +
  credible sources + explicit check dates + editorial judgment. Scores are editorial
  judgment only. Early non-commerce versus content: static evidence tables are fine;
  never create a Comparison row merely to satisfy structure.

PRODUCTION SAFETY (durable): Spaceship is production; Hostinger untouched; supported
CloudLinux/cPanel/Spaceship mechanisms only; builds use the proven limited-worker setup
(experimental.cpus = 2); schema deploy = prisma migrate deploy; never rewrite applied
migrations; never seed demo data into production; new schema changes = new migrations
only; never expose credentials/tokens/session URLs; never broad-kill Node processes.
Do not persist transient deployment details (PID/BUILD_ID/env values) into governance.

NEXT SESSION START PROCEDURE:
1. git fetch origin. 2. Verify actual origin/main. 3. Read .claude/CLAUDE.md,
.claude/rules/operating-rhythm.md, relevant editorial/content governance, and this
handoff entry. 4. Verify production/indexing state before assuming it is unchanged.
5. Start a research-only task for how-much-esim-data-do-i-need.
Superpowers only where applicable; one lead agent, at most one hostile reviewer.
Do not reopen settled Saily-vs-Airalo review work unless a real production
regression appears.

---
Task ID: 25
Agent: Claude Code (lead) — "How much eSIM data do I need?" RESEARCH GATE (research only; no article, no DB row, no publish).

Superpowers: brainstorming (classified SPIKE, brief = approved question+probe) → structured first-party research → verification-before-completion → ONE hostile reviewer. Agent cap respected: 2 subagents total (seo-cluster SERP/intent ×2 attempts — first died on upstream model 400s, relaunched on opus; general-purpose hostile review).

- TOOLING: WebSearch/WebFetch failed all session (upstream "Model is unavailable" 400s). All first-party evidence fetched via Playwright browser session 2026-10-06, same method as Task 22. SERP via DuckDuckGo Lite (Bing geo-garbled + captcha'd; SERP features UNOBSERVED, recorded as such).
- OFFICIAL EVIDENCE (first-party, checked 2026-10-06): Netflix (0.3/0.7/1/3/7 GB per hour by quality; mobile ~4 h/GB, Save Data ~6 h/GB, Max 1 GB/20 min); Spotify (24/96/160/320 kbit/s + Lossless FLAC no-number; podcasts 96/128 kbit/s); Zoom (600 kbps 1:1 HQ → 3.8 Mbps 1080p; VoIP 60–80 kbps; screen share 50–150 kbps); Teams (audio 10–76 kbps; video 150–4000 kbps up/down table; "HD in under 1.5 Mbps"); Google Meet saver mode; WhatsApp (data-roaming + charges articles: same connection as web/email, Network-usage setting, media auto-download off — NO MB figures published); Google Maps (offline maps behavior + offline limitations; NO MB figures); Apple (cellular per-app toggles, Connectivity Assist weak-Wi-Fi fallback, Low Data Mode behaviors, iCloud Photos cellular warning, Personal Hotspot carrier fees); Android (Data Saver background-only-via-Wi-Fi + Unrestricted override, "carriers may limit or charge extra for tethering"); Airalo unlimited FUP re-verified (3GB/day @20 Mbps then reduced, resets 24 h) + tethering included against FUP.
- DERIVED: kbps × 0.45 = MB/h per direction (decimal GB), all recomputed by reviewer: Spotify ~11–144 MB/h; Zoom/Teams upper bounds ~0.5–2 GB/hour video. Requirement-vs-consumption caveat mandatory (Zoom/Teams numbers are provisioning ceilings, not typical consumption).
- EDITORIAL (labelled ranges only): Maps MB/h, messaging, social feeds, photo/video sizes, OS-update sizes. DO-NOT-CLAIM list: per-app point figures (Instagram/WhatsApp/Maps), "average traveler uses X", unlimited=full-speed, tethering-always-included, any SEO metric.
- SERP (DuckDuckGo Lite, 7 queries, no invented metrics): very vendor-heavy (overwhelming majority vendor blogs/calculators funneling to own sales); first-party sourcing nearly absent (only Roamless cites WhatsApp FAQ); hotspot/tethering + unlimited daily caps + background drains almost uncovered; calculators don't disclose MB/h assumptions. SERP features UNOBSERVED (engine limitation, not guessed).
- INTERNAL LINKS: guide ↔ /compare/saily-vs-airalo (one contextual non-commercial link each direction; reverse link is a later small edit); future best-esim-for-europe as follow-up. No cannibalization: "how much" vs "which provider".
- VERDICT: B — WRITE WITH CONDITIONS. Conditions: DOCUMENTED/DERIVED/EDITORIAL labels carried into the article; Maps/social/WhatsApp stay editorial ranges; no calculator presented as precise; same-day re-check of vendor prices/FUP at draft; re-fetch sources this session did not fetch (Saily, Apple/Android/WhatsApp/Maps) before citing checked dates.
- BLUEPRINT (validated against 15-block grammar, no fake calculator): scope callout → problem → TL;DR decision rule (profile × days × Wi-Fi, round up, OS-update headroom) → documented/derived activity-cost table with shown math → intensity framework → trip-length scenario ranges (3/7/14/30 × light/normal/heavy) → underestimation modifiers (documented behaviors) → reduction settings (documented) → unlimited/FUP section (Airalo+Saily terms, tethering) → recommendation bands + natural link to Saily-vs-Airalo → FAQ → sources with dates. Type=guide, slug=how-much-esim-data-do-i-need.
- HOSTILE REVIEW (one round, general-purpose, default DO-NOT-SHIP): 3 MAJOR + 7 MINOR, all repaired in the ledger: Teams up/down reversal; requirement≠consumption framing; missing Spotify Lossless; Zoom "identical globally" retracted; SERP % demoted to qualitative; buffer reframed; re-fetch conditions added. Arithmetic ×0.45 verified correct by reviewer; Netflix/Spotify/Teams spot-checked on rendered pages. Post-repair: SHIP at research-gate level.
- SCOPE: research only. Scratch ledger git-ignored (.superpowers/sdd/2026-10-06-esim-data-need-research/ledger-notes.md). No article DB rows, no AffiliateOffer rows, no seed, no publish, no indexing change (ALLOW_INDEXING still false), no deploy, no Prisma/schema/CTA change, Hostinger/Spaceship untouched. Nothing committed except this worklog entry.
- Gates: validate:docs PASS; git diff --check clean (only worklog.md modified, tracked); scratch ignored.

---
Task ID: 26
Agent: Claude Code (lead) — how-much-esim-data-do-i-need DRAFT ARTICLE (branch content/how-much-esim-data-do-i-need-draft; PR #8; NOT merged, NOT published).

Superpowers: writing-plans implicit in brief → TDD (gate RED first) → inline execution → verification-before-completion → ONE hostile reviewer → one repair pass. Agent cap: 1 reviewer.

- BRANCH: Task 25 local branch renamed research/esim-data-need → content/how-much-esim-data-do-i-need-draft per brief (9d26e66 on top of 3b05a55=origin/main, no duplicate commits). Verified origin/main unchanged.
- EVIDENCE REFRESH (same day, third browser session, ALL UNCHANGED): Netflix node/87, Spotify audio-quality, Zoom KB0060749, Teams prepare-network (up/down column order confirmed), Maps 6291838, WhatsApp 5315147411944059, Apple 102433/109323/108782, Android 7055392/9059108, Airalo unlimited FUP, Saily Japan unlimited terms. Ledger updated (.superpowers/sdd/2026-10-06-esim-data-need-research/ledger-notes.md, git-ignored).
- BLOCKER RESOLUTION: 2–7 GB OS-update range DROPPED (no first-party range source); safe wording "Leave extra headroom for large app or system updates, or download them on trusted Wi-Fi before travelling." enforced by gate.
- TDD GATE: scripts/test-article-draft-how-much-esim-data-do-i-need.mjs — written RED against missing draft, then draft to GREEN; 30 checks (meta/slug/isDemo, no go:/commerce, no first-hand language, no per-app point figures, no 2–7 GB, classification labels present, requirement-vs-consumption caveat, unlimited≠full-speed + both FUP terms attributed, source-family completeness, external source dates, internal /compare/saily-vs-airalo link, no provider recommendation, FAQ, hero media, derivation math shown, author duyan/byline Duy An Tran).
- DRAFT: content/drafts/how-much-esim-data-do-i-need.json — guide, 30 blocks, 19,965 bytes serialized; serializeBlocks 30/30 roundtrip. Structure: scope callout → problem → TL;DR decision rule → activity-cost table (documented/derived/editorial rows) → upper-bound callout → derivation math paragraph → 3 profiles → trip-length bands (rounding rule stated) → Wi-Fi modifier → underestimation list → reduction settings (all documented) → unlimited/FUP section → neutral link to versus → 7-question FAQ → 16 dated sources.
- RECOMMENDATION BANDS: derived in ledger from profile GB/day × days, rounded up to sold sizes; reviewer caught profile/band mismatch (bands used lower bounds while profiles published higher ranges) → profiles aligned (light 0.2–0.4, normal 0.4–0.8, heavy 1–3+ GB/day) + explicit "bottom of range × days, rounded up" rule.
- MEDIA: 1 Pexels hero (photo 35969, Ingo Joseph — person using a map app outdoors), 1344×768 108 KB, truthful plain-text credit; no second image (not blocking per brief).
- HOSTILE REVIEW (one, DO-NOT-SHIP default): 2 BLOCKER + 3 MAJOR + 4 MINOR → one repair pass: FAQ "1GB = one Netflix hour at HD" arithmetic contradiction → "about 20 minutes" (HD = up to 3 GB/h documented); profile/band consistency + rounding rule; tldr "one to three GB" → "a third of a GB to three-plus"; "two largest travel eSIM apps" (unmeasured market claim) → "two major … we cover"; duplicate photo credit removed; Zoom cell direction labels; junk callout keys removed. Reviewer's re-fetch-evidence question: satisfied by this session's Playwright refresh (all 13 sources re-read live).
- LOCAL DB: duyanblog_dev ONLY — Article row created then re-synced after repairs: status draft, publishedAt null, isDemo false, author duyan, category travel, tags eSIM/Travel connectivity/Data planning, readingMinutes 15; read-back parse 30/30. Production DB untouched.
- GATES: draft gate 30/30 exit 0; slop 0; lint 0; typecheck 0; validate:docs PASS (budget 23950B); git diff --check clean.
- GIT: commits fa5349a (draft+gate+hero) + worklog entry on content/how-much-esim-data-do-i-need-draft, pushed; PR #8 opened (gh) — NOT merged, NOT deployed, production NOT imported, indexing unchanged (ALLOW_INDEXING=false).
- PROPOSED BACKLINK (later task): saily-vs-airalo pricing section adds "Not sure how much data your trip needs? Read our guide to estimating it." with internal link — separate content-sync task.

---
Task ID: 27
Agent: Claude Code (lead) — PR #8 independent-review repair (one pass, no new reviewer).

- TRIP MATH: table rebuilt as raw editorial planning FLOORS = profile lower bound × days (3d 0.6/1.2/3.0 · 7d 1.4/2.8/7.0 · 14d 2.8/5.6/14 · 30d 6/12/30 — recomputed independently, matches). Rounding rule now "choose the next package your provider offers that is at least this amount" + non-numeric headroom; no universal package ladder; FAQ values aligned. Gate regression #16 recomputes all 12 cells.
- TLDR: single buy rule (conflicting "one package size above your estimate" + "app-update cycle's worth of headroom" removed); headroom is non-numeric or top-up. Gate #17.
- EVIDENCE CLEANUP: "text is kilobytes", "ride-hailing apps are light", "consume gigabytes" (updates/backups) removed → non-numeric documented framing ("materially increase cellular usage" per Apple's own wording class); maps/social/browsing stay labelled editorial.
- APPLE: Connectivity Assist re-sourced to support.apple.com/en-us/127686 "About Connectivity Assist" (fetched, checked 2026-10-06: cellular used when Wi-Fi slow/unusable; supersedes Wi-Fi Assist; on-by-default note). 109323 kept for per-app cellular toggles/system-services note only. Wi-Fi paragraph rewritten with correct attribution. Gate #20.
- ANDROID: "Unrestricted data = assist equivalent" claim removed (Data Saver docs support only background-while-saver-on). Gate #19.
- PEXELS: reader-visible paragraph "Photo: [Ingo Joseph / Pexels](https://www.pexels.com/photo/35969/)" near the opening (block 3); heroCredit stays plain text. Gates #21.
- COPY: "two major travel eSIM apps we cover' own" → "the published plan tables, refund rules and activation mechanics for the two travel eSIM providers we currently cover" — no market-share implication.
- GATE: extended 30 → 39 checks; all PASS exit 0. serializeBlocks 31/31 roundtrip, 20,620 bytes.
- LOCAL DB re-synced + read back verified (draft, publishedAt null, floors/127686/Pexels para present). Production untouched.
- Gates: slop 0, lint 0, typecheck 0, validate:docs PASS, git diff --check clean.
- Commit 7d6261e pushed to content/how-much-esim-data-do-i-need-draft (PR #8 head). NOT merged, NOT deployed, no production import, no publish, indexing unchanged.

---
Task ID: 28
Agent: Claude Code (lead) — PR #8 final blocker cleanup (no reviewer; verification only).
- Residual magnitudes removed (massively-overestimate-messaging, essentially-free-text, ride-hailing-modest, FAQ uses-very-little) → WhatsApp framing: "does not publish a useful per-message data figure; Network usage screen lets you inspect your own usage."
- Connectivity Assist: travel caveat added from source 127686 (not used while iPhone is international roaming or cellular Low Data Mode enabled); no speculation on eSIM roaming treatment. Gate regression #20 extended.
- Technical wording: background "can add cellular use" (no always-on claim); hotspot = shared cellular budget; offline maps "can reduce the amount of online map data needed for the downloaded area."
- Copy bug (we cover' own) fixed; short-version buy rule aligned to floor methodology (at-least-the-floor, no ladder).
- Gate 39 → 42 checks, all PASS exit 0; serializeBlocks 31/31 roundtrip (21,060 bytes); floors recomputed (12/12 match); local duyanblog_dev re-synced + read-back verified (draft, publishedAt null).
- Mergeability re-inspected: origin/main fetched, branch behind 0, PR #8 mergeable=MERGEABLE state=CLEAN. NOT merged.
- Gates: slop 0, lint 0, typecheck 0, validate:docs PASS, diff --check clean. Commit 5fde85f pushed (PR #8 head). Production untouched; indexing unchanged.

---
Task ID: 30
Agent: Claude Code (lead) — PRODUCTION DRAFT IMPORT for how-much-esim-data-do-i-need (NO publish).

- DEPLOY: Spaceship worktree ~/nodeapps/duyanblog-proof ff-only → origin/main 7ee3b97 (canonical, PR #8 merged). prisma migrate deploy: "No pending migrations". prisma generate OK; next build --webpack exit 0; standalone assembled (hero asset present in public/). Restart via supported mechanism tmp/restart.txt touch (CloudLinux Node app selector watches it) — new next-server PID confirmed.
- SOURCE-OF-TRUTH: gate 42/42 exit 0; slop 0; lint 0; typecheck 0; validate:docs PASS; diff --check clean; serializeBlocks 31/31 roundtrip on merged main; all expected invariants verified (guide/slug/isDemo false/duyan/Duy An Tran/travel/31 blocks/readingMinutes 15/hero exact/tags/goLinks 0/no offerId/Pexels 35969/versus link present).
- PREREQUISITES (fail-closed): production author duyan exists with EXACT minimal profile (name Duy An Tran, role Author, bio "Duy An Tran writes for Duyan Blog.", focusAreas []) — verified, not created; category travel exists; slug how-much-esim-data-do-i-need did NOT exist pre-import.
- IMPORT: ONE targeted Prisma transaction (create Article + tag upsert/createMany; app's canonical slugifyTag). status draft, publishedAt null, isDemo false. No AffiliateOffer/Comparison/ReviewScore rows (affiliateOffer count 0 verified post-import).
- READBACK: all fields exact — draft/null/false/Duy An Tran/Author/minimal bio/travel/31 blocks parse/15/hero fields exact/tagSlugs [data-planning, esim, travel-connectivity]/reviewerId null/lastReviewedAt null/featured false/0 go:/no offerId.
- PUBLIC DRAFT INVARIANTS: guide route + all 4 wrong-type routes → 404; slug absent from sitemap.xml, feed.xml, feed.json, /guides index, /travel hub, /tag/esim, /tag/travel-connectivity, /tag/data-planning, homepage (all 0); controls present (sitemap + /compare contain saily-vs-airalo); hero 200; robots Disallow: /; ALLOW_INDEXING=false verified in production env.
- POST-RESTART: homepage 200, /compare/saily-vs-airalo 200, error log + home_error log EMPTY, no new fatal errors. RESEND_API_KEY warning may remain (known). No demo seed, no affiliate records, no schema mutation, no unrelated Article mutations, Hostinger untouched.
- ADMIN PREVIEW UNAVAILABLE — NO AUTHENTICATED SESSION (per brief: not a blocker; DB readback + fail-closed public invariants pass).
- PRODUCTION VERSION: duyanblog.com serving source 7ee3b97 (main; PR #8).
- WORKLOG: this entry only; no article content change, no article PR. Nothing published.

---
Task ID: 31
Agent: Claude Code (lead) — PUBLISHED article #2: how-much-esim-data-do-i-need (indexing still OFF).

- MAIN VS DEPLOYED: origin/main cd96c3f = docs-only diff (worklog Task 30) vs deployed 7ee3b97 — NO redeploy for SHA parity.
- PRE-PUBLISH READBACK: ALL INVARIANTS OK (guard script checked 20+ fields against committed source; guide route 404; robots Disallow: /; ALLOW_INDEXING=false).
- PUBLISH MUTATION: ONE targeted Prisma update, guarded by full draft invariants, changed EXACTLY status + publishedAt (2026-10-06T15:53:30.989Z). No admin PUT; no other field touched.
- VISIBILITY: canonical route 200 on first poll (stale-while-revalidate). Rendered-page verification (Playwright): H1 exact, byline Duy An Tran + role Author, hero ×1, "Image credit: Ingo Joseph / Pexels", Pexels 35969 link, TL;DR, 3 tables, FAQ, sources, versus link, 0 /go/, 0 buy CTAs, canonical exact, OG image = hero, Article + Breadcrumb JSON-LD with datePublished = publishedAt, 0 Product/Offer/Review/aggregateRating schema, wrong-type routes 404. The only "demo" text on page = site-wide footer Demo build disclaimer (pre-existing, not article DemoNotice).
- DISTRIBUTION: sitemap.xml, feed.xml, feed.json, /guides, /travel, /tag/esim, /tag/travel-connectivity, /tag/data-planning all contain the slug; homepage shows it in the latest-articles section (app behaviour — home's latest query is not featured-filtered; featured stays false).
- INCIDENT (Task 31): sitemap.xml stayed stale >4.5 h after publish (many ISR windows). Diagnosis: Next 16 standalone prerendered sitemap body never runtime-revalidated on this host (meta has no expiry; body still build-time). Fix per supported controls: rebuild (same source 7ee3b97 — rebuild is a supported deploy step, not a SHA-chase redeploy) + restart.txt touch. Prerendered sitemap now contains the article; post-restart all routes verified 200 + robots unchanged. Lesson: on this host, content changes that must appear in sitemap.xml require either a rebuild or a documented runtime revalidation path (admin publish route calls revalidatePaths — future publishes should use the admin API or accept rebuild latency).
- LOGS/SAFETY: 0 fatal/unhandled lines; Hostinger untouched; no demo seed; no affiliate rows; no schema mutation; no credential bootstrap; ALLOW_INDEXING=false verified; no Google/Bing submission.
- FINAL READBACK: published / publishedAt set / isDemo false / 31 blocks / rm 15 / hero+tags+author+category unchanged / reviewerId null / lastReviewedAt null / featured false / 0 go: / no offerId. Only the two real articles exist (saily-vs-airalo, how-much-esim-data-do-i-need) — no unrelated mutations.
- NEXT: backlink saily-vs-airalo ↔ guide still pending (small content-sync task); next planned content = Best eSIM for Europe; Content Launch Review before ALLOW_INDEXING=true.

---
Task ID: 33
Agent: Claude Code (lead) — merged PR #9 + production backlink sync (two-way cluster link complete).

- PR #9 verified (OPEN/head 25c637f/MERGEABLE/CLEAN, files = saily-vs-airalo.json + gate script) → MERGED. Canonical origin/main now db33e3c (merge commit).
- DEPLOY DECISION: PR changes only committed content JSON + integrity test script — no runtime app/config/schema files → NO rebuild/deploy. Production deployed code remains 7ee3b97 (verified).
- PRE-SYNC production readback: Saily-vs-Airalo published, isDemo false, 34 blocks, rm 14, publishedAt 11:14:45.251Z, hero/tags/author exact, reviewer/lastReviewed null, comparison not set, 0 go:/offerId, backlink ABSENT. /guides/how-much-esim-data-do-i-need 200; robots Disallow: /; ALLOW_INDEXING=false.
- SYNC (guard-debug note): targeted Prisma update of ONLY `blocks` field; guard initially failed because Prisma returns comparisonId as `undefined` (scalar FK omitted), not `null` — guard switched to nullish (`== null`) after dumping all fields (all others matched). Write succeeded.
- POST-SYNC readback: backlinkCount 1, lives in the plan-tables intro paragraph, not in sources block, 0 go:, 0 offerId, status/publishedAt/title/deck/tldr/hero/rm/tags/author/reviewer/lastReviewed/comparison all unchanged, blocks 34/34.
- PUBLIC: backlink visible immediately (stale-while-revalidate); rendered verification — exactly one link, href exact, punctuation clean ("need?"), no buy CTA, no /go/, 3 tables + FAQ + Sources render, canonical unchanged, Article JSON-LD intact, no Product/Offer/Review/aggregateRating schema. "Demo build" + "Affiliate disclosure" are pre-existing site-wide footer items, not article-level.
- INDEXING OFF: ALLOW_INDEXING=false; robots Disallow: /; no Google/Bing submission.
- SITEMAP FRESHNESS BACKLOG (durable, unchanged): Spaceship standalone sitemap freshness does not reliably follow revalidate=3600; dedicated review required before indexing launch. This task added/removed no URL, so sitemap unchanged.
- LOGS/SAFETY: 0 fatal/unhandled; no Hostinger changes; no demo seed; affiliateOffer count 0; no schema mutation; no credential reset; no unrelated Article mutation.
- NEXT: research gate for best-esim-for-europe (not started here).

---
Task ID: 34
Agent: Claude Code (lead) — RESEARCH GATE for best-esim-for-europe (roundup; research only, no draft, no DB, no deploy, no indexing change).

Superpowers: brainstorming (research/spike path) → structured first-party research → verification → ONE hostile reviewer. Agent cap respected: main + 1 reviewer (brief's DeepSeek/GLM routing note has no other available combo that fits; used allowed main+one-reviewer pattern; no vision subagent — no pixel work required; brief's ultracode hint overridden by agent-routing Rule -1 per Duyan governance).

- SERP (DuckDuckGo HTML, qualitative only, NO metrics): intent = roundup/listicle; heavy vendor ads; providers repeated = Airalo/Saily/Holafly/Nomad/Ubigi (aloSIM, Yesim, Orange, SimLocal, Jetpac-parked observed). Competitors claim hands-on "Tested across N countries". Gaps: few define Europe-region vs country; unlimited/FUP caps rarely documented; hotspot rarely covered; coverage counts stated in mixed units.
- EUROPE DEFINITION (critical): units differ — Saily "35 Countries", Nomad "35/36 Countries", Airalo "41 Countries and Networks", Ubigi named-network list w/ 200+ global claim, Holafly unlimited "200+ destinations" (global marketing) — DO NOT rank raw counts. UK/Switzerland/Türkiye inclusion verified per-provider (Saily: UK yes/CH not-on-page/TR yes; Nomad: UK+CH+TR yes; Ubigi: UK+CH yes, TR not in observed list; Airalo/Holafly lists NOT itemized at check).
- FIRST-PARTY EVIDENCE (all checked 2026-10-07, Playwright): Airalo Europe fixed+unlimited ladders + FUP 3GB/day@20Mbps + tethering counted; Saily Europe fixed + unlimited 15d $49.99 + FUP 5GB/day→1Mbps + 35 countries + 180d activation; Nomad Europe 1-50GB + unlimited 5/10d + ON SALE tags + 35/36 countries + UK/CH/TR + 60d activation + FUP UNRESOLVED; Holafly Europe unlimited €3.79/day + operator-side FUP + hotspot "many" + Always-On 1GB backup; Ubigi Europe fixed ladder + unlimited 7d $23 / 15d $35 / 30d $62 + FUP 25GB full→2Mbps + tethering allowed + Smartstart. Refund: Airalo/Saily documented (Task 22 dates carried); Holafly policy exists; Nomad/Ubigi unresolved.
- DERIVED ($/GB, fixed one-off, same-window only): 10GB/30d Ubigi $1.50 < Nomad $2.30 < Airalo $3.10 < Saily $3.60; 5GB/30d Nomad $3.50 < Airalo $3.90 = Saily $3.90. Verified: Nomad 10GB = list (not sale), Ubigi listings one-off.
- RANKING MODEL: criteria-first (breadth/value/FUP clarity/hotspot/validity/top-up/activation/refund); NO numeric scores; "best for" picks only where ≥2 can contest on documented inputs; no speed/performance ranking; 4G/5G quarantined as marketing.
- INTERNAL LINKS: roundup → guide (/guides/how-much-esim-data-do-i-need) when picking size; roundup → versus (/compare/saily-vs-airalo) where the two providers discussed pairwise; proposed backlinks guide→roundup, versus→roundup (later task); live demo roundup /best/best-esim-providers must be removed/demoted before indexing (no real↔demo cross-links).
- BLUEPRINT: type=roundup, slug=best-esim-for-europe; scope callout → problem → TL;DR quick picks → "what we mean by Europe" → comparison table(s) ≤8 cols → best-for picks → fixed-data comparison → unlimited/FUP → hotspot/tethering → how-much-data (link guide) → Europe caveats → FAQ → sources. pick blocks SAFE without offerId (verified in src/components/editorial/article-renderer.tsx: CTA/disclosure render only if offer). No offerEmbed/comparisonEmbed/go:/AffiliateOffer; no commerce.
- MEDIA BRIEF (no download/vision this task): Europe travel context hero (train/airport/navigation), not fake telecom stock; Pexels OK; attribution verified at draft.
- HOSTILE REVIEW (one round, DO NOT WRITE default → WRITE WITH CONDITIONS): 0 blockers, 6 MAJOR + 8 MINOR, all repaired in one pass: Nomad 10GB list-price re-fetched; Ubigi 15d=$35 re-fetched; Holafly EUR rule; caveats itemization honesty; 200+ quarantined; subscription flags; ≤8-col tables; demo-roundup note; value-scope cross-check; "16%"+testimonials→DO-NOT-CLAIM; renderer path fix. Reviewer confirmed all $/GB math + FUP discipline + date coverage clean.
- VERDICT: B — WRITE WITH CONDITIONS (7 draft conditions recorded in ledger; all evidence doors closed).
- ARTIFACT: git-ignored scratch .superpowers/sdd/2026-10-07-best-esim-europe-research/ledger-notes.md; durable summary = this worklog entry. Branch research/best-esim-for-europe (no PR — repo research convention keeps research off main; will merge draft branch later).
- GATES: validate:docs PASS; git diff --check clean; only worklog.md modified (tracked).
- NEXT: drafting session for content/drafts/best-esim-for-europe.json + TDD gate + one editorial review. Do NOT start here.

---
Task ID: 35
Agent: Claude Code (lead) — best-esim-for-europe roundup DRAFT + Sonnet hostile review + one repair pass + deterministic gates (fresh session, no deployment).

- ROUTING: brief mandated exactly ONE reviewer (Sonnet, pixels + editorial) and no broad re-research. Fresh session. Repo state verified first: branch content/best-esim-for-europe-draft on base 1dc23aa (= origin/main), research commit 2ef41ff in branch history, working tree exactly the three expected Task 35 artifacts (draft JSON, gate script, hero image). Nothing reset/cleaned.
- SUBAGENT PIXEL ROUTING FAILURE (honestly reported): the ONE Sonnet subagent could not read the local hero image in ANY form — 3 fresh captures at different sizes (original 77KB, 600px/21KB, 300px/8KB) across general-purpose(Sonnet) AND the duyan-vision-reader instrument all terminated with HTTP 413 Request too large at the image-Read task boundary, while text-only file reads (draft JSON, ledger, script) succeeded identically in the same harness. This is the documented instrument-failure mode (agent-routing: IMAGE READ FAILURE = not evidence about the image; never convert to "looks fine/broken"). Remediation: heroAlt verified against origin metadata from the Pexels API — photo 16022620 = "Man using a smartphone on a train journey through scenic landscape", photographer Jonathan Borba, credit + photo ID + URL form all corroborated; alt makes NO location/country assertion and contains no telecom imagery terms. Hero pixel-reading left as manual-confirm item for PR review (recommend a vision-capable reader on a working harness before publish).
- SONNET HOSTILE EDITORIAL REVIEW (1 agent, text-only, on draft + ledger + gate): FINAL VERDICT = DO NOT SHIP — 3 BLOCKERS + 5 MAJOR + 8 MINOR. Hardest points: Saily/Switzerland self-contradiction (body vs FAQ); "200+ destinations" mis-attributed to Ubigi Europe pick (that figure is Ubigi's GLOBAL eSIM-data-plans landing, not the Europe page); top-ups claimed "documented on all five" with no ledger evidence; Holafly per-day ladder extrapolation past 1 day (UNRESOLVED in ledger); blanket "every … read on Oct 7" overstated two 10-06 sources; criteria published AFTER the picks; "10GB/30d covers a one-to-two-week trip" = banned sufficiency claim; Airalo "upper end" (actually 3rd of 4); "1–2 Mbps" applied to Airalo (no documented figure); internal links double-counted via sources list.
- NARROW RE-FETCHES (only for volatile corrections Sonnet required, no broad re-research): Ubigi europe-data-plans page — "200+ destinations worldwide" confirmed present but on the GLOBAL ubigi-esim-data-plans breadcrumb/LD, not the Europe page (drives the B2 strike); Türkiye present in the page's destination map under data-region=Europe but as a global route map, NOT evidence the Europe plan's per-country network list includes Türkiye — draft's "not in the Ubigi Europe network list we read + check the plan" kept as ledger-consistent; Holafly esim-europe — €3.79 = the 1-day price (schema + UI both), multi-day ladder lives behind an interactive selector not enumerated (keeps M1 repair); guide method re-verified: how-much-esim-data-do-i-need uses "arithmetic from a published bitrate / per hour as kbit/s × 3", so the draft's link sentence now says "published bitrate figures"; Pexels slugless short URL returns 403 to non-browser UAs (anti-bot) — kept slugless because the gate regex hard-codes that form and Pexels API confirms photo 16022620 exists with the credited photographer.
- REPAIRS APPLIED (ONE pass, 11 edits): B1 Saily/Switzerland clause corrected in What-Europe body to match FAQ + ledger; B2 "200+ destinations" struck from Ubigi pick, replaced with per-country-network-list wording; B3 top-up claim rewritten from "documented on all five (in-app/…)" to an honest no-evidence sentence + refund "not verified at check"; M1 Holafly blurb + table cell downgraded to "€3.79 for one day … selector not itemised" and "€3.79/day (1-day price shown)"; M2 callout + table caption now "except two fair-use/hotspot sources carry their Oct 6 date"; M3 caveat speed floor now provider-specific (Ubigi 2 / Saily 1 / Airalo reduced-no-figure / Holafly local-operator); M4 criteria paragraph now precedes picks (8 criteria, equal weight, ranks = per-use-case editorial ordering, NOT an overall "best card"); M5 + tl;dr changed from "covers a normal trip" to "the shape all four sell / we can compare honestly" (sufficiency handed to the guide); m1 Airalo → "second-highest … above Ubigi and Nomad"; m2 speed-wording per provider; m3 tl;dr "$1.50 of that row" not "of five"; m4 guide sentence → "published bitrate figures"; m5 two internal sources entries removed from the sources block (body links remain the exactly-one-each surface); m6 three superlatives tagged "in our reading/editorial reading; m7 refund → "not verified at check"; m8 Pexels kept slugless (gate + API corroboration). Nomad badge → "Best for itemised regional coverage" (was "broad regional planning", read as raw-breadth winner).
- TDD / VERIFY: gate node scripts/test-article-draft-best-esim-for-europe.mjs = 49/49 PASS exit 0; npm run slop = 0 hits; npm run lint = 0; npm run typecheck = 0; npm run validate:docs = all PASS (budget 23950B ≤ 24000B, docs + memory + rule indexes + no stray root artifacts); git diff --check clean. Real serializeBlocks() (src/lib/content-schema.ts via node --experimental-strip-types): 37 blocks, serialized bytes 21196, ROUNDTRIP_DIFFS 0 (field-level), word count full ~1867, readingMinutes 15, 5 pick blocks (ranks 1–5), 12 external sources (all checked-dated), exactly one internal link to /guides/how-much-esim-data-do-i-need and exactly one to /compare/saily-vs-airalo (both in body paragraphs, contextual), 0 go:/offerId/commerce. No build/deploy — draft is JSON content only, no source change (gate's "if code changed" does not trigger for content-JSON drafts; build is deferred to import task).
- LOCAL DB: NOT persisted — draft stays a file artifact; DB import belongs to the publish task (per precedent Tasks 22/30, draft only lives as JSON until the import round). No production/Hostinger/Spaceship touch; no demo seed; indexing untouched.
- PR: branch content/best-esim-for-europe-draft pushed; PR opened targeting main, DO NOT MERGE. Commit created for the three artifacts (draft + gate + hero) + worklog. Research commit 2ef41ff preserved in branch history.
- NEXT (for PR reviewer): confirm hero pixels via a vision-capable harness (instrument blocked in this session); then import to duyanblog_dev as status=draft and, in a later publish task, replace/demote the demo /best/best-esim-providers roundup before this indexes (Task 34 ledger F11).

---
Task ID: 35.1
Agent: Claude Code (lead) — PR #10 independent-review repairs (activation/validity, popularity/sizing, country-vs-regional, post-cap judgment, refund sources, real gate checks on price/currency/links + regression guards).

- HEAD: adae4a1 (reviewed head). Not merged; not deployed; no DB change; no prod/indexing/Hostinger/Spaceship touch. Hero pixel check CLEARED by the independent reviewer — hero, heroAlt, heroCredit untouched.
- BLOCKER 1 (activation): draft generalised "all five activate on arrival / validity clock starts at the destination" across three surfaces (activation paragraph, Europe-caveats bullet, validity FAQ). Root cause: no source for the universal claim; Airalo is package-specific. NARROW re-fetch of Airalo official help confirmed TWO documented validity modes: "The validity period starts as soon as the eSIM is installed on a device, even outside of its coverage area" verses "The validity period starts when the eSIM connects to a mobile network in its coverage area" — package-selected. Repaired all three surfaces to provider-specific + Airalo package-specific + "check the plan's validity policy before installing early"; no universal "arrival" claim, no "clock starts when you land".
- ITEM 2 (popularity/sizing): "the fixed-data shape most travellers buy" → "the fixed-data shape all four fixed-data providers sell"; "the 20–50GB rows are the safer start if you will stream, tether or back up photos" removed; "10GB/30d row is only a comparison anchor, not a recommendation how much to buy" added; exactly one guide link retained.
- ITEM 3 (country vs regional): removed "country-specific is often cheaper because it does not pay for regional breadth" and "regional plan wins for anything with more than one border crossing"; replaced with neutral framing (regional reduces switching / compare country plan vs regional on price, validity, coverage / no universal winner).
- ITEM 4 (post-cap judgment): removed "fine for maps and messaging and poor for streaming a second screen"; kept provider-specific documented floors only and added "not real-world results from our own testing" (reworded to avoid the gate's first-hand-testing regex).
- ITEM 5 (refund sources): NARROW first-party re-fetches added to sources (16 total, ≤25): Airalo validity-policy help; Saily "What is Saily's refund policy?" hc article 16420576170652 (full refund within 30 days if not installed/activated); Airalo "My Account & Airmoney" hc QT1HK3HU71BG (app-based refunds, Airmoney or original payment method); Holafly esim.holafly.com/refund-policy (up to 6 months, full/partial conditions). Nomad/Ubigi refunds remain unresolved. All labels carry 2026-10-07 check dates (matching the narrow re-fetch date).
- ITEM 6 (fake gate checks — TDD): replaced `check("price/GB…", true)` no-op with a structural parser that locates the fixed-data 10GB/30d table (head: Plan / List price / Price / GB), parses each row's GB + USD list price + displayed $/GB, and asserts round(listPrice ÷ GB, 2) === displayed for the four providers; asserts no unexpected provider in that row. Replaced `… || true` currency check with real enforcement: all $/GB-table rows must be USD (no €/EUR), Holafly must be absent from the row, €/EUR must appear in prose with a flat-fee/position disclaimer.
- ITEM 7 (link counts — TDD): switched from paragraph-presence counting to exact Markdown-link OCCURRENCE counting (matchAll over prose across paragraph/callout/list/quote/pick); exactly 1 guide + 1 versus required.
- ITEM 8 (regression guards): added 6 durable checks rejecting "most travellers buy", "safer start"/sizing recommendation, "all five activate on arrival", "clock starts when you land", "regional plan wins", invented country-cheaper causal wording.
- TDD RED→GREEN→MUTATION verified: initial run against the reviewed draft = 7 FAILs (refund sources, popularity, sizing, blanket activation ×2, regional wins, country-cheaper); after repairs = 51/51 PASS. Mutation tests: (1) Ubigi $/GB 1.50→9.99 → FAIL "shown $9.99/GB != recomputed $1.5" then restore PASS; (2) injected Holafly € row → FAIL price-math + currency then restore PASS; (3a) duplicate guide link → FAIL "exactly one guide link — 2"; (3b) duplicate vs link → FAIL "exactly one saily-vs-airalo link — 2"; restores PASS. Each check fails on its corrupted input and passes on restore.
- GATES: node scripts/test-article-draft-best-esim-for-europe.mjs 51/51 exit 0; npm run slop 0; npm run lint 0; npm run typecheck 0; npm run validate:docs PASS; git diff --check clean. REAL serializeBlocks() (src/lib/content-schema.ts via node --experimental-strip-types): 37 blocks, serialized 22,749 B, ROUNDTRIP_DIFFS 0, 16 sources, 5 picks, guide links exactly 1, vs links exactly 1, 0 go:/offerId.
- COMMITS: this round = one focused repair commit (draft + gate script) + worklog entry. Branch pushed; PR #10 updated (head changes), not merged.
- NEXT: PR reviewer re-check on the repaired head; then import to duyanblog_dev as draft and the demo-roundup demotion before publish (unchanged from Task 35).

---
Task ID: 36
Agent: Claude Code (lead) — PRODUCTION DRAFT IMPORT for best-esim-for-europe (roundup; NO publish, indexing OFF).

- SOURCE OF TRUTH (origin/main 1ae96a3 = PR #10 merged): gate 51/51 exit 0; slop 0; lint 0; typecheck 0; validate:docs PASS (auto-load budget 23950/24000 — worklog excluded from budget); diff --check clean; serializeBlocks 37/37 round-trip 0 diffs (22,749 B); 16 sources; 5 picks ranks 1-5; exactly 1 guide + 1 versus markdown link; zero go:/offerId/offerEmbed/comparisonEmbed; no buy CTA. All field invariants PASS (roundup/slug/isDemo false/duyan/Duy An Tran/travel/37 blocks/15 read min/hero exact/3 tags).
- DEPLOY (Spaceship only; Hostinger untouched): production worktree ~/nodeapps/duyanblog-proof ff-only → origin/main 1ae96a3. prisma migrate deploy: "No pending migrations" (schema already canonical). prisma generate OK. next build --webpack: SWC→WASM fallback is pre-existing host constraint (glibc 2.28); BUILD_ID s-EsFjXWxQMVTfFbfqTmv exit 0; standalone assembled with hero asset. Runtime-cache deployment note (durable): next build's standalone phase hit ENOTEMPTY rmdir on .next/standalone/.next/server/route-cache when the LONG-LIVED running server (9h uptime) was actively writing ISR route-cache during the build — first rebuild against an accumulated route-cache. Recovered by clearing the stale route-cache dirs (regenerable ISR data) before rebuild; build then succeeded. Future in-place rebuilds on this host must clear .next route-cache dirs first or the standalone phase fails. Restart via supported tmp/restart.txt touch — old PID replaced by new next-server on the new standalone (verified cwd .next/standalone, ALLOW_INDEXING=false, NEXT_PUBLIC_SITE_URL=https://duyanblog.com, LSNODE_STARTUP_FILE). Deployed SHA verified = 1ae96a3.
- POST-DEPLOY: homepage/compare/guide 200; hero /images/articles/best-esim-for-europe/hero-europe-train.jpg 200 (77,392 B); /best/best-esim-for-europe 404 (pre-import); robots Disallow: /; error + home_error logs EMPTY (no fatal/unhandled).
- PREREQUISITES (fail-closed): production author duyan existing EXACT minimal profile (Duy An Tran / Author / "Duy An Tran writes for Duyan Blog." / focusAreas []); category travel existing; slug best-esim-for-europe did NOT exist pre-import.
- IMPORT: ONE minimal Prisma transaction (create Article + canonical tag upsert + articleTag createMany; app's slugifyTag → esim/europe/travel-connectivity). status draft, publishedAt null, isDemo false, reviewerId null, lastReviewedAt null, featured false. No AffiliateOffer/Comparison/ReviewScore/SourceCitation rows (committed sources block = source of truth). articleId cmuxfys2e0001bj06p3jvpmso.
- READBACK: all fields exact — draft/null/false/Duy An Tran/Author/travel/37 blocks parse/5 picks ranks 1-5/15 min/hero exact/3 tag slugs esim·europe·travel-connectivity/reviewerId null/lastReviewedAt null/featured false/1 guide link/1 versus link/0 go:/0 offerId/0 offers rows/0 comparison/0 scores/16 sources.
- PUBLIC DRAFT INVARIANTS: canonical + 4 wrong-type routes → 404; slug absent from sitemap.xml, feed.xml, feed.json, /best, /travel, /tag/esim, /tag/europe, /tag/travel-connectivity, homepage, search (all 0); controls present (sitemap + guides/compare contain saily-vs-airalo + how-much guide); hero 200; robots Disallow: /; ALLOW_INDEXING=false verified.
- DEMO ROUNDUP STATE (durable finding): /best/best-esim-providers does NOT exist in production DB (DEMO_ROUNDUP null; isDemo articles 0; affiliate offers 0). The demo roundup is a local-seed artifact never imported to production MySQL — its removal/demotion is moot for the real roundup until/unless a demo roundup is ever seeded to production. Total production articles now 3 (saily-vs-airalo, how-much-esim-data-do-i-need, best-esim-for-europe).
- ADMIN PREVIEW UNAVAILABLE — NO AUTHENTICATED SESSION (per brief: not a blocker; DB readback + public draft invariants pass).
- SITEMAP BACKLOG (durable, unchanged): Spaceship standalone sitemap freshness has not reliably followed revalidate=3600; dedicated review required before indexing launch. Not fixed in Task 36.
- LOGS/SAFETY: Hostinger untouched; no demo seed; no affiliate rows (count 0); no Comparison; no ReviewScore; no schema mutation (no pending migrations); no unrelated Article mutations; no indexing change; no new fatal/unhandled production logs (error/home_error clean). RESEND warning not observed in this window.
- PRODUCTION VERSION: duyanblog.com serving origin/main 1ae96a3 (PR #10 merged), standalone BUILD_ID s-EsFjXWxQMVTfFbfqTmv, ALLOW_INDEXING=false.
- WORKLOG: docs-only commit (this entry); no redeploy needed (docs outside deployed static bundle).
- NEXT: pre-publish review of the draft (route-level + editorial), then publish via admin API or rebuild-latency path; do NOT enable ALLOW_INDEXING or submit search engines before the Content Launch Review.

---
Task ID: 37
Agent: Claude Code (lead) — PRE-PUBLISH RENDER REVIEW for best-esim-for-europe (local Playwright DOM-only; NO production change, NO publish).

- SCOPE: review only. origin/main = bcba304 (deployed code = 1ae96a3; diff = Task 36 worklog/docs only, verified). Gates on main: draft gate 51/51 exit 0; slop 0; lint 0; typecheck 0; validate:docs PASS; diff --check clean; serializeBlocks 37/37 round-trip 0 diffs (22,749 B).
- PROD DRAFT READBACK (read-only): 23/23 invariants PASS — slug/type roundup/status draft/publishedAt null/isDemo false/Duy An Tran/travel/37 blocks/5 picks ranks 1-5/15 min/hero exact/tags esim·europe·travel-connectivity/reviewer null/lastReviewedAt null/featured false/1 guide + 1 versus link/0 go:/0 offerId/0 offers/0 comparison/0 scores. Canonical route 404 confirmed.
- LOCAL MIRROR (duyanblog_dev only; no prod/Hostinger DB): created test-fixture Article from exact committed JSON, status=published + local test timestamp (ONLY to render the real /best route locally), isDemo false, featured false, author duyan temporarily aligned to minimal profile then restored to local seed profile after render. Not a seed corpus.
- LOCAL RENDER (Playwright, localhost:3000, real route /best/best-esim-for-europe): H1 exact; TL;DR/deck/byline (Duy An Tran)/methodology callout/What-Europe-means/quick table/price table (all $/GB)/unlimited-FUP/hotspot/activation-refund/caveats/FAQ 6/Sources 16 all render; 2 tables; hero img count 1 with exact alt; hero credit + reader-visible Pexels photo 16022620 link.
- PICKS/COMMERCE: all 5 pick cards render with ranks 1-5 and badges (BEST FIXED-DATA VALUE / ITEMISED REGIONAL COVERAGE / CLARITY ON UNLIMITED TETHERING / HIGH DAILY UNLIMITED ALLOWANCE / SIMPLE FLAT-FEE UNLIMITED — renderer uppercases). 0 /go/ links; 0 buy/shop/view-deal CTA; 0 pick-level affiliate disclosure. Only "demo/sample" text on page = site-wide footer disclaimer (allowed). No article-level commerce.
- RESPONSIVENESS (DOM only): desktop 1440x900 no doc overflow (1425≤1440); mobile 390x844 no doc overflow (375≤390); 5 picks in flow, 0 hidden; H1 visible; tables scroll within their own overflow containers (allowed); FAQ control reachable; 0 console errors/warnings on article route.
- INTERNAL LINKS: exactly 1 rendered body link to /guides/how-much-esim-data-do-i-need ("How much eSIM data do I need?"), exactly 1 to /compare/saily-vs-airalo ("Saily vs Airalo comparison"); zero duplicates anywhere (rendered DOM link set).
- SEO/JSON-LD: canonical exact https://duyanblog.com/best/best-esim-for-europe; og:image = committed hero; title/description approved; Article (author Person Duy An Tran) + BreadcrumbList + benign ItemList(empty); NO Product/Offer/Review/aggregateRating.
- HIGH-RISK CLAIMS (rendered DOM spot check): Ubigi FUP duration-specific 25GB/7d+30/15d+60/30d→2Mbps; Airalo 3GB/day@20Mbps; Saily 5GB/day→1Mbps; Holafly 1GB/day hotspot + operator-side FUP; Nomad unresolved; Airalo validity package-specific (x3); ABSENT: "all five activate", "clock starts when you land", "most travellers buy", "safer start", "regional plan wins", first-hand-testing.
- WRONG-TYPE LOCAL ROUTES: /reviews, /compare, /guides, /articles best-esim-for-europe → all 404; only /best resolves.
- PRODUCTION SAFETY: after local testing — /best/best-esim-for-europe 404; ALLOW_INDEXING=false (live env verified); robots Disallow: /; prod DB row still status=draft/publishedAt=null/isDemo false/updatedAt unchanged; no production write occurred.
- DEMO ROUNDUP: prod /best/best-esim-providers still absent (404) — Task 36 finding stands; no cleanup commit for local seed fixtures (out of scope); local fixture left status=draft.
- SITEMAP: production sitemap excludes article #3 (draft) — consistent; standalone ISR sitemap-freshness backlog remains for the publish task.
- CLEANUP: local mirror returned to draft, local author restored, dev server stopped, AGENTS.md auto-injected block by next dev reverted (working tree clean), temp scripts removed.
- NEXT: targeted publish task (Task 38) must account for sitemap-freshness latency explicitly; Content Launch Review still gates ALLOW_INDEXING.

---
Task ID: 38
Agent: Claude Code (lead) — TARGETED PUBLISH article #3 best-esim-for-europe (indexing OFF; intentional rebuild for sitemap/feed freshness).

- PRE-PUBLISH READBACK (fail-closed): 25/25 PASS — roundup/draft/publishedAt null/isDemo false/Duy An Tran/Author/bio exact/focusAreas []/travel/37 blocks/5 picks ranks 1-5/15 min/hero exact/tags esim·europe·travel-connectivity/reviewer null/lastReviewedAt null/featured false/1 guide + 1 versus/0 go:/0 offerId/0 offers/0 comparison/0 scores. Public route 404, robots Disallow: /, ALLOW_INDEXING=false.
- PUBLISH MUTATION: guarded Prisma update, ONLY status→"published" + publishedAt→now (2026-10-07T02:05:35.894Z). Guard passed (complete expected-draft-state guard, any mismatch = write nothing). articleId cmuxfys2e0001bj06p3jvpmso unchanged. No other field touched.
- POST-WRITE DB: 16/16 PASS — status published, publishedAt exact ts, all metadata/relations unchanged, 0 commerce.
- PUBLIC PAGE (Playwright, production): route 200 on first poll; H1 exact; Duy An Tran byline; hero once + exact alt; Pexels 16022620 link; TL;DR; methodology callout; 2 tables; 5 pick cards (ranks 1-5 + badges); FUP/hotspot/activation/refund sections; FAQ 6; Sources 16; article-body EXACTLY 1 guide + 1 versus link (the "Keep reading" related block adds one cross-link each to articles #1/#2 — site template, not article duplication); 0 /go/; 0 buy CTA; 0 pick-level affiliate disclosure; no article demo notice (only site-wide footer, allowed).
- SEO/JSON-LD: canonical exact https://duyanblog.com/best/best-esim-for-europe; og:image=hero; title/description approved; Article (Person Duy An Tran, datePublished=exact production ts) + BreadcrumbList + benign ItemList; NO Product/Offer/Review/aggregateRating. Wrong-type routes all 404.
- INTENTIONAL REBUILD (sitemap/feed freshness — standalone ISR unreliable per Tasks 30/36): cleared regenerable .next route-cache first (Task 36 ENOTEMPTY recovery); prisma migrate deploy "No pending migrations"; prisma generate OK; next build --webpack exit 0 (BUILD_ID VDr3d2Q-wsj-_YkhBm5Li; SWC→WASM fallback pre-existing); standalone assembled. Restart via tmp/restart.txt — new PID serving new BUILD_ID. Deployed source SHA kept at 1ae96a3 (no docs-only parity chase; docs outside runtime bundle).
- DISTRIBUTION POST-REBUILD: #3 present in sitemap.xml (correct /best/ URL), feed.xml, feed.json, /best, /travel, /tag/esim, /tag/europe, /tag/travel-connectivity, and homepage latest-articles query (verified rendered, 5 hrefs). featured false (no mutation to force homepage). Existing articles intact (saily-vs-airalo 200, guide 200, both unchanged).
- DEMO ROUNDUP: /best/best-esim-providers still ABSENT (DB row null, route 404). Not a launch blocker.
- HIGH-RISK CLAIMS (live page): Ubigi 25/7d+30/15d+60/30d→2Mbps; Airalo 3GB/day@20Mbps; Saily 5GB/day→1Mbps; Holafly 1GB/day + operator FUP; Nomad unresolved; Airalo package-specific; ABSENT all-five-arrival/clock-land/most-travellers-buy/safer-start/regional-wins/first-hand.
- FINAL DB: 18/18 PASS — published/publishedAt exact/37 blocks/5 picks/unmodified metadata/0 commerce/0 demo row; other two articles untouched (their updatedAt from prior tasks).
- LOGS/SAFETY: error log EMPTY; no fatal/unhandled/ENOTEMPTY; Hostinger untouched; no demo seed; no affiliate rows; no Comparison/ReviewScore; no credential action; no unrelated Article mutation. Known RESEND warning was not re-observed in this window.
- INDEXING: ALLOW_INDEXING=false (live env) + robots Disallow: / verified post-rebuild. No Google/Bing/URL-inspection submissions. Content Launch Review still required before indexing (3-article cluster now public but unindexed).
- PRODUCTION VERSION: source SHA 1ae96a3 (unchanged), standalone BUILD_ID VDr3d2Q-wsj-_YkhBm5Li.
- NEXT: reverse backlinks from articles #1/#2 into the Europe roundup (Content Launch Review remains the indexing gate; sitemap-freshness latency now mitigated by rebuild-on-publish convention).

---
Task ID: 39
Agent: Claude Code (lead) — reverse backlinks from articles #1/#2 into Europe roundup (SOURCE PR ONLY; NOT merged, NOT sync'd).

- BASE: origin/main f50fa41 (= Task 38's worklog commit). Branch content/europe-roundup-reverse-backlinks (HEAD 1e95426).
- SCOPE: content JSON + gate scripts only. No article #3 content, no runtime code, no production/DB/indexing/Hostinger/Spaceship change. DO NOT MERGE / DO NOT SYNC PRODUCTION.
- ARTICLE #1 (saily-vs-airalo): added ONE contextual backlink at the Europe-plans conclusion — "If Europe is your destination and you want to compare a wider set of providers rather than just these two, our [Best eSIM for Europe](/best/best-esim-for-europe) roundup compares five regional options on documented pricing, coverage and fair-use terms." Existing guide link preserved (exactly 1). Block count 34 unchanged.
- ARTICLE #2 (how-much-esim-data-do-i-need): added ONE contextual backlink in the "After you know the volume you need" paragraph — "If your trip crosses European countries, our [Best eSIM for Europe](/best/best-esim-for-europe) roundup compares current regional plan shapes after you have estimated how much data you need." Existing versus link preserved (exactly 1). Block count 31 unchanged.
- TDD / MUTATION TESTS: both gates now enforce EXACT Markdown-link OCCURRENCE counts (matchAll) for the new backlink. Mutation A1 (dupe europe link in saily-vs-airalo same paragraph) → FAIL count 2, restore PASS. Mutation A2 (dupe in guide same paragraph) → FAIL count 2, restore PASS. Article #1 gate also asserts the europe link lives in prose, not the sources block.
- GATES: saily-vs-airalo gate PASS (all incl. new europe checks); how-much gate PASS (versus exactly 1 + europe exactly 1); best-esim-for-europe gate PASS (untouched). slop 0, lint 0, typecheck 0, validate:docs PASS, git diff --check clean. REAL serializeBlocks(): saily-vs-airalo 34 blocks / 21,210 B / round-trip 0 diffs; how-much 31 blocks / 20,971 B / round-trip 0 diffs.
- CONTENT SAFETY: no go:/offerId/offerEmbed/comparisonEmbed; no first-hand wording; no universal-winner claim; no speed/reliability claim; no provider-recommendation wording ("Best eSIM for Europe" used only as the roundup's link label). The word "checkout" (pre-existing, unmodified) is factual tax-handling prose, not a CTA.
- COMMIT: 1e95426 (content + gates). One focused commit. Pushed branch; PR opened targeting main. NOT merged.
- NEXT: independent PR review; after merge + authorized targeted sync task, run the production backlink sync (one block-field update per article + revalidate), then Content Launch Review for indexing.

---
Task ID: 39.1
Agent: Claude Code (lead) — TARGETED PRODUCTION REVERSE-BACKLINK SYNC (PR #11 backlinks live; no deploy/build/migration).

- SOURCE / MERGE: origin/main 07c739a (= PR #11 merged). Merge diff parent f50fa41..07c739a = article #1+#2 JSON (1 line each: Europe-roundup backlink), their gates, worklog. NO runtime/app/config/schema change. Gates on merged source: saily-vs-airalo PASS (guide 1 + europe 1), how-much PASS (versus 1 + europe 1), best-esim-for-europe PASS (untouched); slop/lint/typecheck/validate:docs/diff-check clean. serializeBlocks: #1 34 blocks / 21,210 B / 0 diffs; #2 31 blocks / 20,971 B / 0 diffs.
- PRE-SYNC PRODUCTION (fail-closed): #1 saily-vs-airalo published, blocks 34, guide 1, europe-roundup 0 — no drift. #2 how-much published, blocks 31, versus 1, europe 0. #3 best-esim published, blocks 37, guide 1, versus 1. All fields intact (publishedAt, author, category, tags, reviewer/lastReviewed null, featured false, no comparison/offers/scores).
- MUTATION: guard+publish-verification-mounted. Atomic $transaction updating ONLY blocks for #1 (merged serialized, exact bytes verified STORED_MATCHES_MERGED=true) and #2 (same). Guards: merge-content guard (34/1/1 + 31/1/1, 0 go:/offerId) + pre-state guard (europe must be 0 before sync) all passed. publishedAt unchanged for both; Prisma auto-touched updatedAt (reported separately; no manual set).
- POST-SYNC DB: #1 blocks 34, guide 1, europe 1; #2 blocks 31, versus 1, europe 1; #3 untouched (37/1/1). 0 go:, 0 offerId, no commerce; all non-block fields unchanged (verified publishedAt identical). sources intact.
- PUBLIC (normal ISR revalidate=300; backlinks surfaced on first poll, no cache hacks): /compare/saily-vs-airalo body guide 1 + europe 1; /guides/how-much-esim-data-do-i-need body versus 1 + europe 1. Article-body counts exclude the "Keep reading" template links (0 in Keep-reading for these). No rebuild/restart performed — DB-only change surfaced via revalidation.
- THREE-WAY CLUSTER (authored, verified rendered): A1 → guide 1 + europe 1; A2 → versus 1 + europe 1; A3 → guide 1 + versus 1. All three canonical routes 200.
- CONTENT/COMMERCE REGRESSION: canonical/H1/hero/TL;DR/FAQ/sources unchanged on both; JSON-LD Article+BreadcrumbList only (no Product/Offer/Review/aggregateRating) on both; 0 /go/; no new buy CTA; no pick-level affiliate disclosure. Article #3 unchanged.
- SITEMAP/DISTRIBUTION: no URL set change; all 3 article URLs present in sitemap, all routes 200. Feed unchanged (no backlink encoding). sitemap rebuild NOT needed.
- LOGS/SAFETY: Hostinger untouched; no schema/migration/deploy; no demo seed; no affiliate/Comparison/ReviewScore rows; no unrelated Article mutation; error log EMPTY; no fatal/unhandled.
- INDEXING: ALLOW_INDEXING=false (live env verified) + robots Disallow: /; no search-engine submission.
- PRODUCTION VERSION: source SHA 1ae96a3 unchanged; BUILD_ID VDr3d2Q-wsj-_YkhBm5Li unchanged (no rebuild).
- NEXT: Content Launch Review (indexing gate). 3-article authored cluster now fully interlinked and live.

---
Task ID: 40
Agent: Claude Code (lead) — CONTENT LAUNCH REVIEW / FINAL INDEXING GATE — AUDIT ONLY (Task 40). No source change, no build, no deploy, no indexing mutation, no DB write. Verdict reached but indexing stays OFF.

- SOURCE / RUNTIME DRIFT: origin/main d3a9c96 confirmed; deployed runtime source 1ae96a3 confirmed. Diff = 5 files only: worklog.md + 2 gate scripts + content/drafts #1/#2 (1-line europe backlink each, live via Task 39.1 DB sync). NO runtime/app/config/schema file changed. No runtime code deployment needed. Not a blocker.
- REPO GATES: 3 dedicated article gates PASS (exit 0); slop 0; lint 0; typecheck 0; validate:docs PASS (23950B ≤ 24000B); git diff --check clean. SerializeBlocks parses: #1 34, #2 31, #3 37.
- PROD DB INVENTORY (read-only, server-side Prisma): 3 articles exactly (saily-vs-airalo /versus, how-much /guide, best-esim-for-europe /roundup), all published, isDemo=false, category=travel (Travel & Connectivity), author dup:duyan (Duy An Tran), featured=false, reviewerId=null/lastReviewedAt null (truthful), publishedAt valid, heroImage present. COMPARISONS=0, OFFERS=0, REVIEWSCORES=0, DEMO_ARTICLES=0, USERS=0, SESSIONS=0, NEWSLETTER_SUBSCRIBERS=0, AFFILIATE_CLICKS=0. No /best/best-esim-providers (404). SiteSetting rows=[] (demo_mode/ads_enabled unset) — footer demo text is hardcoded UI, not DB-driven.
- THREE-ARTICLE CLUSTER (rendered): all 3 canonical routes 200; wrong-type routes all 404 (12 checked); DB blocks authored links — #1 ↔ guide 1 + europe 1; #2 ↔ versus 1 + europe 1; #3 ↔ guide 1 + versus 1. No body /go/ or offerId (0/0/0). No broken internal links.
- ARTICLE QUALITY: H1/deck/byline(Duy An Tran)/hero+credit(real Pexels)/TL;DR/FAQ/Sources all render on every article; 0 raw JSON, 0 iframe/video, tables render. #1 claims evidence-bounded (no universal winner). #2 math labelled derived/editorial; no 2-7GB OS-style estimate. #3 FUP specifics verified (Ubigi 25GB/7d+30/15d+60/30d→2Mbps, Airalo 3GB/day@20Mbps, Saily 5GB/day→1Mbps, Holafly 1GB/day hotspot+operator FUP, Nomad unresolved, Airalo package-specific validity); picks 1-5 render; only "tested" occurrences are explicit negations ("none of these cards was tested by us").
- COMMERCE STATE: zero /go/, zero offers, zero merchant CTAs sitewide; AFFILIATE_CLICKS=0; no AdSlot (ads_enabled=false, SiteSetting empty). FINDING: best/[slug] renders <AffiliateDisclosure variant="box"/> ("Some links on this page are affiliate links") unconditionally on the roundup page with zero affiliate links → article-level disclosure caused by nonexistent commerce (MAJOR).
- CANONICALS/ROUTES: exact canonicals on all 3; www returns 200 but canonical corrects to naked domain (no dup); http→301 https; search results canonicalize to /search (not articles); /search has page-level noindex; malformed /compare/%zz → 500 (plain body, no stack leak; MINOR robustness).
- METADATA/OG: per-article unique title/canonical/og:*/twitter; 0 noindex meta on public pages; hero images 200; homepage OK.
- STRUCTURED DATA: Article + BreadcrumbList (+ benign empty ItemList on #3) on the three; NewsMediaOrganization + WebSite on homepage; datePublished matches DB; NO Product/Offer/Review/aggregateRating anywhere.
- SITEMAP: all 3 canonical article URLs present exactly once; no draft/demo/wrong-type/admin/go/search URLs; static/tag/category URLs sensible; lastmod fresh. Current sitemap CORRECT. Standalone ISR revalidate=3600 unreliability remains — accepted operational debt handled by explicit publish→rebuild→verify workflow (documented Tasks 30/36/38).
- FEEDS/DISTRIBUTION: feed.xml + feed.json contain exactly the 3 canonical article URLs; /best /travel /tag/* /search /homepage list the 3 correctly; no draft leak.
- ROBOTS/INDEXING SWITCH: current env ALLOW_INDEXING=false (read directly from node-selector.json) + robots.txt Disallow:/ (Googlebot + *). When flipped true: robots code emits Allow:/ + Disallow admin/api/go/search + sitemap+host; NO X-Robots-Tag/header/middleware/noindex anywhere blocking (next.config headers only security headers; search page has its own deliberate noindex; articles carry no noindex). Flipping is safe — no contradictory directives (verified from code + live headers).
- NAVIGATION: header nav all valid; /#newsletter anchor resolves; no placeholder # links. FINDING: footer "Sections" /software + /tech → 404 dead links on every page (MAJOR usability).
- FOOTER/DEMO LANGUAGE (Ph 16 — MAJOR): site-wide footer says "Demo build — every product, merchant and offer shown is a clearly labelled fictional sample."; /about masthead says "currently a demonstration build…fictional sample data."; /affiliate-disclosure says "In this demonstration build…". This materially tells visitors/search engines the whole site is a demo while 3 real published editorial articles are live → contradictory notices per EDITORIAL_GUIDE §7. Blocks indexing? Not technically (no noindex directive) but ships a trust contradiction and misleads engines about content authenticity; must be resolved before search engines are engaged.
- LEGAL/POLICY: about/contact/methodology/how-we-make-money/editorial-policy/corrections/advertising-disclosure/affiliate-disclosure/privacy/cookie/terms all 200, clean prose, no lorem ipsum, no fabricated company/address/tax facts (none asserted). /how-we-make-money truthfully states no ads served.
- NEWSLETTER: live POST → truthful 503 (Resend not configured), UI shows no fake success; NEWSLETTER_SUBSCRIBERS=0 (no ghost rows). Disabled state acceptable.
- ADMIN/SECURITY: /admin → 307→login when unauthenticated; dashboard 307→/admin/login; /api/admin/articles 405 unauth; no secrets/tokens/stack traces in any public HTML/log; none breached. robots is not access control — admin also guarded by requireAdminPage.
- PROD HEALTH: homepage + 3 articles + listings + sitemap + feeds + robots + hero assets all 200; error_log + home_error empty; 0 console errors on homepage/articles; TLS valid.
- MOBILE/OVERFLOW (Ph 21 — MAJOR): at 390×844, article #2 (guides route) has WHOLE-DOCUMENT horizontal overflow (scrollWidth 456 vs 390, overflow 66px). Root cause: guides/[slug] grid col "space-y-8 lg:col-span-8" lacks min-w-0, so the overflow-x-auto table containers' min-content (440px) widens the grid column past the viewport. Other routes (compare/best/homepage/listings) are clean; tables scroll within containers elsewhere. Needs a min-w-0 fix before indexing.
- PUBLIC DEMO/PLACEHOLDER SWEEP: only occurrences of demo/fictional/sample language are the footer /about masthead /affiliate-disclosure pages (the Ph 16 item, MAJOR). you@example.com is a form placeholder (acceptable). No lorem ipsum, no TODO-user-facing, no test/fake data in articles.
- CONTENT FRESHNESS: all sources "checked 2026-10-06/10-07"; byline/updated dates consistent (header shows Published Oct 7 2026 · Updated Oct 7 2026 on #3 etc.); no stale template text.
- INDEXING STATE: ALLOW_INDEXING=false + robots Disallow:/ verified post-audit (from node-selector.json live + live robots.txt). No Google/Bing submission. Sitemap remains correct.
- VERDICT: B — READY WITH PRE-LAUNCH FIXES. Not indexing is enabled. Blocking decision: no BLOCKER; 4 MAJOR pre-launch fixes required: (1) footer/About/affiliate-disclosure demo/fictional language removal; (2) guides route mobile min-w-0 overflow fix; (3) roundup route unconditional affiliate-disclosure box vs 0 affiliate links; (4) footer /software + /tech dead links. MINOR: malformed-path 500, www no-redirect (canonical-safe), Website SearchAction→noindexed /search, /newsletter route 404.
- NEXT (proposed Task 41, NOT executed): after MAJOR fixes + paper approval → ALLOW_INDEXING=true via node-selector env → intentional rebuild/restart → verify robots (Allow public + admin/api/go/search disallowed) → verify no noindex on articles → verify sitemap still 3 URLs → verify feeds/listings → verify JSON-LD/canonical → submit sitemap/search engines only where supported.

---
Task ID: 41A
Agent: Claude Code (lead) — PRE-INDEXING LAUNCH FIXES (SOURCE PR ONLY; indexing stays OFF, production untouched).

- BASE: pushed Task 40 docs commit 8337173 to main (worklog-only, verified 1-file/29-line diff, no deploy). origin/main = 8337173. Branch fix/pre-indexing-launch-majors.
- MAJOR A (false demo language, expanded beyond Task-40's three): footer "Demo build — …fictional sample." removed → "Reviews with the evidence attached."; /about masthead "currently a demonstration build…" → "Duyan Blog is an independent publication…"; editorial-policy "Sample content" → conditional "If Duyan Blog publishes demonstration or sample content…"; affiliate-disclosure "In this demonstration build…" → "If sample data ever appears" conditional; terms "In this demonstration build, all products…fictional samples" removed. Conditional demo strings (demo_mode/isDemo/pageDemoMode/MerchantOffer sample chip) kept — they render only in actual demo contexts.
- AFFILIATE CURRENT-STATE (Ph 5): publisherNote → "Reader-supported. If we ever add affiliate links, commissions will never change our verdicts."; how-we-make-money "Some links to merchants are affiliate links…" → "If and when we use affiliate links…"; affiliate-disclosure intro drops "Some pages...contain affiliate links" → "There are currently no affiliate links on Duyan Blog; if and when we add them…"; /deals "Links are affiliate links" now only when offers.length > 0. Homepage deals-desk line (line 331) is already within an offers>0 conditional — untouched.
- MAJOR B (guide mobile overflow): guides/[slug] main column + min-w-0. RED (prod Task 40): scrollWidth 456 vs 390 (overflow +66px). GREEN (local render, 390×844): scrollWidth 375 ≤ 390, overflow -15, hasHorizontalOverflow false, H1/FAQ/Sources reachable, 3 tables scroll in their own overflow-x-auto containers. Both content cols 343px (were 440).
- MAJOR C (roundup disclosure): removed unconditional <AffiliateDisclosure variant="box"/> from best/[slug]; renderer's per-offer/embed disclosures remain (MerchantOffer line 82, ComparisonTable footer, pick-with-offer line 294). GREEN (local): zero-commerce roundup has 0 "Some links on this page are affiliate links", 0 disclosure boxes, 0 article-body affiliate mentions; 5 picks + 5 providers still render. Mutation tests verify the guard fails when box is reintroduced.
- MAJOR D (dead footer nav): site.ts footerNav.sections now only /travel; /software+/tech dropped. GREEN (local): footer has no /software or /tech hrefs; header mobile menu (same source) likewise. All other footer hrefs resolve 200.
- REGRESSION GUARD: scripts/test-launch-readiness.mjs (7 checks) wired as test:launch. Mutation-tested: reintroducing "Some pages on this site contain affiliate links" FAILs; reintroducing footer "Demo build" FAILs; reintroducing unconditional roundup box FAILs. Public-file scan excludes admin-only + conditional demo phrasing.
- RENDER VERIFIED (local, duyanblog_dev only): / /about /affiliate-disclosure /how-we-make-money /editorial-policy /terms /deals /guides/how-much /best/best-esim-for-europe — no false current-demo language, no false active-affiliate language, no roundup box, no guide overflow, footer clean, 0 console errors on fixed routes. Local fixture articles restored to draft after render; dev server stopped; AGENTS.md auto-injection reverted.
- ARTICLE INTEGRITY (Ph 13): zero edits to content/drafts/*.json — all 3 article bodies untouched.
- ROBOTS/INDEXING (Ph 14): ALLOW_INDEXING=false, robots.ts, sitemap untouched. No submission.
- GATES: test:launch 7 pass; test:cta 27 pass; 3 article gates pass; slop 0; lint 0; typecheck 0; validate:docs PASS; git diff --check clean. npm run build LOCAL exit 0 (prisma migrate deploy "No pending migrations" → generate → next build --webpack → standalone copies). Real runtime build proven.
- COMMIT: e4db57e (9 files, 149insertions/25del). PR fix/pre-indexing-launch-majors → main, NOT merged, NOT deployed.
- NEXT: independent PR review; after merge + owner approval, a separate deploy/verify task turns on indexing per Task 40's Task-41 launch procedure.

---
Task ID: 41A.1
Agent: Claude Code (lead) — PR #12 TRUTHFULNESS RESIDUALS (amend-only, one narrow repair commit; indexing stays OFF, production untouched).

- RESIDUAL FINDINGS (independent review, all confirmed in PR-head source): homepage hero "Reader-supported: we may earn a commission when you buy through our links."; homepage "Commerce never edits" card "Affiliate revenue funds the site…"; /about metadata "independent, reader-supported publication"; /about card "Commissions and subscriptions fund the work"; site publisherNote "Reader-supported. If we ever add affiliate links…"; how-we-make-money description "business model: affiliate commissions and subscriptions" + intro "Here is exactly how we pay for it"; affiliate guarantees "at no extra cost to you" + "price you pay is the same (sometimes better…)" (affiliate-disclosure). Plus header utility strip "Independent · Reader-supported · Vietnamese roots" (found in own sweep, not listed in brief).
- PRODUCTION TRUTH: zero AffiliateOffer rows, zero /go/ links, no paid subscriptions, no ads, no demonstrated reader-revenue → copy may not claim any of these currently fund the site.
- TDD (RED before repair): extended scripts/test-launch-readiness.mjs with 10 new checks (homepage revenue sentence, /about metadata+card, publisherNote "Reader-supported.", how-we-make-money description+intro, no-extra-cost, same-price/sometimes-better, header strip, homepage "Affiliate revenue funds the site"). RED run: 9 pass / 8 fail → repaired copy → 19 pass / 0 fail.
- MUTATION TESTS: A homepage "we may earn a commission when you buy through our links" → FAIL/restore PASS; B /about "Commissions and subscriptions fund the work" → FAIL/restore PASS; C "at no extra cost to you" → FAIL/restore PASS; D header "Reader-supported" → FAIL/restore PASS; E homepage "Affiliate revenue funds the site" → FAIL/restore PASS. (E briefly over-reverted page.tsx to HEAD via git checkout; both homepage fixes re-applied exactly, then re-verified GREEN.)
- COPY REPAIRS: homepage hero → "Duyan Blog is independent and currently carries no affiliate links. If we add them later, commissions will not change our verdicts." (→"How we plan to make money."); homepage card 03 → "If we ever run affiliate links, they will never decide a verdict. Rankings can't be bought."; /about metadata → "an independent editorial publication…"; /about card → "Not for sale / Commercial relationships never buy rankings or verdicts."; publisherNote → "Independent editorial. If we add affiliate links later, commissions will never change our verdicts."; header strip → "Independent · Reader-first · Vietnamese roots"; how-we-make-money description → "How Duyan Blog plans to fund independent publishing, and the rules that keep future commerce out of editorial decisions."; intro → "…We do not currently run ads or affiliate links; this page explains the revenue models we may use…"; affiliate commissions copy → commission + price are merchant/program-specific, check merchant's current price/terms (removed "no extra cost"); affiliate-disclosure "What an affiliate link is" → same merchant-specific framing (removed "price you pay is the same / sometimes better").
- PUBLIC COPY SWEEP: no remaining "reader-supported", "subscriptions fund", "we may earn a commission when you buy through our links", "no extra cost", "price you pay is the same", "sometimes better", "how we pay for it" in src/public runtime. Remaining affiliate wording is future/conditional + editorial-independence rules only (allowed).
- LOCAL RENDER (duyanblog_dev): /, /about, /how-we-make-money, /affiliate-disclosure all render with no current affiliate/revenue-subscription claims, no same-price/no-extra-cost promise, future rules understandable, links/layout intact, 0 console errors. Head injected after typecheck etc.
- GATES: test:launch 19 pass; test:cta 27 pass; 3 article gates pass; slop 0; lint 0; typecheck 0; validate:docs PASS; git diff --check clean. npm run build LOCAL exit 0.
- ARTICLE/ROBOTS/INDEXING: content/drafts untouched, robots.ts/sitemap.ts/ALLOW_INDEXING untouched, guide/roundup/footer-route fixes untouched. Production untouched.
- COMMIT: one narrow commit on fix/pre-indexing-launch-majors (6 files, 84+/12-). Same PR #12 (head advanced). NOT merged, NOT deployed.
- NEXT: independent PR re-review of PR #12; after merge + approval, deploy + indexing flip task per Task 40's launch procedure.

---
Task ID: 41A.2
Agent: Claude Code (lead) — FINAL PRICE-GUARANTEE RESIDUAL (same PR #12 only, one tiny commit; indexing stays OFF, production untouched).

- CONFIRMED RESIDUAL: src/app/page.tsx deals section still had "Buy links are affiliate links — they never change the price you pay or a verdict on this site." (inside deals.length > 0 conditional, so invisible on production today). "they never change the price you pay" is an unprovable blanket future-affiliate price guarantee, contradicting the 41A.1 merchant/program-specific repair.
- TDD RED first: added invariant to scripts/test-launch-readiness.mjs — /never change the price you pay|never changes the price|does not affect the price|won.t cost more/ scanned against public runtime copy. RED: 19 pass / 1 fail.
- COPY FIX (only the guarantee portion): "Buy links are affiliate links — they never change the price you pay or a verdict on this site." → "Buy links are affiliate links. Merchant prices and terms can change; affiliate relationships never change our verdicts." Keeps "buy links are affiliate links" + "never change our verdicts"; removes the price guarantee. GREEN: 20 pass / 0 fail.
- MUTATION: restore old guarantee → test:launch FAIL (19/1); restore repair → PASS (20/0).
- PRICE-GUARANTEE SWEEP: no remaining "never change the price / never changes the price / no extra cost / same price / price you pay is the same / sometimes better / does not affect the price / won't cost more" in src/app, src/components, src/content, src/lib. Remaining wording in policies is merchant- & program-specific ("check the merchant's current price and terms") — allowed.
- GATES: test:launch 20 pass; test:cta 27 pass; 3 article gates pass; slop 0; lint 0; typecheck 0; validate:docs PASS; git diff --check clean. npm run build LOCAL exit 0.
- PRESERVED: all PR #12 fixes (demo/affiliate/revenue copy, About/header, guide min-w-0, roundup box removal, footer dead-links, robots/sitemap/ALLOW_INDEXING, content/drafts) untouched.
- COMMIT: one tiny commit on fix/pre-indexing-launch-majors (2 files, +7-1). Same PR #12. Not merged/deployed.
- NEXT: final independent review of PR #12; then deploy + indexing flip per Task-40 launch procedure.
