# duyanblog → Hostinger Node.js Deployment Implementation Plan (refined v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy duyanblog (Next.js 16 standalone) as a Node.js web app on the existing Hostinger Business order (`1009151112`) with MySQL and GitHub source, on the temporary domain, at zero additional cost.

**Architecture:** Hostinger shared hosting runs a Node.js web app (app_type `next`, node 22) built from the public GitHub repo `snowmiku601-cpu/duyanblog-source` branch `main`. The app talks to a MySQL database created with a **known password** via `hosting_databases_create` (not `setup-website` — the platform-generated password is unrecoverable, which would make the local one-time bootstrap impossible). ALL env vars (non-DB + `DATABASE_URL`+`DB_*`) are written in **ONE single `replace-environment-variables` call BEFORE the first build**; the DB set is never replaced afterwards (spec O5). The app connects to MySQL via `127.0.0.1:3306` (platform rule); the local bootstrap connects via the remote host `srvNNNN.hstgr.io` with the same credentials over a temporary remote-access rule. One-time data bootstrap (migrate + demo seed + admin) runs LOCALLY; the host build pipeline never runs seed (it is wipe-and-insert) and never carries `ALLOW_DEMO_SEED`/`ALLOW_ADMIN_BOOTSTRAP`.

**Tech Stack:** Next.js 16 App Router (`output: "standalone"`), Prisma 6 (provider SQLite→MySQL), Node 22, npm, Hostinger Business Node.js apps + MySQL, GitHub (git source), smoke suite + `duyan-runtime-verifier`.

**Spec:** `docs/superpowers/specs/2026-10-04-duyanblog-hostinger-deploy-design.md` (revised 2026-10-04 to the known-password mechanism — functional equivalence with the owner-approved direction).

**Measured repo facts (2026-10-04):** `start` uses bun (host uses npm → `start:node` added). `build` currently `next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/` (Task 3 adds `prisma generate &&`). `engines.node >=20` (node 22 ✓). Prisma `provider=sqlite`, `migration_lock.toml` sqlite, **4 migrations**. Seed/bootstrap refuse production without their allow-flags. `.env` exists locally (SQLite URL — will be reused for the bootstrap with the MySQL URL, then reverted; never committed — `.env*` gitignored).

## Global Constraints

