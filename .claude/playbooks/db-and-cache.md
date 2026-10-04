<!-- PLAYBOOK — not auto-loaded; read on demand per .claude/playbooks/README.md -->
# DB & cache — Prisma, migrations, ISR

Read before touching `prisma/schema.prisma`, migrations, seeds, `src/lib/queries.ts`,
`src/lib/settings.ts` caches, or any revalidate decision.

## Schema facts

- 20 models (`User, Session, Author, Category, Article, ArticleRevision, Tag, ArticleTag,
  Merchant, AffiliateOffer, AffiliateClick, Comparison, ComparisonItem, ReviewScore,
  SourceCitation, MethodologyEntry, NewsletterSubscriber, ContactMessage, Redirect, SiteSetting`).
- **MySQL-canonical** (production target: Hostinger Business Node.js web app). Migrations are
  plain MySQL SQL; one baseline (`20261004000000_init`) + follow-ups. The app connects to
  `127.0.0.1:3306` (platform rule); local tooling uses the remote host `srvNNNN.hstgr.io` over
  a temporary remote rule. Long content columns are `@db.LongText`/`@db.Text` (bare `String`
  maps to `VARCHAR(191)` — truncates silently in MySQL non-strict mode; `validate-docs`
  Check 6b gates every long-content column).
- **JSON-in-String columns** (`Article.blocks`, `ComparisonItem.attributes/pros/cons`,
  `Author.focusAreas`) are TEXT validated by Zod at every boundary. Never change them to native
  JSON without checking every `JSON.parse`/`stringify` call site; keep the Zod schemas regardless.
- `liveDateGuard()` in `src/lib/queries.ts`: published AND (publishedAt null OR ≤ now), composed
  into **every** public surface (fetchers, home, search, tags, authors, feeds, sitemap). Admin
  bypasses it by design (`isScheduled()` badge). Keep the guard composed everywhere public.

## Migration workflow

- Dev: `npm run db:push` only for throwaway prototyping; real schema changes get a migration
  (`npx prisma migrate dev --name <slug>`), reviewed before commit.
- Prod: `npm run db:migrate` (`prisma migrate deploy`) — never `db push` in production.
  **Migrate BEFORE every host build** (`next build` prerenders pages and queries the DB).
- Destructive data work (`db:reset`, `seed:demo`) is a wipe: MySQL backup first (platform DB
  tools or `mysqldump` via the remote host), never rely on the app directory (the build
  overwrites it).

## ISR / cache contract

- Public pages are static + ISR: 300 home/lists/articles/authors, 120 `/deals`, 600 about/
  methodology, 900 feeds, 3600 sitemap. `/search` and `/go/[offerId]` are dynamic by design.
- **Admin mutations MUST call `revalidatePath()`** on affected routes
  (`src/lib/admin-revalidate.ts`: `revalidateForArticle`, `revalidateLists`, etc.) and
  `invalidateSettingsCache()` when `SiteSetting` rows change (30 s module cache).
- The `Redirect` proxy (`src/proxy.ts`, Next 16 proxy, Node runtime) caches lookups 30 s TTL,
  negative included, max 1000 entries; chains ≤3 hops; never breaks a request on DB hiccup —
  keep the try/catch fall-through.

## Media

- Uploads land in `<cwd>/public/images`; `public/images/.media-manifest.json` records
  dimensions (dotfile, never listed by the image walk). Delete endpoints re-check usage
  server-side (`src/lib/media-usage.ts`, `src/lib/media-delete.ts`) — a stale client can never
  orphan a page's image.
- Next's image optimizer rejects extension/MIME mismatches with 400s: uploads are byte-sniffed
  at the door. Re-encoding an existing file changes bytes, not the path — no DB references move.