<!-- PLAYBOOK — not auto-loaded; read on demand per .claude/playbooks/README.md -->

# Deploy duyanblog to Hostinger Business (Node.js web app)

**Verified 2026-10-04 (original), simplified 2026-10-05.** This playbook is the real
procedure that runs `duyanblog-test.hostingersite.com` on the client's Hostinger Business
plan (order `1009151112`, account `u257278613`). The simple model: **the Hostinger build
runs migrations itself** using the DB credentials already in its environment — routine
deploys no longer need the plaintext DB password locally, a remote MySQL rule, or a
manual `prisma migrate deploy`.

## The setup that now exists

| Thing | Value |
|---|---|
| Website | `duyanblog-test.hostingersite.com` (addon on order 1009151112) |
| DB | `u257278613_duyanblog` on `srv2123.hstgr.io:3306` (MySQL, app host `127.0.0.1`) |
| App env | `NODE_ENV=production`, `NEXT_PUBLIC_SITE_URL=https://duyanblog-test.hostingersite.com`, `DATABASE_URL` + `DB_*` (127.0.0.1), **no `ALLOW_*`**, **no `MEDIA_PERSISTENT`**, **no `TRUST_PROXY`** |
| Build | archive deploy (`hosting_deploy-js-application`), node 20 (host auto), npm, `npm run build` |
| Build script | `prisma migrate deploy && prisma generate && next build --webpack && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/` |
| Source deploy | `git archive --format=zip --output=duyanblog-source.zip HEAD` → upload → deploy |
| Admin | `editor@duyanblog.test` (temporary; replace before real go-live) |

## The simple model (normal deploys)

1. **Approved `main`** is the only source — archive exactly the merge commit.
2. **Create an exact archive** of that commit.
3. **Archive-deploy** to the existing Hostinger Node app; the platform runs `npm run build`
   using its existing environment (including `DATABASE_URL`).
4. **The build performs migrations first**: `prisma migrate deploy` runs before the Next
   build, so `next build`'s database-backed prerender always sees the current schema.
5. Deploy completes; verify with smoke against the staging origin.

Routine deploys require **no plaintext DB password locally, no remote MySQL rule, no
local `prisma migrate deploy`, no exported `DATABASE_URL`**. The DB secrets stay inside
the Hostinger environment and are consumed by the Hostinger build/runtime.

## Non-negotiables (each one cost a failed build or would have)

1. **Migration is idempotent and runs in the build.** `prisma migrate deploy` is safe to
   run on every build — it applies only missing migrations in order and never touches
   applied ones. *No* seed, *no* `db push`, *no* `migrate reset` anywhere in the build.
2. **Migrate BEFORE the Next build — always.** `next build` prerenders the `revalidate=N`
   pages and queries the DB; an unmigrated DB fails the build (P0001). The build script
   ordering guarantees this (`migrate deploy` precedes `next build`).
3. **Migration failure fails the deploy.** If `prisma migrate deploy` exits non-zero the
   whole build fails, the old deployment keeps serving, and no schema is improvised.
4. **Seed never runs in the build pipeline and never again after go-live** — it is
   wipe-and-insert (deletes subscribers, contacts, everything). One-time, local, before
   the site serves, over an exceptional remote access window.
5. **Production deps only on the host.** The host installs `dependencies`, not
   `devDependencies`. `prisma` + `@prisma/client` are in `dependencies` because the build
   must be able to run `migrate deploy` and generate the client. Anything else needed at
   build/runtime lives in `dependencies` (`@tailwindcss/postcss`, `tailwindcss`,
   `tw-animate-css`). TypeScript/tsx/eslint can stay dev-only.
6. **Webpack, not Turbopack.** Turbopack panics parsing `globals.css` in the sandboxed
   build (`node worker exits`) — `next build --webpack` is the working build.
7. **`TRUST_PROXY` is only set after the edge contract is verified.** The rate limiter
   ignores client-supplied `X-Forwarded-For` and `x-real-ip` by default (they are
   forgeable). Leave unset unless the edge is verified to overwrite/strip them.
8. **`ALLOW_INDEXING=true` is set ONLY on the real production domain** (build-time). Staging
   and preview must leave it unset so `robots.txt` serves a full `Disallow: /`.
9. **`MEDIA_PERSISTENT=true` is set ONLY on deployments that persist the app dir.** Archive
   deploy overwrites the app dir on rebuild, so without this flag uploaded media vanishes;
   default on the host = production CMS uploads are refused (403) and editorial media lives
   in Git. **Future durable path (deferred):** object storage (S3/R2) + CDN, swap
   `src/app/api/admin/media/route.ts` internals — the byte-sniff validation stays.
