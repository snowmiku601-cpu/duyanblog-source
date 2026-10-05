# ARCHITECTURE.md — duyanblog.com

Factual map of how the app works. Every claim below points at code that implements it.

## 1. Request lifecycle

```
Request
  → src/app/layout.tsx        (root layout, one for the whole site)
      fonts (next/font), ThemeProvider, skip-link, <SiteHeader/>, <main/>, <SiteFooter/>,
      <ConsentManager/>, <Toaster/>
  → route (public tree, no route groups — all under src/app/)
      static pages: page.tsx, /reviews, /best, /compare, /guides, /articles, /deals,
                    /[category] (software/travel/tech), /authors, /about, /contact,
                    /methodology (+ [entry]), 8 policy pages, /search
      article routes: /reviews/[slug] /best/[slug] /compare/[slug] /guides/[slug] /articles/[slug]
      API: /api/newsletter, /api/contact (POST), /go/[offerId] (GET 302), /feed.xml (GET)
      metadata: sitemap.ts, robots.ts, not-found.tsx, error.tsx
```

- The header (`src/components/site-header.tsx`) is a client component (active-link tracking, mobile Sheet, theme toggle); the footer (`src/components/site-footer.tsx`) is a server component.
- There is no middleware.ts. There are no route groups; `/admin` does not exist yet.
- Sticky footer comes from `layout.tsx`: `body` is `min-h-screen flex flex-col`, `main` is `flex-1`, footer uses `mt-auto`. Do not break this — see DESIGN.md §"do not change casually".

## 2. Data flow and caching model

- All reads go through **server components** calling Prisma directly (`src/lib/db.ts` singleton) or the shared fetchers in `src/lib/queries.ts`. There is no client-side data layer for public pages.
- Public pages are **static with ISR**: every public route exports `export const revalidate` — 300 for home/lists/articles/authors, 120 for `/deals`, 600 for `/about` and `/methodology`, 900 for `/feed.xml`, 3600 for `sitemap.ts`. Nothing public is per-request dynamic except `/search` (query-param driven) and `/go/[offerId]` (`force-dynamic`).
- **Admin mutations are required to call `revalidatePath()`** on affected routes (and `invalidateSettingsCache()` from `src/lib/settings.ts` when `SiteSetting` rows change). This is the contract the admin (not yet built) must follow; if it doesn't, edits won't appear until the revalidate window elapses.
- The `search` page is `noIndex: true` and reads `searchParams`, so it renders per request.
- `getPublishedArticleBySlug` (`src/lib/queries.ts`) is the single loader for article detail pages; it eagerly includes category, author, reviewer, scores, sources, active offers with merchants, comparison with items, and tags.
- **Scheduled publishing**: every public article surface (all shared fetchers, home roundup, search, tag pages, author profiles, both feeds, the sitemap) composes its `where` with `liveDateGuard()` — `status: "published"` AND (`publishedAt` is null OR `publishedAt <= now`). A future-dated published story is hidden everywhere until its moment, then appears within one ISR cycle (≤ revalidate seconds). Legacy safety: a published row with null `publishedAt` stays visible. Admin surfaces deliberately bypass the guard and show an amber "Scheduled" badge (`isScheduled()` in status-badge.tsx) plus a Scheduled filter on the articles list.

## 3. Content pipeline (blocks)

```
Article.blocks (TEXT, JSON string)
  → parseBlocks()  in src/lib/content-schema.ts
      JSON.parse → blocksSchema (Zod discriminated union of 15 block types, max 300)
      whole-array parse fails → each item validated individually; invalid blocks DROPPED,
      never fatal (a bad block cannot take down a page)
  → ArticleRenderer (src/components/editorial/article-renderer.tsx, async server component)
      renders each block type; embed blocks (offerEmbed, comparisonEmbed, pick with offerId)
      re-query the database by id/slug at render time
```

- The admin editor must persist through `serializeBlocks()` (throws on invalid) so only valid JSON is written.
- Inline text inside blocks supports a tiny syntax parsed by `src/components/editorial/inline-text.tsx` — never `dangerouslySetInnerHTML`. See EDITORIAL_GUIDE.md for the grammar.
- JSON-in-String columns exist because they carry editorial block JSON: `Article.blocks`, `Author.focusAreas`, `ComparisonItem.attributes/pros/cons`. All are validated at the boundary with Zod.

## 4. Comparison engine flow

