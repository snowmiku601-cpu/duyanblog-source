# HOSTINGER_DEPLOYMENT.md — duyanblog.com in production

The verified deployment procedure for this repo. **This document describes what was actually
done on 2026-10-04** — the Business-plan Node.js web app route — with the VPS path kept as an
alternative appendix for a later scale-up.

## 1. Which Hostinger product

| Hosting type | Verdict |
| --- | --- |
| **Business / Cloud shared hosting (Node.js web app)** | **The route in use.** The `hostinger_business_v3` plan runs a Node.js web app (app_type `next`, node 18/20/22/24) with a managed build pipeline (git or archive source) and a MySQL database. This is what duyanblog runs on. |
| **Hostinger VPS** | Alternative for scale-up (appendix §8). Costs extra; not needed at editorial scale. |
| **Shared hosting static/PHP-only** | Not sufficient — the app needs a Node runtime and a persistent server process. Hostinger's Node.js web app layer (not plain static hosting) is the requirement. |

## 2. Database: MySQL (platform-provisioned, known password)

The app uses **MySQL**, not SQLite. Two reasons:

1. A Node.js build on the platform **overwrites the website contents** — a SQLite file inside
   the app directory would be destroyed on every rebuild.
2. The platform provisions MySQL and exposes it via env vars.

**Provisioning (via the Hostinger API / hPanel):**

- Create the database with a **known password** (`hosting_databases_create` with
  `website_domain` set — the platform-generated password via `setup-website` is unrecoverable,
  which would make local tooling unable to connect for seeding/backups).
- The **app** connects to `127.0.0.1:3306` (platform rule for Node.js apps — `localhost` may
  resolve to IPv6).
- **Local tooling** (migrate/seed/bootstrap) connects to the external host `srvNNNN.hstgr.io`
  over a temporary remote-access rule, closed afterwards.
- Database/user names carry the account prefix: `u257278613_duyanblog` (the platform prefixes
  the account username).

Schema/migrations: `prisma/schema.prisma` is **MySQL-canonical**; there is a single baseline
migration (`20261004000000_init`). Long content columns are `@db.LongText`/`@db.Text`
(no `DEFAULT` — MariaDB rejects `DEFAULT` on TEXT/BLOB); slugs/emails/tokens stay
`VARCHAR(191)` for index sizing. MySQL's default collation is case-insensitive: slug/email
lookups and the redirect proxy match case-insensitively — normalize input at the boundary if
case-sensitivity is ever needed.

## 3. Environment variables (write ONCE, never replace)

The DB password lives ONLY in the website's env vars and is not recoverable. Therefore:

- **Write the full env set in ONE `replace-environment-variables` call, BEFORE the first
  build**, and **never call `replace-environment-variables` again**. A later full replace
  would drop `DB_PASSWORD` and break the app.
- Required set: `NODE_ENV=production`, `NEXT_PUBLIC_SITE_URL=https://<domain>`,
  `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
  `DATABASE_URL=mysql://<user>:<pct-encoded-password>@127.0.0.1:3306/<db>`.
- **Never set `ALLOW_DEMO_SEED` / `ALLOW_ADMIN_BOOTSTRAP` on the host** — they belong only on
  the local bootstrap invocation, so the production guards stay armed at all times.
- `NODE_ENV=production` flips session cookies to `Secure` and arms the seed/bootstrap guards.

## 4. Build & run (git source)

- Repository: `snowmiku601-cpu/duyanblog-source`, branch `main` (public). The host builds
  **directly from GitHub main** — every relevant change is pushed there first.
- Build settings: node 22, app_type `next`, root `.`, build script `build` (= `prisma generate
  && next build && cp -r .next/static .next/standalone/.next/ && cp -r public
  .next/standalone/`), package manager npm.
- The platform starts the app itself (Next standalone); `npm start` (Node 22) is the local-dev
  convenience; `npm run start:node` is the same command without the log tee.
- **A build prerenders the `revalidate=N` pages and queries the DB** — so **migrate BEFORE
  every build**. `npx prisma migrate deploy` (idempotent) is run locally over a remote DB
  connection, then the build is triggered. The seed NEVER runs in the build pipeline (it is
  wipe-and-insert; every deploy would reset data).