- **Zero additional spend** — everything on order `1009151112`. No VPS, no PaaS.
- **`NODE_ENV=production` on the host.** Security headers/HSTS, Secure cookies, seed/bootstrap refusal all depend on it.
- **Env is written ONCE.** One `replace-environment-variables` call containing the full set (`NODE_ENV`, `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, `DB_*`), BEFORE the first build, and **never again** — a later full replace would drop values (DB password lives only in the env) and break the app. (Spec O5, revised.)
- **Never run `seed:demo`/`admin:bootstrap` in the host build pipeline** — seed is wipe-and-insert; every deploy would reset data. Flags live only on the local bootstrap invocation; host env never has them.
- **Host has no shell channel** — only `build_script` (`npm run build`) and the platform's start; migrate is applied LOCALLY (idempotent SQL), never via seed-in-build.
- **App DB host is `127.0.0.1`; local bootstrap uses `srvNNNN.hstgr.io`** (platform rule: Node.js apps connect to 127.0.0.1 because localhost may resolve to IPv6; remote rules apply to the external host).
- **Bootstrap (migrate + seed + admin) runs BEFORE the first build** — `next build` prerenders the `revalidate=N` pages and queries the DB; an unmigrated DB fails the build (P0001). Every later deploy re-runs `migrate deploy` before `next build`.
- **MySQL long columns are `@db.LongText` without `@default`** — bare `String` maps to `VARCHAR(191)` on MySQL and truncates `Article.blocks` (6–10 KB) etc.; `TEXT/BLOB` cannot carry `DEFAULT` on MariaDB (error 1101).
- **Domain:** temporary `duyanblog-test.hostingersite.com` (or the API-suggested `.hostingersite.com` name if that exact one is rejected — propagated to env/docs afterwards); `duyanblog.com` registration is a later, documented swap.
- **Repo gates stay green at every commit:** `npm run lint && npm run typecheck`, `npm run validate:docs`, `npm run slop`.

## Review Focus

1. **Env replaced after the app is live** drops `DB_PASSWORD` → app dies, password unrecoverable. Pinned by Task 5 (single replace, hard stop afterwards) and Task 9 (playbook documents it). Control: Task 5 Step 3 is an explicit "never again" commit point.
2. **Seed sneaking into the build pipeline or running against a LIVE db** resets all data on every deploy. Pinned by Task 5 (build script stays `npm run build`), Task 6A/6B order (bootstrap runs BEFORE the first build — the site is never serving when seed runs), and Task 6A (seed only local, once, before the site is live). Control: Task 6A Step 4 confirms the host env lacks the allow-flags and data survives repeat deploys.
3. **`next build` fails P0001 because the DB was not migrated yet** — every `revalidate=N` page prerenders at build time and queries the DB; 0 `generateStaticParams` in the repo. Pinned by the new order: Task 6A (migrate + seed + admin, local) runs BEFORE Task 6B (first build). A later deploy re-runs `migrate deploy` before `next build` (Task 6B Step 0) — the playbook records this forever.
4. **MySQL truncates content at VARCHAR(191)** — Prisma maps bare `String` to `VARCHAR(191)` on MySQL; `blocks` (6–10 KB), `tldr`, `focusAreas`, `attributes/pros/cons`, `MethodologyEntry.body` all exceed it → the very first `seed:demo` insert dies with `Data too long`. Pinned by Task 1 Step 1 (`@db.LongText` ± no `@default`) + Task 1 Step 3 control (`VARCHAR(191) must be 0`).
5. **Local dev flow breaks silently after the MySQL switch** (old SQLite `DATABASE_URL` still in local `.env`). Pinned by Task 2 (docs) — `.env` is gitignored so nothing commits the stale URL; Task 6A resets and reverts it deliberately.
6. **The guard machinery silently never fires locally** — `ALLOW_DEMO_SEED`/`ALLOW_ADMIN_BOOTSTRAP` are no-ops when `NODE_ENV` is unset (seed.ts line 18 short-circuits), so Task 6A must set `NODE_ENV=production` explicitly and prove the refusal with a negative control. Pinned by Task 6A Step 2.
7. **The app connects to `localhost`/IPv6 or the remote host instead of `127.0.0.1`.** Pinned by Task 5 Step 2 (URL uses `127.0.0.1:3306`) + Task 6A Step 2 (bootstrap uses `srvNNNN`); a reasonable person might reuse the app URL for the local bootstrap — they differ by design.
8. **First smoke run against the live host trips the newsletter rate limiter** (429) — the limiter is the feature; wait a minute and rerun (memory lesson). Pinned by Task 8 Step 1.

---

### Task 1: Switch Prisma provider SQLite → MySQL, single baseline migration (no local MySQL needed)

**Files:**
- Modify: `prisma/schema.prisma:12`
- Modify: `prisma/migrations/migration_lock.toml:3`
- Create: `prisma/migrations/20261004000000_init/migration.sql`
- Delete: the 4 old SQLite migration folders (`20260928122551_init`, `20260928125741_add_reading_minutes`, `20260928171055_newsletter_unsubscribe_token`, `20260928173719_newsletter_double_opt_in`)

**Interfaces:** Consumes the existing 20-model schema; produces the MySQL-canonical schema + baseline migration used by every later task (Task 6A's `migrate deploy`).

- [ ] **Step 1: Switch provider + lockfile, and annotate long columns for MySQL**

`prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```
**Critical (MySQL):** Prisma maps a bare `String` to `VARCHAR(191)` on MySQL — every long content
column must be annotated or `seed:demo` dies on the first insert with `Data too long`. Add
`@db.LongText` to these fields and REMOVE their `@default("[]")` (MariaDB refuses `DEFAULT` on
TEXT/BLOB, error 1101):

```prisma
model Author {
  focusAreas String @db.LongText          // was: String @default("[]") — remove the default
}
model Article {
  deck       String @db.Text              // ~168 chars in seed — fits, but Text is honest
  tldr       String? @db.Text             // ~280 chars
  blocks     String @db.LongText          // was: String @default("[]") — 6–10 KB JSON; remove the default
}
model ArticleRevision {
  blocks     String @db.LongText          // same — remove the default if present
}
model ComparisonItem {
  attributes String @db.LongText          // was: String @default("[]")
  pros       String @db.LongText          // was: String @default("[]")
  cons       String @db.LongText          // was: String @default("[]")
}
model MethodologyEntry {
  body       String @db.LongText          // ~1.1 KB
}
```
Keep `@default`/`VARCHAR(191)` on every slug/email/token — they carry unique indexes and need
the 191 charset for index-key sizing. Do NOT annotate them.

`prisma/migrations/migration_lock.toml`:
```toml
provider = "mysql"
```

- [ ] **Step 2: Generate the MySQL baseline SQL (no database needed)**

```bash
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > /tmp/init.sql
mkdir -p prisma/migrations/20261004000000_init
cp /tmp/init.sql prisma/migrations/20261004000000_init/migration.sql
rm -rf prisma/migrations/20260928122551_init prisma/migrations/20260928125741_add_reading_minutes \
       prisma/migrations/20260928171055_newsletter_unsubscribe_token prisma/migrations/20260928173719_newsletter_double_opt_in
npx prisma generate
```
The old SQLite chain cannot be replayed on MySQL (autoincrement/BLOB semantics differ) and has no production value — the app is not live; the single baseline is canonical.

- [ ] **Step 3: Verify the generated SQL is MySQL-canonical (control checks with BOTH directions)**

```bash
grep -c -i "ENGINE=InnoDB" prisma/migrations/20261004000000_init/migration.sql      # must be > 0 (must-HIT)
grep -c "CREATE TABLE" prisma/migrations/20261004000000_init/migration.sql          # must be ≥ 20 (must-HIT)
grep -c "VARCHAR(191)" prisma/migrations/20261004000000_init/migration.sql          # must be > 0 — slugs/emails need it (must-HIT)
grep -c "LONGTEXT\|TEXT " prisma/migrations/20261004000000_init/migration.sql       # must be > 0 — the long columns (must-HIT)
grep -c "AUTO_INCREMENT" prisma/migrations/20261004000000_init/migration.sql        # must be 0 — every PK is client-side cuid(), never autoincrement (corrected)
grep -ci "autoincrement\|BLOB" prisma/migrations/20261004000000_init/migration.sql  # must be 0 — no SQLite artifacts (must-MISS)
```
If MariaDB later rejects a TEXT/LONGTEXT `DEFAULT` at `migrate deploy` (Task 6A Step 2), the
fallback is to drop the remaining `@default` clauses on the long columns and re-diff — do NOT
skip this; Task 1's annotations already removed them, so this fallback should be a no-op.

- [ ] **Step 4: Local sanity (gates only — no DB needed)**

```bash
npm run lint && npm run typecheck && npm run validate:docs && npm run slop
npx prisma validate
```

- [ ] **Step 5: Commit AND push (the host builds from GitHub main — required)**

```bash
git add -A && git commit -m "chore(db): switch Prisma provider to MySQL, single baseline migration
SQLite history (4 folders) replaced by one MySQL baseline created with
prisma migrate diff --from-empty. migration_lock provider=mysql.
Engine/autoincrement/tables control checks pass; full DDL comformance
verified at host migrate deploy (Task 6A)."
git push origin main
```

---

### Task 2: Update env/docs — `.env.example`, README, ARCHITECTURE, HOSTINGER_DEPLOYMENT (MySQL)

**Files:** Modify `.env.example`, `README.md:34-35`, `ARCHITECTURE.md:140`, `HOSTINGER_DEPLOYMENT.md`.

**Interfaces:** Consumes Task 1; produces docs matching the real target (used by Tasks 4–9 and the playbook).

- [ ] **Step 1: `.env.example` — MySQL shape**
```env
# --- Required ---
# MySQL (production, Hostinger Business Node.js app — set via the platform env, never committed)
DATABASE_URL="mysql://user:password@127.0.0.1:3306/dbname"
```

- [ ] **Step 2: README quickstart** — replace the SQLite steps with the MySQL note ("local dev: a local MySQL or the platform DB; `npx prisma migrate dev` against your `DATABASE_URL`").

- [ ] **Step 3: ARCHITECTURE.md §10 trade-off row** — "SQLite (sandbox default) → MySQL in production; migrations are MySQL-canonical; schema is the same 20 models."

- [ ] **Step 4: HOSTINGER_DEPLOYMENT.md** — rewrite "Database + Build and run" for the real, verified Business-plan procedure (Node.js web app, GitHub source, MySQL with known password, single env replace before build, local bootstrap over remote connection, `start:node` for hosts without bun, temporary subdomain). Keep the VPS path as a short alternative appendix; note the repo `Caddyfile` is VPS-only.

- [ ] **Step 5: Gates + commit + push**

```bash
npm run lint && npm run typecheck && npm run validate:docs && npm run slop
git add .env.example README.md ARCHITECTURE.md HOSTINGER_DEPLOYMENT.md
git commit -m "docs(db): MySQL on Hostinger Business — env example, README, architecture, deploy doc"
git push origin main
```

---

### Task 3: Host tooling — `start:node` fallback + `prisma generate` in the build chain

**Files:** Modify `package.json` (scripts).

**Interfaces:** Produces `npm run start:node` (node, no bun) and a build that regenerates the Prisma client on the host (install-time postinstall may pick the wrong/no schema; explicit is safe). Consumes the standalone layout.

- [ ] **Step 1: Edit scripts**
```jsonc
"start": "NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log", // local dev, unchanged
"start:node": "NODE_ENV=production node .next/standalone/server.js",                  // host-compatible fallback
"build": "prisma generate && next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/",
```

- [ ] **Step 2: Verify the build still passes locally**
```bash
npm run build   # expect: prisma generate + next build + copies, exit 0
```

- [ ] **Step 3: Commit + push**
```bash
git add package.json
git commit -m "chore: add start:node (no bun) and prisma generate in build chain"
git push origin main
```

---

### Task 4: Provision the website (Platform)

**Files:** none (MCP). **Platform state:** website on order `1009151112`.
**Interfaces:** Consumes `u257278613` + order `1009151112`; produces a live (empty) website for Tasks 5–6.

- [ ] **Step 1: Create the website**

Via MCP: `hosting_websites_create` `{ domain: "duyanblog-test.hostingersite.com", order_id: 1009151112 }`.
If that exact domain is rejected, capture the API-suggested `.hostingersite.com` name and use it; propagate to Tasks 5–8 and the docs (env `NEXT_PUBLIC_SITE_URL` and all smoke/verifier URLs).

- [ ] **Step 2: Poll readiness**

`hosting_websites_list-setups` (domain filter) every ~15 s until `status: completed`. Do not proceed to file/deploy/DB ops while `running` (404/409 otherwise).

---

### Task 5: Create MySQL with known credentials + ONE env replace (order-critical)

**Files:** none (MCP). **Credential handling:** a strong password is generated locally, kept only in the local gitignored `.env` (restored to MySQL URL after Task 6A), never committed; the owner is given it for the future.

**Interfaces:** Consumes Task 4's website; produces MySQL DB + env vars (`DATABASE_URL` with `127.0.0.1`, `DB_*`). Tasks 6–8 consume the same env.
**Order:** this is the ONLY place env is written. After Step 3, no `replace-environment-variables` ever again.

- [ ] **Step 1: Create the DB with a known password**

Generate locally: `openssl rand -base64 24` (or equivalent) — record in local `.env` only.
Via MCP: `hosting_databases_create`
`{ username: "u257278613", name: "duyanblog", user: "duyanblog", password: "<generated>", website_domain: "duyanblog-test.hostingersite.com" }`.
Resolve the FULL names via `hosting_databases_list` (the platform prefixes with `u257278613_`); use the full names everywhere below.

- [ ] **Step 2: Write the full env set ONCE (before any build)**

Via MCP: `hosting_nodejs_replace-environment-variables`
```
{
  "username": "u257278613",
  "domain": "duyanblog-test.hostingersite.com",
  "variables": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_SITE_URL": "https://duyanblog-test.hostingersite.com",
    "DB_HOST": "127.0.0.1",
    "DB_PORT": "3306",
    "DB_NAME": "u257278613_duyanblog",
    "DB_USER": "u257278613_duyanblog",
    "DB_PASSWORD": "<generated>",
    "DATABASE_URL": "mysql://u257278613_duyanblog:<percent-encoded-password>@127.0.0.1:3306/u257278613_duyanblog"
  }
}
```
Percent-encode the password in the URL (`@`, `#`, `%`, `/`, spaces → `%40`, `%23`, `%25`, `%2F`, `%20`).
Verify keys with `hosting_nodejs_list-environment-variables` (values masked; keys must exist). Do NOT set `ALLOW_DEMO_SEED`/`ALLOW_ADMIN_BOOTSTRAP`.