```
Comparison + ComparisonItem rows (attributes/pros/cons as JSON strings)
  → server mapping (src/app/compare/[slug]/page.tsx mapItems() or
    article-renderer getComparisonItems()) via src/lib/comparison.ts:
      parseAttributes() / parseStringList()   — Zod-validated JSON, [] on failure
      comparisonItemViewSchema.safeParse(...) — malformed items dropped individually
  → <ComparisonTable> (src/components/comparison-table.tsx, client):
      attributeRows()  — union of attribute labels, order-preserving = table rows
      sortableAttributes() — labels where at least one item has numeric value
      winnerFor()      — for a row: filter items with numeric, respect direction "high"/"low"
                         (default high), mark the single unique best; ties → no winner
      client sort state re-orders columns; winner dots only shown in editors' order
      mobile: stacked cards (dl per item), never a squashed table
```

- A `Comparison` row can attach to a versus article (`Comparison.articleId`, unique) — the `/compare/[slug]` page then renders the table above the body ("auto-table"). Any article can also embed any comparison via a `comparisonEmbed` block using `comparisonSlug` (e.g. the roundup/review pages; the versus seed article links `cloudpeak-vs-harborstack-table`).

## 5. Auth flow (admin; plumbing complete, UI pending)

Implemented in `src/lib/auth.ts` (`import "server-only"`):

| Concern | Mechanism |
| --- | --- |
| Passwords | scrypt (Node crypto), 16-byte random hex salt, 64-byte key, NFKC-normalised, stored `scrypt$salt$hex` |
| Sessions | 32 random bytes base64url in cookie `dy_admin_session`; DB stores only `sha256(token)`; 7-day TTL |
| Cookie flags | HttpOnly, SameSite=Lax, Secure when `NODE_ENV=production`, path `/` |
| Page guard | `requireAdminPage()` → redirects to `/admin/login` |
| API guard | `requireAdminApi()` → returns `{response}` with 401 for route handlers |
| CSRF | `isSameOrigin(request)`: Origin header must match Host when present; combined with SameSite=Lax |
| Rate limit | login endpoints should use `rateLimit()` (`src/lib/rate-limit.ts`, fixed-window in-memory); newsletter/contact already do at 5/min/IP |
| Bootstrap | `scripts/admin-bootstrap.ts` (see README); refuses production without `ALLOW_ADMIN_BOOTSTRAP=true`; refuses a second admin without `--force` |

The admin UI itself does not exist yet — `/admin` currently 404s (smoke.mjs already expects a 307 to `/admin/login`).

## 6. Consent architecture

`src/lib/consent.ts` (client module) + `src/components/consent/consent-manager.tsx`:

- Three categories: `necessary` (always true), `analytics`, `advertising`. State persisted in `localStorage["dy-consent-v1"]`.
- Events: `dy:consent` (CustomEvent with the new state) and `dy:consent-open` (open settings dialog; used by the footer "Cookie settings" button). `onConsentChange()` subscribes.
- **AdSlot double gate** (`src/components/affiliate/ad-slot.tsx`): renders nothing unless (1) the server-passed `enabled` prop is true — driven by the `ads_enabled` `SiteSetting` via `isAdsEnabled()` in `src/lib/settings.ts` — AND (2) `loadConsent()?.advertising === true`. A real network's script goes inside this component only.
- **Analytics adapter is a no-op** until a provider exists: `trackEvent()` returns early without analytics consent, and even with consent only calls `window.__dyAnalytics` — which nothing defines yet. `NEXT_PUBLIC_ANALYTICS_PROVIDER` is reserved in `.env.example` and unused in code.
- **Affiliate navigation never depends on consent** — plain `<a href="/go/…">` anchors (see AFFILIATE_INTEGRATION.md).
- The banner renders nothing before mount and hides once a decision exists. This homemade layer is replaceable by a real CMP as long as the storage key/events contract is kept or mapped.

## 7. Settings cache

`src/lib/settings.ts`: all `SiteSetting` rows cached in a module-level variable for 30 s; `invalidateSettingsCache()` clears it. Admin settings writes must call it (and `revalidatePath`) or stale values persist up to 30 s per server process. Seeded settings: `ads_enabled=false`, `demo_mode=true`.

## 8. Redirect model