## 5. First-deploy sequence (verified 2026-10-04)

1. **Repo prep** — provider MySQL, one baseline migration, `prisma generate` in build chain;
   gates green (`npm run lint && npm run typecheck && npm run validate:docs && npm run slop`).
2. **Provision the website** — `hosting_websites_create` on the Business order with the
   temporary domain; poll the setup until `completed`.
3. **Create the DB with a known password** (`hosting_databases_create`), then **write the full
   env set ONCE** (`replace-environment-variables`). Never touch the env again.
4. **Data bootstrap (LOCAL)**: open a remote-access rule; locally with `DATABASE_URL` →
   `mysql://…@srvNNNN.hstgr.io:3306/…`:
   `npx prisma migrate deploy` · `NODE_ENV=production ALLOW_DEMO_SEED=true npm run seed:demo` ·
   `NODE_ENV=production ALLOW_ADMIN_BOOTSTRAP=true npm run admin:bootstrap -- --email <owner>
   --password "<12+ chars, letters+digits>"`; negative control: `NODE_ENV=production` without
   the flag must refuse; close the remote rule.
5. **Connect GitHub** (hPanel → Websites → Manage → Advanced → Git; owner authorizes once) →
   **build settings** (node 22, next, `.`, `build`, npm) → **start build** (git source) → poll
   to `completed` (`analyse-failed-build` on failure) → restart.
6. **Verify**: content assertion on `/` and `/about`; `SMOKE_BASE_URL=https://<domain> npm run
   test` (51 checks; a 429 on newsletter/contact is the rate limiter — wait a minute and
   rerun); runtime verifier; owner manual check (consent banner, admin login, one edit
   appears publicly, `/go/` 302).
7. **Guard proof**: flags absent in env; data intact after a second build (deploy-twice check).

## 6. Backups

- **MySQL:** use the platform's database tools (or `mysqldump` against
  `srvNNNN.hstgr.io` from an allowed host) on a schedule. The database is the only mutable
  state; everything else is rebuildable from the repo. `ArticleRevision` rows are part of the
  DB backup — they are the editorial audit trail.
- Test a restore into staging before relying on it.

## 7. Smoke test

```bash
SMOKE_BASE_URL=https://<domain> npm run test
```

`scripts/smoke.mjs` checks: 200 on `/`, all type indexes, `/deals`, `/search?q=esim`,
`/authors`, `/about`, `/contact`, `/methodology`, all 8 policy pages, `/software`, `/travel`,
`/tech`; 404 on a junk path; 200 on `/sitemap.xml`, `/robots.txt`, `/feed.xml`; 302 on
`/go/does-not-exist` (→ `/deals`); 307 on `/admin`; 400 on `POST /api/newsletter` with an
invalid email. Back-to-back runs can trip the newsletter rate limiter (5 POSTs/min/IP → 429) —
wait a minute; that limiter is the feature.

Also verify manually once: `https://<domain>/sitemap.xml` shows the production origin; a
seeded (or first real) article renders with correct canonical URL; the consent banner appears
and "Only necessary" keeps ad slots absent; buy buttons 302 to the right merchant.

## 8. Appendix — VPS alternative (scale-up path)

Keep in mind this repo ships a `Caddyfile` (VPS-only reverse proxy) and the original
HOSTINGER_DEPLOYMENT guidance described a VPS. On a VPS (KVM 1+, Ubuntu 24.04):

1. `git clone` + `npm ci` + `cp .env.example .env` + `npx prisma migrate deploy`.
2. `npm run build` (standalone) + run `node .next/standalone/server.js` under systemd
   (`Restart=always`), reverse-proxied by Caddy/Nginx with TLS to port 3000.
3. Keep the MySQL from §2 (the platform DB, or switch `DATABASE_URL` to any MySQL/Postgres).
4. Backups via `mysqldump`/`pg_dump` as appropriate.

The two paths share the same repository, schema, and migrations — switching is a deploy
change, not a code change.