# duyanblog.com — Hostinger deployment design

**Date:** 2026-10-04 · **Status:** approved in chat (option 1) · **Path:** architectural

## 1. Goal

Run duyanblog.com — a Next.js 16 App Router app (`output: "standalone"`, Prisma, server
runtime: ISR, `/api/*`, `/admin`, `/go` router, `src/proxy.ts` redirect service) — in
production on the **existing** Hostinger Business plan (`hostinger_business_v3`, order
`1009151112`, account `u257278613`), with **no additional cost**.

Constraint from the owner: zero new spend on Hostinger; the possibility of running the site on
the same infrastructure as the sibling sites (`thesmartaistack.com`, `jellyreviews.com`) was
the deciding question. Answer: yes — Hostinger Business shared hosting provides a **Node.js web
app** layer (API surface confirmed below) that the siblings do not use (they are static
exports), but that this account's plan includes.

## 2. Verified platform facts (measured 2026-10-04 via Hostinger MCP)

| Fact | Value |
|---|---|
| Account | `u257278613` (client 1020374645) |
| Plan | `hostinger_business_v3` — supports Node.js web apps (`node_version` 18/20/22/24) |
| Existing websites | `thesmartaistack.com` (main), `jellyreviews.com` (addon), `chocolate-sheep-589770.hostingersite.com` — all `website_type: other` (static/PHP) |
| Domain portfolio | only `thesmartaistack.com` (expires 2027-04-15). **`duyanblog.com` is not registered** (owner will buy it later) |
| Agency / VPS plans | none |