- The `Redirect` model (`from` unique, `to`, `statusCode` default 302, `active`) stores path→path redirects. The seed ships one sample: `/old-esim-guide` → `/best/best-esim-providers`.
- **Served at runtime by `src/proxy.ts`** (Next 16's successor to middleware, Node runtime):
  - Matcher excludes `_next`, `/api`, `/go`, `/admin`, feed/sitemap/robots, and any path containing a dot (files).
  - GET/HEAD only; every lookup is cached in memory with a 30 s TTL (positive **and** negative), max 1000 entries.
  - Chains resolve up to 3 hops server-side — the visitor makes a single hop, using the first hop's status code; loops fall through to the normal 404.
  - Relative targets get the visitor's query string appended (UTM preservation) unless the target has its own.
  - Absolute `https://` targets are supported (admin validation allows them).
  - All failures (DB hiccup, bad data) fall through to normal routing — the proxy never breaks a request.
  - Admin changes take effect within 30 s without a deploy or restart.
  - The admin redirects form validates chains client-side while you type: duplicates and self-loops are blocked outright; a resulting chain longer than 3 hops is blocked (the runtime would 404 it), 2–3 hops get an amber warning with the full path preview; the table also badges rows that chain (`×2`, `×3`, `loop`).
- `/go/` is disallowed in `robots.txt` so the redirect layer stays out of search indexes (see `src/app/robots.ts`).

## 9. Newsletter double opt-in

Flow (implemented 2026-09, migration `newsletter_double_opt_in`):

1. `POST /api/newsletter` (rate-limited, same-origin, honeypot) creates the subscriber as `confirmed: false` with a `confirmToken` (24 random bytes, unique) + `confirmExpiresAt` (48 h). Re-subscribing a pending/expired address refreshes the token; re-subscribing a confirmed address is a no-op besides refreshing `source` (it answers `alreadyConfirmed: true`). Existing unsubscribe tokens are never rotated.
2. The confirmation link is `/newsletter/confirm?token=…`. The page is `force-dynamic`, validates token + expiry, flips `confirmed: true` and **burns the token** (set to null) so a link can't be replayed; states: done / already / expired / invalid / missing, all rendered as one editorial page with `noindex`.
3. **Email transport (`src/lib/email.ts`, added 2026-09).** `sendMail()` picks the provider: `RESEND_API_KEY` set → a plain `fetch` POST to Resend's HTTP API (no SDK dependency, `EMAIL_FROM` configurable); no key + non-production → a **console transport** that logs the full message and reports `delivered: false`; no key + production → mail is disabled with a loud warning (return `{delivered:false, provider:"none"}`). The subscribe route now calls `sendMail(newsletterConfirmEmail(confirmUrl))` right after token creation — a real provider means a real email and **the confirm URL is never echoed in any environment**; the dev-shortcut `confirmUrl` in the JSON body only appears when the console transport was used (nothing was actually emailed) and only outside production. Templates live in `newsletterConfirmEmail` (branded plain-text + minimal inline-CSS HTML). No queue/retry — a Resend outage surfaces in the response (`emailed: false`) and the admin's "copy confirmation link" action stays the stopgap.
4. The admin list and dashboard treat `confirmed: false` as pending (amber tint + "awaiting opt-in" micro-label; dashboard counts only confirmed subscribers, with a pending hint).
5. **Admin actions (added 2026-09).** Pending rows on `/admin/subscribers` gained a **re-send** action (`POST /api/admin/subscribers/[id]/resend`): it rotates the confirm token (any previously copied link dies immediately — the row is patched with the fresh token in the UI), re-emails the branded confirmation, and — only on the dev console transport — returns the `confirmUrl` (the client also copies it, mirroring the signup route's policy). The Settings page gained an **Email transport** card showing which provider `sendMail()` would use right now (derived from env, mirroring its priority) with a **Send test email** probe (`POST /api/admin/email/test`) that delivers to the signed-in admin via the exact same path as confirmations; the console transport counts as success-with-`delivered:false` (the message is in the server log), a real failure is a 502.

## 9b. Media library & uploads

- `listPublicImages()` (`src/lib/media.ts`) walks `public/images` and returns `/images/…` web paths. It feeds the shared **MediaField** (`src/components/admin/media-field.tsx`) used by both the article hero and every comparison-item image: datalist type-ahead, a live status line (in library / not in library / remote warning / load failure), a thumbnail browser dialog with an "In use" marker, a live preview of the typed path, and **drag-and-drop / pick-to-upload** (files POST to `/api/admin/media`; the returned path is auto-selected and the grid gains a "New"-chipped tile for the session). Purely advisory — the APIs still accept any root-relative path.
- `POST /api/admin/media` (admin-guarded, same-origin): one `file` field + optional single-segment `folder` (`^[a-z0-9][a-z0-9-]{0,40}$`, no traversal). Validation is layered: extension whitelist → byte-signature sniff (PNG/JPEG/WebP/AVIF magic numbers, with the reported MIME as fallback) — the exact JPEG-named-`.png` class of file that breaks Next's image optimizer with 400s is refused at the door → 5 MB cap → slugified filename with `-2`/`-3` collision suffixes (uploads never overwrite). **Raster-only by design: SVG is rejected** (a same-origin `image/svg+xml` with no CSP/nosniff on the edge is a stored-XSS vector) **and GIF is rejected** (no demonstrated need). Logos/`favicon.svg` remain code-owned in `public/logo/` — only CMS page-media uploads are restricted.
- `DELETE /api/admin/media?path=/images/…` (admin-guarded): removes an **unused** upload. Path validation is lexical (must start `/images/`, resolves inside `public/images` after `normalize`) and a server-side usage re-check (`src/lib/media-usage.ts` → exact-path match over Article.heroImage + image/pick blocks, Category.heroImage, ComparisonItem.imageUrl) refuses in-use files with 409 + the referencing rows, so a stale client can never orphan a page's image. The rules live in the shared `src/lib/media-delete.ts`.
- `POST /api/admin/media/bulk-delete` (admin-guarded): `{ paths: [≤100] }` — powers the media page's **Delete unused (N)** affordance. Every path passes the same two gates as the single DELETE against one usage snapshot; outcomes are per-path (`deleted` / `skipped` + reason), so a file that gained a reference since page-load is skipped, not fatal.
- **Dimensions manifest** (`public/images/.media-manifest.json`, written at upload + `npm run media:manifest` backfill): sharp records width/height per file; the media page shows a "1920 × 1080" chip and deletes clean up their entries. A dotfile, so the image walk never lists it; missing entries are harmless.
- **Media library management page** (`/admin/media`, nav "Media"): every file with thumbnail, dimensions, size, modified date, "In use / Unused" state, usage chips linking to the referencing admin pages (max 2 + overflow), upload dropzone, search, usage filters, sort (name/newest/largest), copy-path, confirm-dialog delete that surfaces 409 refs, bulk delete of unused files, and an amber storage note when the on-disk total passes 80 MB. Header line reports file count, on-disk total, used/unused split.
- Uploaded files land in `<cwd>/public/images` of the running process.

## 10. Known trade-offs (and the production upgrade path)

| Trade-off | Why it's OK today | Production upgrade |
| --- | --- | --- |
| MySQL (`DATABASE_URL`) | Production target (Hostinger Business Node.js app). Single-node editorial site; INTEGER/AUTOINCREMENT semantics are MySQL-native | Migrations are MySQL-canonical (one baseline). Schema is the same 20 models; JSON-in-String columns are `@db.LongText`/`@db.Text`; optionally convert to native JSON later. See HOSTINGER_DEPLOYMENT.md |
| JSON stored in String columns (`Article.blocks`, `ComparisonItem.attributes/pros/cons`, `Author.focusAreas`) | Zod validation at every boundary; DB-agnostic | Keep as-is (portable), or migrate to Postgres `jsonb` + Prisma `Json` columns; keep the Zod schemas regardless |
| DB-side article search (`src/lib/queries.ts` → `searchArticles`) filters title/deck/tags via case-insensitive `contains` + `orderBy publishedAt desc`, hard `LIMIT 30` | Editorial scale (hundreds of articles); no silent latest-100 ceiling | MySQL FULLTEXT index (or external search) for relevance ranking + typo tolerance at larger corpus; `searchArticles` is the only file to change |
| In-memory fixed-window rate limiter (`src/lib/rate-limit.ts`) | Correct for one Node process | Redis (or any shared KV) keyed by `clientIp()`, same return shape `{ok, remaining, retryAfterSeconds}` |
| In-memory settings cache (30 s TTL) | Cheap; single process | Fine as-is; on multi-process deployments each process holds its own cache — rely on `invalidateSettingsCache` + short TTL |
| Chain rules enforced on both sides (`src/lib/redirect-chain.ts` is shared) | Client shows live feedback while typing; `POST /api/admin/redirects` re-runs `analyzeChain` over the active rows and rejects duplicates, self-loops and >MAX_HOPS chains with 400; the runtime visited-set remains the final gate | Nothing required; if editors ever bypass the API, the proxy still can't loop (visited-set + hop cap) |
| Consent stored in localStorage only | Server can't read it; `/go` accepts an explicit `c=1` hint param | Real CMP or a consent cookie if server-side personalisation is ever needed |
| Media uploads write to the local filesystem | Persists on a single VPS (Hostinger's non-containerised Node); admin-only endpoint | Object storage (S3/R2) + CDN for rebuild-proof media; swap the internals of `/api/admin/media`, keep the byte-sniff validation |