- [ ] **Step 3: Hard commit point — never call replace again**

Document in worklog/playbook: any future env change must preserve this set (the DB password lives only in these env vars). This is the single most expensive mistake in the deployment.

---

### Task 6A: One-time data bootstrap (LOCAL via remote connection) — BEFORE the first build

**Files:** none (local CLI + MCP). **Requirements:** local Node 20+, `npx prisma`, repo at Task
1's schema; local `.env` currently holding the generated DB password from Task 5.

**Interfaces:** Consumes the MySQL created in Task 5 (same credentials; ADD a remote-access rule
for the external host only for this window); produces migrated schema + demo data + admin;
re-arms guards afterwards. Runs BEFORE Task 6B's build because `next build` prerenders the
`revalidate=N` pages and queries the DB — an unmigrated DB fails the build (P0001).

- [ ] **Step 1: Open a narrow remote window**

Via MCP: `hosting_databases_list` → full DB name + host `srvNNNN.hstgr.io` (port 3306). `hosting_databases_create-remote-connection` `{ username, name: "<full name>", ip: "%" }` (or the machine's public IP; `%` is simpler, tightened after). Note: this rule is for the LOCAL bootstrap only — the app itself uses `127.0.0.1` and needs no rule.

- [ ] **Step 2: Apply schema + data from local (bash syntax — Git Bash/WSL; PowerShell: `$env:DATABASE_URL=...`)**

```bash
export DATABASE_URL="mysql://u257278613_duyanblog:<percent-encoded-password>@srvNNNN.hstgr.io:3306/u257278613_duyanblog"
npx prisma migrate deploy                                          # idempotent; REAL checkpoint for the Task 1 DDL
NODE_ENV=production ALLOW_DEMO_SEED=true npm run seed:demo         # one-time demo dataset; NODE_ENV set so the guard arm FIRES and is exercised
NODE_ENV=production ALLOW_ADMIN_BOOTSTRAP=true npm run admin:bootstrap -- --email <owner> --password "<12+ chars, letters+digits>"
# negative control — prove the guard really refuses when the flag is absent:
NODE_ENV=production npx tsx prisma/seed.ts                          # MUST exit 1 with "Refusing to seed demo data in production"
```
> **Warning — destructive on live data:** `seed:demo` is wipe-and-insert (deletes
> `newsletterSubscriber`, `contactMessage`, all 18 seeded tables). This task runs BEFORE the
> site is built/serving, so nothing real can be lost. If the site is EVER live and you re-run
> the seed, every subscriber/contact/editorial change since the last seed is deleted
> permanently. Do not re-run.
If `migrate deploy` fails on TEXT-default DDL (MariaDB flavor): drop the remaining `DEFAULT`
clauses at the Prisma level for the long columns, regenerate the baseline (Task 1 Step 2),
re-run. If it fails with `Specified key was too long` (ArticleTag composite PK = 1528 bytes
utf8mb4): run `SET SESSION innodb_default_row_format=DYNAMIC;` before the migrate, or shorten
the PK columns to `CHAR(36)` (cuid is 25 chars) — document which one was needed in the playbook.
Afterwards: `unset DATABASE_URL` and restore the local `.env` to whatever the owner wants for
local dev (e.g. a local MySQL) — never the production password in a committed file.

- [ ] **Step 3: Close the window**

Via MCP: `hosting_databases_delete-remote-connection` `{ username, name: "<full name>", ip: "%" }` (or the machine IP) once the bootstrap is done.

- [ ] **Step 4: Verify guards armed on the host**

`hosting_nodejs_list-environment-variables` → `ALLOW_DEMO_SEED` / `ALLOW_ADMIN_BOOTSTRAP` ABSENT. (If ever present, remove — but that would be a replace; this is why they are never set at Task 5.)

---

### Task 6B: Connect GitHub + build + run (Platform) — AFTER the DB has schema + data

**Files:** none (MCP). **Platform state:** website + env + DB from Tasks 4–5 + 6A (schema + data applied).
**Interfaces:** Consumes GitHub install (owner action) + repo `main` (must include Tasks 1–3 commits — verify `git ls-remote origin main` hash locally first); and the migrated/seeded DB from 6A; produces a running built app.

- [ ] **Step 0 (deploy contract): migrate BEFORE every build**

Every future deploy needs the DB migrated BEFORE `next build` (prerender queries it). For this
first build the schema is already applied (6A). For later deploys: run `npx prisma migrate
deploy` locally via a fresh remote window BEFORE triggering a build. The playbook records this
permanently — it is not optional.

- [ ] **Step 1: Verify main is current**
```bash
git fetch origin && git rev-parse origin/main   # equals the local main that includes Tasks 1-3
```
Owner action — authorize the GitHub app in hPanel once (Websites → Manage → Advanced → Git). Confirm via `hosting_git_list-installations` (`provider: github`, `status: active`).

- [ ] **Step 2: Build settings**

`hosting_nodejs_update-build-settings` `{ username, domain, node_version: 22, app_type: "next", root_directory: ".", build_script: "build", package_manager: "npm", output_directory: null, entry_file: null }` → verify via `hosting_nodejs_get-build-settings`.

- [ ] **Step 3: Start the build (git source)**

`hosting_nodejs_start-build` `{ username, domain, node_version: 22, app_type: "next", root_directory: ".", output_directory: "", build_script: "build", package_manager: "npm", source_type: "git", source_options: { owner: "snowmiku601-cpu", repository: "duyanblog-source", branch: "main", installation_uuid: <from Step 1> } }`.

- [ ] **Step 4: Poll to completion**

`hosting_nodejs_list-builds` → running → `hosting_nodejs_build-logs` (uuid) → `completed` (or `failed` → `hosting_nodejs_analyse-failed-build`, fix, rebuild). First build installs deps (npm) — allow several minutes.

- [ ] **Step 5: Restart + CONTENT assertion (not just a status code)**

`hosting_nodejs_restart-application`; then assert real content (a 200 with an empty prerender
would be a false green — a DB-less rerender is exactly what the order fix prevents):
```bash
curl -s https://duyanblog-test.hostingersite.com/ | grep -c "auralis-note-14-review"   # must be > 0
curl -s https://duyanblog-test.hostingersite.com/about | grep -c "Duy An Tran"          # must be > 0
```
If 500/404: check build logs; candidate causes — run-shape (platform starts `next start` vs
standalone — both work because `.next` and `.next/standalone` both exist), env bake (rebuild
after env change is automatic in the pipeline).

- [ ] **Step 6: Fallback (only if Step 1 cannot be authorized)**

Package source locally (exclude `node_modules`, `.next`, gitignored) → `hosting_deploy-js-application { domain, archivePath }` → same build/poll/restart.

---

### Task 8: Verify the live host (smoke + verifier + owner)

**Files:** none (running server + MCP/curl).

**Interfaces:** Consumes the deployed app (Task 6B) + bootstrapped DB/admin (Task 6A); produces the acceptance evidence.

- [ ] **Step 1: Smoke suite against the live host**
```bash
SMOKE_BASE_URL=https://duyanblog-test.hostingersite.com npm run test
# expect: all 51 PASS. 429s on newsletter/contact = the rate limiter working — wait a minute, rerun.
```

- [ ] **Step 2: Runtime verifier**

Dispatch `duyan-runtime-verifier` against the live URL (ground truth: demo dataset, admin contract, scheduled-publishing guard, canonical/OG, `/go`). Expect PASS; fix findings before close-out.

- [ ] **Step 3: Owner manual check**

Once: consent banner; `/admin` login with the bootstrapped account; one content edit appears publicly (revalidate contract); `/go/` 302; no horizontal overflow at 375.

- [ ] **Step 4: Guard proof — observable on the host, not in-situ shell**

The host has no shell, so the production guard cannot be *executed* on the host. Proof instead
uses what observables exist:
1. `hosting_nodejs_list-environment-variables` → `ALLOW_DEMO_SEED` / `ALLOW_ADMIN_BOOTSTRAP`
   ABSENT (confirmed at Task 6A Step 4).
2. Negative control of the guard itself already ran LOCALLY (Task 6A Step 2 —
   `NODE_ENV=production` without the flag must refuse; that is the exact branch the host
   process would take, since `NODE_ENV=production` is in its env).
3. Deploy-twice check: trigger a second build (a dummy commit or `start-build` re-run) and
   confirm the demo data is STILL present afterwards — proving no seed ran in the build
   pipeline. Record the before/after row counts.

---

### Task 9: Close out — playbook, risk register, memory, worklog

**Files:** Create `.claude/playbooks/deploy-hostinger.md`; Modify `.claude/rules/risk-register.md`, `worklog.md`; user-scope memory entry.

**Interfaces:** Consumes what was actually done (Tasks 4–8) — the playbook is written from the real procedure, never from the spec.

- [ ] **Step 1: Write the deploy playbook** — from actual steps: MCP ops used, order-sensitivity (env written once; DB password in env only; app uses 127.0.0.1 vs remote bootstrap; **migrate BEFORE every build**), credential handling, local bootstrap, guard re-arming, `duyanblog.com` swap checklist (register → park on website → DNS → rebuild with new `NEXT_PUBLIC_SITE_URL` → redirect old subdomain), rollback (revert commits; delete website/DB via MCP), and the MariaDB notes (row-format for ArticleTag PK; case-insensitive collation for slugs/emails).

- [ ] **Step 2: Fix the risk register** — R1 (demo→real) stays OPEN; add CLOSED row: env-replace-after-live (regression note: playbook §order); add CLOSED row: migrate-after-build-order (regression note: playbook §order); add OPEN row: `duyanblog.com` swap (blocked on owner purchase) with the playbook link.

- [ ] **Step 3: Memory + worklog** — append the user-scope memory (deployment facts worth keeping: DB naming prefix, 127.0.0.1 rule, env-once principle, migrate-before-every-build) and a `Task ID` entry in `worklog.md` (goal, steps, evidence: smoke output, verifier result, guard proof, URLs).

- [ ] **Step 4: Final gates + commit + push**
```bash
npm run lint && npm run typecheck && npm run validate:docs && npm run slop
git add .claude/playbooks/deploy-hostinger.md .claude/rules/risk-register.md worklog.md
git commit -m "docs(deploy): Hostinger Node.js deploy playbook, risk register, worklog"
git push origin main
```

---

## Rollback & failure paths (per task)

- **Task 1/2/3 (repo):** `git revert <commit>` — pure source changes; the host is not affected until Task 6B.
- **Task 4 (website):** if setup fails or the domain is wrong — delete via `hosting_websites_delete` (verify operation name via search) and recreate; costs nothing but time.
- **Task 5 (DB/env):** if the env replace is botched BEFORE any build, re-run the same single replace (no app depends on it yet). AFTER the app is live, never replace — recover by re-creating the DB with a new password and a new single replace **only if the app is still not serving real traffic** (demo stage). The playbook documents this clearly.
- **Task 6A (bootstrap):** failed `migrate deploy` → DDL fallback (Task 6A Step 2: TEXT-default or key-too-long); failed seed is safe to rerun ONLY while the site is not yet live (wipe+insert); admin bootstrap refuses a second admin without `--force`.
- **Task 6B (build):** failed build → `analyse-failed-build` → fix build settings or repo → rebuild. A bad deploy never touched the DB (host disk is throwaway; MySQL is platform-side). If the build fails on missing tables, the order was broken — run 6A again before rebuilding.
- **Task 8 (verify):** blockers → fix in a new repo commit + rebuild (env untouched, DB untouched).

## Self-Review notes (3-pass review)

- **Pass 1 (my correctness pass):** fixed the Task 5↔Task 7 credential contradiction (single known-password mechanism instead of `setup-website`); app uses `127.0.0.1` vs local bootstrap `srvNNNN` (platform rule); Task 1 no longer depends on local MySQL (`migrate diff --from-empty`); `prisma generate` added to the build chain; push-to-main added where the host depends on it.
- **Pass 2 (duyan-db-guard's independent pass — 12 findings, 2 BLOCKER):** (a) fixed `String → VARCHAR(191)` truncation: added `@db.LongText` + removed `@default` on all long columns (blocks/tldr/deck/focusAreas/attributes/pros/cons/body) — hosts the seed's 6–10 KB blocks that would die on `Data too long`; (b) fixed the order: **bootstrap (6A) now runs BEFORE the first build (6B)**, because `next build` prerenders the `revalidate=N` pages and queries the DB — an unmigrated DB fails with P0001; (c) guard env no-op fixed: `NODE_ENV=production` set explicitly in 6A's local commands + negative control added; (d) guard proof moved to observable evidence (deploy-twice data-survival) instead of an impossible in-situ shell test; (e) destructive-seed warning added (runs before the site is live; never re-run after); (f) corrected controls (AUTO_INCREMENT must be 0 — all PKs are cuid()); (g) content assertion replaces bare `curl -I`; (h) migration-chain deviation noted (single baseline, old SQLite chain unreplayable); (i) case-insensitive collation + ArticleTag key-length noted for the playbook.
- **Pass 3 (final consistency pass):** env var names/URLs consistent across tasks (`u257278613_duyanblog`, `127.0.0.1` vs `srvNNNN`), Review Focus updated to the new pins (now 8 items incl. VARCHAR truncation and build-order), no placeholder steps, task references updated after the 6/7 split, spec updated (known-password mechanism, single baseline, LongText) and re-committed.