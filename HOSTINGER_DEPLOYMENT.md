# HOSTINGER_DEPLOYMENT.md — duyanblog.com in production

An honest deployment guide. This repo targets **Node.js 20+** hosting (see `engines` in `package.json`). There is no Hostinger-specific magic here and nothing in the codebase depends on a particular host.

## 1. Which Hostinger product fits

| Hosting type | Verdict |
| --- | --- |
| **Hostinger VPS** (KVM 1 or larger, Ubuntu 22.04/24.04) | Works out of the box with the SQLite setup as-is. Install Node 20+, reverse-proxy 3000 behind Caddy/Nginx with TLS. Recommended default |
| Hostinger managed Node.js hosting | Works, but the managed platform's filesystem is usually not persistent/multi-instance-safe for SQLite — switch to external PostgreSQL (§2) |
| Shared hosting (PHP plans) | Not suitable for this app. Do not attempt |

## 2. Database: SQLite (VPS) or PostgreSQL (managed)

**VPS + SQLite (default):** keep `provider = "sqlite"` and `DATABASE_URL="file:./db/custom.db"`. Back up the file (§6). SQLite in WAL mode is fine for a single-node editorial site.

**External PostgreSQL (managed hosting, or VPS at scale):**

1. Edit `prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Set `DATABASE_URL` to the Postgres connection string (`postgresql://user:pass@host:5432/duyanblog?sslmode=require`).
3. Run `npx prisma migrate deploy` (the existing migrations are plain SQL and apply to Postgres).
4. **The JSON-in-String columns need no change.** `Article.blocks`, `ComparisonItem.attributes/pros/cons`, `Author.focusAreas` are `TEXT` columns validated by Zod at the application boundary (`src/lib/content-schema.ts`, `src/lib/comparison.ts`) — they migrate as-is. Converting them to native `jsonb` is an optional later refactor, not a requirement.
5. Re-seed only if you want demo content: `ALLOW_DEMO_SEED=true npm run seed:demo` (the script refuses production without the flag). For a real launch, do **not** seed — create the admin and author content manually.

Note on the SQLite path: the URL is `file:./db/custom.db` (repo-root `db/custom.db` in this sandbox). If your tooling resolves it relative to `prisma/`, verify where the file actually lands with `npx prisma studio` or a quick query before writing backup cron jobs.

## 3. Build and run (host-agnostic)

```bash
git clone <repo> && cd <repo>
npm ci
cp .env.example .env            # then edit values (§4)
npx prisma generate             # client, committed schema
npx prisma migrate deploy       # apply migrations (no db push in prod)
npm run build                   # next build + copies static/public into standalone
npm start                       # NODE_ENV=production bun .next/standalone/server.js
```

Notes:

- `npm run build` runs `next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/`. **That copy step is part of the build** — `output: "standalone"` does not include `.next/static` or `public/` by itself, and skipping it yields a server that 404s its own assets.
- `npm start` uses **bun** to run the standalone server (`package.json`). If your host has no bun, run the same artifact with Node: `NODE_ENV=production node .next/standalone/server.js`. (The standalone output is normally `node server.js`; this project pins the bun runner — either works, pick one and keep it.)
- `NODE_ENV=production` must be set for the running process: it flips session cookies to `Secure` and arms the production guards (seed/bootstrap refusals).
- Set `NEXT_PUBLIC_SITE_URL=https://duyanblog.com` **before building** — it is baked into canonical URLs, OG tags, sitemap and RSS at build time.
- Put the app behind a reverse proxy with TLS (Caddy or Nginx on a VPS; managed TLS on platform hosts). `Strict-Transport-Security` is already emitted by `next.config.ts`; terminate TLS at the proxy and forward to port 3000. Secure cookies require the site to actually be served over HTTPS.
- Process supervision: run under systemd or a supervisor (`Restart=always`). Example unit: `ExecStart=/usr/bin/env NODE_ENV=production node /srv/duyanblog/.next/standalone/server.js`, `Environment=PORT=3000`.

## 4. Environment variables

| Variable | Required | Value |
| --- | --- | --- |
| `DATABASE_URL` | yes | `file:./db/custom.db` (SQLite) or the Postgres connection string |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://duyanblog.com` — canonical/sitemap/RSS/OG origin |
| `NODE_ENV` | yes (runtime) | `production` |
| `PORT` | optional | Standalone server port (default 3000) |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | no | Leave empty until a provider is wired in `src/lib/consent.ts` |
| `NEXT_PUBLIC_ADS_ENABLED` | no | Documented force-enable for ad slots; note the current code gates on the `ads_enabled` DB setting (AFFILIATE_INTEGRATION.md §7) |
| `ALLOW_DEMO_SEED` | no | `true` only if you deliberately want the fictional dataset in production |
| `ALLOW_ADMIN_BOOTSTRAP` | no | `true` only while running the admin bootstrap in production (§5) |

## 5. First-deploy sequence and security checklist

1. Apply migrations, then create the admin **once**:
   `ALLOW_ADMIN_BOOTSTRAP=true npm run admin:bootstrap -- --email you@example.com --password "<12+ chars, letters + digits>"`
2. **Unset `ALLOW_ADMIN_BOOTSTRAP` afterwards** (remove it from the environment/service unit). The script refuses to run in production without it, and refuses a second admin without `--force` — keep both guards intact.
3. Strong database credentials (Postgres user: least privilege, TLS enforced). Never commit `.env` — it is only in `.env.example` template form in the repo.
4. TLS at the reverse proxy so `Secure` session cookies work; without HTTPS the admin cookie is dropped by browsers and login breaks.
5. Verify the production guards responded: running `npm run seed:demo` or `admin:bootstrap` without the allow flags must exit non-zero.
6. Keep `next.config.ts` security headers (HSTS, nosniff, DENY, referrer/permissions policy) — they are part of the deploy, not optional polish.
7. Sessions live in the DB (`Session` table, 7-day TTL, sha256-hashed tokens); deleting a row revokes a device. No extra secret is needed beyond the database.

## 6. Backups

- **SQLite:** back up `db/custom.db` — schedule `sqlite3 db/custom.db ".backup '/backups/duyanblog-$(date +%F).db'"` daily (use the `.backup` command or WAL-safe copy, not a naive `cp` while the server writes). Test a restore into staging.
- **Postgres:** scheduled `pg_dump` (daily full) with off-server retention.
- Either way: the database is the only mutable state; everything else is rebuildable from the repo. `ArticleRevision` rows are part of the DB backup — they are your editorial audit trail.

## 7. First-deploy smoke test

Against the live URL:

```bash
SMOKE_BASE_URL=https://duyanblog.com npm run test
```

`scripts/smoke.mjs` checks: 200 on `/`, all type indexes, `/deals`, `/search?q=esim`, `/authors`, `/about`, `/contact`, `/methodology`, all 8 policy pages, `/software`, `/travel`, `/tech`; 404 on a junk path; 200 on `/sitemap.xml`, `/robots.txt`, `/feed.xml`; 302 on `/go/does-not-exist` (→ `/deals`); 307 on `/admin` (assumes the admin area exists — this check fails until the admin is built); and a 400 on `POST /api/newsletter` with an invalid email.

Also verify manually once: `https://duyanblog.com/sitemap.xml` shows the production origin; a seeded (or first real) article renders with correct canonical URL; the consent banner appears and "Only necessary" keeps ad slots absent; buy buttons 302 to the right merchant.
