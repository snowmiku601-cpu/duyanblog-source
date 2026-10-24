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

## Secret-safe diagnostics and MySQL credential rotation

**Trigger:** any DB credential, Node Selector env, MCP token or production authentication
work. Task 51 incident: a diagnostic printed the complete `DATABASE_URL` once.
Treat this as an exposure even if observed only in a local terminal.

1. **Never output secrets.** No full connection strings, env dumps, credential objects,
   Authorization headers, secret files or debug traces in stdout/stderr, CLI/MCP results,
   tool arguments, shell history, logs, prompts, commits, patches, screenshots or worklogs.
   Do not use `printenv`, `env`, `grep DATABASE_URL`, `cat` on secret files or `set -x`.
   Return only sanitized booleans/status (present, valid, health pass/fail).
2. **Trusted processing boundary.** Generate/read secrets only inside owner-controlled
   protected processes or provider secret UI. Protected temporary storage must be outside
   the repo and web root (directory 0700, file 0600). Explicitly suppress/redact script
   output on BOTH success and failure. If an API/MCP call or tooling path would expose a
   secret in its arguments or response, STOP and request owner-side credential entry.
3. **Read-only preflight.** Confirm MySQL account/host/grants (without secret values),
   application env *presence*, Node Selector status, DB and site health, no pending schema
   migrations and a tested rollback route. Do not back up unredacted credentials into
   repository, chat or insecure artifacts. Preserve existing app data and runtime settings.
4. **Preferred overlap rotation.** Create a distinct MySQL application user with only
   the privileges required on the same database and permitted host; do not grant global
   or administrator privileges. Generate a cryptographically random strong password
   inside the trusted host/provider (never echo or pass it through tool arguments). Test
   the new login inside the protected process, reporting only pass/fail. Build the
   correctly encoded `DATABASE_URL` there and update the Spaceship Node Selector setting
   without revealing it. Restart using the proven workflow; verify Prisma, homepage,
   About/Contact, and all three existing published articles.
5. **Revoke after cutover.** Keep the old MySQL account valid until the new connection
   has been verified on the live application. Then remove its access and temporary
   credential copies. If the cutover fails, restore the previous *working* configuration
   through the protected process, restart and verify recovery. If a second DB user cannot
   be provisioned safely, STOP and request an owner-approved coordinated in-place rotation;
   never change one side of the credential pair alone.
6. **Report the incident without the credential.** Contain access to any terminal/log
   capture that already holds it, rotate promptly, and report only status, affected scope
   and any remaining risk. Do not claim external exposure was impossible without evidence.

No schema/seed/reset/db-push changes, unrelated service credentials, indexing, GA4,
Google Ads or publishing changes are authorized by a credential-rotation task.