API operations available on this account (the plan's Node.js layer):

- `hosting_websites_create` (create website on order; async — poll `hosting_websites_list-setups`)
- `hosting_git_list-installations` / `hosting_git_list-installation-repositories` (GitHub import)
- `hosting_nodejs_update-build-settings` / `hosting_nodejs_get-build-settings`
- `hosting_nodejs_start-build` (`source_type: git|archive`), `hosting_nodejs_list-builds`,
  `hosting_nodejs_build-logs`, `hosting_nodejs_analyse-failed-build`
- `hosting_nodejs_restart-application`, `hosting_nodejs_list-environment-variables`,
  `hosting_nodejs_replace-environment-variables`
- `hosting_databases_setup-website` (creates a MySQL DB; writes `DB_HOST`, `DB_PORT`,
  `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DATABASE_URL` into the app env — password **never
  returned**; existing vars kept; call fails 422 if any of those names already exist)
- `hosting_databases_create-remote-connection` (opens the DB to outside connections so local
  tooling can reach it — used for the one-time data bootstrap; host from
  `hosting_databases_list` is `srvNNNN.hstgr.io`)
- `hosting_deploy-js-application`, `hosting_cron-jobs_list`, `hosting_redirects_*`

## 3. Chosen approach (owner-approved)

Deploy a **Node.js web app** on the existing Business order, fed from the **GitHub repo**
`snowmiku601-cpu/duyanblog-source` (public), with a **MySQL** database provisioned by the
platform (replacing the local SQLite for production), on a **temporary Hostinger subdomain**
until `duyanblog.com` is registered.

Rejected alternatives (kept on record):

1. **VPS (KVM 1)** — works but costs money; owner ruled out new spend.
2. **PaaS (Render/Railway)** — off-Hostinger, new account/host; owner prefers staying in the
   billing they already have.
3. **Static export** — the app's server features (admin, API, ISR, `/go`, redirect proxy) would
   be lost; not a compatible product.

## 4. Target architecture

```
Browser ── TLS (auto Let's Encrypt on the subdomain)
   └── Hostinger Business shared hosting (order 1009151112)
        └── Node.js web app "duyanblog-test.hostingersite.com"  (app_type: next, node 22)
              ├── Next.js standalone runtime (ISR /api /admin /go, src/proxy.ts)
              ├── MySQL database (platform-provisioned; DATABASE_URL from env)
              └── env: NEXT_PUBLIC_SITE_URL, NODE_ENV=production, DATABASE_URL(+DB_*)
```

- **Database:** MySQL, not SQLite. Rationale: a Node.js build on this platform **overwrites the
  website contents** ("WARNING: on success this overwrites the website's existing contents and
  cannot be undone") — a SQLite file inside the app directory would be destroyed on every
  rebuild; shared hosting gives no durable local filesystem guarantee for app data. MySQL is
  the platform's supported durable store and the API provisions it end-to-end.
- **Code change required:** `prisma/schema.prisma` `provider` `"sqlite"` → `"mysql"`, and the
  three existing migrations (`20260928122551_init`, `20260928125741_add_reading_minutes`,
  `20260928173719_newsletter_double_opt_in`) regenerated **for MySQL** (`prisma migrate diff`
  against the datamodel, same names/order preserved). All JSON-in-String columns are TEXT —
  MySQL-native. No index is on a TEXT column (indexes are on String/DateTime columns), so no
  prefix-length problems. Local dev switches back to SQLite by keeping a dev-only
  `prisma/schema.sqlite.prisma`? — **no**: keep one schema, provider read from env is not
  supported by Prisma. Decision: the repo's canonical `schema.prisma` becomes MySQL (the
  production target); local dev uses the same MySQL via the same `DATABASE_URL` (a local MySQL)
  or a documented dev-only `DATABASE_URL` to a local SQLite requires a second schema file —
  **deferred to the plan** (two options: (a) one MySQL schema for everyone + local MySQL for
  dev, or (b) keep `schema.prisma` sqlite + new `schema.mysql.prisma` used by a
  `prisma generate --schema` override in the build). Marked OPEN below.
- **App type:** `next`. Build script `npm run build` (existing: `next build` + copies into
  standalone). `root_directory`: `.`. `output_directory`/`entry_file`: resolved at plan time via
  `hosting_nodejs_get-build-settings` / auto-detection; fallback per platform for Next apps
  (standalone server run). `package_manager: npm` (the host does not guarantee bun; the
  `start` script's bun usage is a local-dev convenience and will not run on the host).
- **Domain:** temporary `duyanblog-test.hostingersite.com` (pattern matches the existing
  `chocolate-sheep-589770.hostingersite.com` on this account). When the owner registers
  `duyanblog.com`: add/park it on the website, point DNS, update
  `NEXT_PUBLIC_SITE_URL` (requires rebuild — it is baked at build time), verify, then move the
  old subdomain to a redirect.
- **Builds:** start manually through the API per deploy (no CI/CD requested by owner — the
  GitHub auto-deploy setting is available via `hosting_git_*` but enabling it is an owner
  decision, costs nothing, and is a later option). Git source keeps deploys reproducible; a
  fallback path `hosting_deploy-js-application` (archive, no GitHub link) exists if the GitHub
  installation cannot be authorized.
- **Email:** `RESEND_API_KEY` not set at launch → production sends no confirmation emails
  (transport reports loudly, `sendMail` returns `{delivered:false, provider:"none"}`); the
  admin "copy confirmation link" affordance remains the stopgap. Documented limitation, not a
  blocker. `EMAIL_FROM` reserved.

## 5. Sequencing (top-level; details in the implementation plan)

1. **Repo preparation** — MySQL migrations regenerated (`prisma migrate diff` local);
   `.env.example` gains the MySQL URL shape; gates green (`lint`, `typecheck`,
   `validate:docs`, `slop`).
2. **Provision** — `hosting_websites_create` on order `1009151112` for
   `duyanblog-test.hostingersite.com`; poll `hosting_websites_list-setups` until `completed`.
3. **Non-DB env** — `replace-environment-variables` → `NODE_ENV=production`,
   `NEXT_PUBLIC_SITE_URL=https://duyanblog-test.hostingersite.com` (BEFORE the DB setup, per
   O5).
4. **Database** — `hosting_databases_setup-website` (name `duyanblog`; adds `DATABASE_URL` +
   `DB_*` on top of existing vars); confirm env vars written.
5. **GitHub connection** — owner authorizes the GitHub installation in hPanel once
   (Websites → Manage → Advanced → Git); confirm via `hosting_git_list-installations`;
   fallback: archive deploy via `hosting_deploy-js-application`.
6. **Build** — `hosting_nodejs_update-build-settings` (node 22, next, root `.`, build script
   `build`, npm); `hosting_nodejs_start-build` (git source: `snowmiku601-cpu/duyanblog-source`,
   `main`); poll `list-builds`/`build-logs`; on failure `analyse-failed-build`. Restart once
   built.
7. **Data bootstrap (one-time, run LOCALLY via remote DB connection)** —
   `hosting_databases_create-remote-connection`; local `DATABASE_URL` →
   `mysql://<user>:<pass>@srvNNNN.hstgr.io:<port>/<db>`; `npx prisma migrate deploy` (also
   runs idempotently at app start if wired), `ALLOW_DEMO_SEED=true npm run seed:demo`,
   `ALLOW_ADMIN_BOOTSTRAP=true npm run admin:bootstrap -- --email <owner> --password <12+
   chars>`; then close the remote connection. Flags live only in the local invocation.
8. **Verify** — `SMOKE_BASE_URL=https://duyanblog-test.hostingersite.com npm run test` (51
   checks); `duyan-runtime-verifier` agent against the live URL (guards, canonical/OG, feeds,
   images, `/go`); owner-side manual check (consent banner, /admin login).
9. **Close out** — repo docs updated (ARCHITECTURE.md §10 trade-off row: SQLite → MySQL in
   prod), `HOSTINGER_DEPLOYMENT.md` corrected to the real, verified procedure (it currently
   describes a VPS), risk register rows amended, playbook
   `.claude/playbooks/deploy-hostinger.md` written from what was actually done, worklog entry.

## 6. Success criteria

- Public site 200 on the temporary domain; all smoke checks green against it.
- Admin login works over HTTPS with a bootstrapped account; mutations appear (revalidate
  contract intact) — verified via the admin UI once.
- Scheduled publishing still hides future-dated stories on the live host.
- `/go/` links 302 to the seeded offer URLs; `robots.txt` disallows `/admin`, `/api/`, `/go/`.
- A second build (deploy update) does not wipe the MySQL data (the database is platform-side,
  and no seed ever runs in the build pipeline).
- `NODE_ENV=production` guards verified: `seed:demo`/`admin:bootstrap` refuse without the
  allow-flags (they are only set on the local bootstrap invocation, never on the host).

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Shared hosting Node runtime limits (memory/CPU/process model) vs ISR + Prisma | Business plan size is adequate for an editorial site; ISR keeps loads low; smoke suite will surface issues early. If the platform rejects the standalone layout, fallback is `output_directory` tuning or `app_type other` + entry file — resolved in the plan phase via auto-detection + analyse-failed-build. |
| `prisma migrate deploy` SQL for MySQL differs from what was tested on SQLite | The three migrations are regenerated via `prisma migrate diff` locally before any host build; the seed + smoke leg runs against MySQL pre-flight if a local MySQL is available (or defer to first host build logs). |
| GitHub installation not authorized (owner action) | Fallback `hosting_deploy-js-application` (archive upload) — same build pipeline, no git link. |
| `duyanblog.com` registered later — env rebuild needed | Documented; the temporary subdomain is a step, not the destination; playbook covers the swap. |
| eSIM/merchant demo links point to fictional destinations | By design (demo); affiliate swap documented in AFFILIATE_INTEGRATION.md. |

## 8. Open items (resolved during plan-writing, flagged for the owner where needed)

- **O1 — Prisma schema strategy:** one MySQL schema for all environments (needs local MySQL or
  a remote dev DB) vs dual schema files (`schema.prisma` sqlite for local, `schema.mysql.prisma`
  for build). Recommendation: **single schema = MySQL** (canonical, one set of migrations, the
  documented Postgres-portable claim extends to MySQL); local dev runs the same MySQL via the
  platform or a local instance. Owner impact: local dev flow changes (no more file SQLite).
  **Decision made in review:** single MySQL schema; the owner-approved direction (deploy on
  existing plan) overrides local-file convenience, and a local SQLite for dev would permanently
  fork migrations. Noted for the plan as a committed choice.
- **O2 — Next `app_type` run shape:** how the platform starts the standalone server (auto vs
  explicit `entry_file`) — resolved empirically via `get-build-settings` before the first
  build; no owner decision needed. Also resolved: **the build script is `npm run build` ONLY**;
  migrate/seed/bootstrap never run in the host build pipeline (review outcome).
- **O3 — `start` script bun dependency:** platform runs its own start; confirm npm fallback in
  the plan (likely `node .next/standalone/server.js` documented, not a code change).
- **O4 — Email:** launch without RESEND (owner can add a key later; no decision required now).
- **O5 — Platform DB password is unrecoverable after env replacement:** mitigation chosen —
  set non-DB env BEFORE the DB setup; never call `replace-environment-variables` afterwards
  (review outcome).