10. **`ALLOW_DEMO_SEED` / `ALLOW_ADMIN_BOOTSTRAP` never appear in the host env.** They are
   set only on a local bootstrap invocation (with `NODE_ENV=production` so the guard
   actually exercises).

## Normal deploy procedure (no DB access needed)

```bash
# 0. gates
npm run lint && npm run typecheck && npm run validate:docs && npm run slop
git fetch origin main && git diff --check
# (code changed) local full build against LOCAL dev DB: npm run build && npm run test

# 1. archive exactly the approved/merged commit
git archive --format=zip --output=duyanblog-source.zip <MERGE_COMMIT_SHA>

# 2. MCP: hosting_deploy-js-application {domain:"duyanblog-test.hostingersite.com",
#         archivePath:"E:/duyanblog-source/duyanblog-source.zip"}
# 3. MCP: hosting_list-js-deployments (poll until completed; failed → build-logs)
#    — the build runs `prisma migrate deploy` itself using host env DATABASE_URL
```

## Exceptional maintenance path (seed/backup/debug — rare, signed-off)

Normal deploys never need DB access from a developer machine. For one-off maintenance
(initial seed, a one-time backup, an emergency fix), and ONLY with explicit scope:

```bash
# 1. temporarily allow THIS machine's public IP
#    MCP: hosting_databases_create-remote-connection
#         {username:"u257278613", name:"u257278613_duyanblog", ip:"<your-ip>"}
#    (match the IPv4 or IPv6 the client will actually connect from)
# 2. run the CLI against the external host with a KNOWN password
#    export DATABASE_URL="mysql://u257278613_duyanblog:<PASSWORD>@srv2123.hstgr.io:3306/u257278613_duyanblog"
#    npx prisma migrate deploy   # or mysqldump / seed, as scoped
# 3. close the rule immediately
#    MCP: hosting_databases_delete-remote-connection {username, name, ip:"<same-ip>"}
```

**Password is knowingly rotated (2026-10-05).** The database password now lives only in the
Hostinger env vars (masked); a locally-kept plaintext copy exists only for the exceptional
maintenance path and must never be printed, committed, or pasted into a report.

## Credential handling

- DB password: lives in the Hostinger env only; the app reads it at build/runtime. If a
  one-time rotation is needed, Hostinger exposes a non-destructive password change
  (`hosting_databases_change-password`) — update both `DB_PASSWORD` and `DATABASE_URL` in a
  single env replace, preserving every other variable. Never print the password.
- Admin password: set once via bootstrap; never printed. Owner changes it after login.

## `duyanblog.com` swap (when the owner registers the domain)

1. Register the domain.
2. Hostinger: add/park `duyanblog.com` on the website.
3. Point DNS at Hostinger; wait for TLS.
4. **Rebuild** with `NEXT_PUBLIC_SITE_URL=https://duyanblog.com` — send the full env set
   preserving DB vars (Hostinger's replace deletes omitted vars), then archive-deploy.
5. Verify `/` + smoke + runtime verifier against the new origin.
6. Redirect the old subdomain to the new domain (hosting-level redirect).

## Rollback

- **Code:** revert the archive to the previous known-good build (re-run a deploy of the
  previous commit's archive), or `git revert <commit>` then redeploy. Schema migrations are
  idempotent-forward; a destructive revert needs its own migration + backup.
- **Database:** restore from the latest staging backup dump (see maintenance path) over an
  exceptional access window. Never recreate the DB.

## Known quirks (measured)

- MySQL collation is case-insensitive: `slug`/`email`/redirect matches are case-insensitive.
- `ArticleTag` composite PK = 1528 bytes utf8mb4 — needs InnoDB `DYNAMIC` row format
  (default on MySQL 8/MariaDB 10.6+).
- `/go/does-not-exist` must 302 to the PUBLIC origin — the code uses `site.url` (configured
  `NEXT_PUBLIC_SITE_URL`), never `request.url` (upstream origin is `0.0.0.0:3000` behind the
  edge) and never a bare relative path (Next 500s).
- `NEXT_PUBLIC_*` is baked at build time; changing it requires a rebuild.
- Newsletter double opt-in in production returns `{ok, emailed}` (with a provider) or a
  truthful **503** (no `RESEND_API_KEY` — Correction 14), NEVER `{ok:true, emailed:false}`.
- Media uploads in production are refused (403) unless `MEDIA_PERSISTENT=true`. On the
  archive deploy (rebuild wipes the app dir) leave it unset and manage media via Git.
- Hostinger `mysqldump` from the local MySQL 8.4 client needs `--skip-column-statistics`
  against the host's MariaDB `information_schema` (no `COLUMN_STATISTICS` table).