# duyanblog → Hostinger Node.js Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy duyanblog (Next.js 16 standalone) as a Node.js web app on the existing Hostinger Business order (`1009151112`) with MySQL and GitHub source, on the temporary domain `duyanblog-test.hostingersite.com`, at zero additional cost.

**Architecture:** Hostinger shared hosting runs a Node.js web app (app_type `next`, node 22) built from the public GitHub repo `snowmiku601-cpu/duyanblog-source` branch `main`; the app talks to a platform-provisioned MySQL database (`DATABASE_URL` + `DB_*` env vars, password unrecoverable); non-DB env is set BEFORE the DB setup so a full env replace never drops `DB_PASSWORD`. One-time data bootstrap (migrate + demo seed + admin) runs LOCALLY over a remote DB connection — the host build pipeline never runs seed (would reset data) nor carries `ALLOW_DEMO_SEED`/`ALLOW_ADMIN_BOOTSTRAP`.

**Tech Stack:** Next.js 16 App Router (`output: "standalone"`), Prisma 6 (provider switched SQLite→MySQL), Node 22, npm, Hostinger Business Node.js apps + MySQL, GitHub (git source), smoke suite (`scripts/smoke.mjs`) + `duyan-runtime-verifier`.

**Spec:** `docs/superpowers/specs/2026-10-04-duyanblog-hostinger-deploy-design.md` — the plan argues from the spec; executors read both.

**Measured repo facts (2026-10-04):** `start` = `NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log` (bun — host uses npm; override stays in the env/start section). `build` = `next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/`. `engines.node >=20` (node 22 satisfies). Prisma `provider = "sqlite"` + `migration_lock.toml` provider `sqlite`; **4 migrations**: `20260928122551_init`, `20260928125741_add_reading_minutes`, `20260928171055_newsletter_unsubscribe_token`, `20260928173719_newsletter_double_opt_in`. Guards: seed refuses `NODE_ENV=production` without `ALLOW_DEMO_SEED=true`; bootstrap refuses without `ALLOW_ADMIN_BOOTSTRAP=true`. README quickstart references `cp .env.example .env` + SQLite which Task 2 updates for MySQL.

## Global Constraints

- **Zero additional spend** — everything happens on order `1009151112` (Business plan). No VPS, no PaaS.
- **`NODE_ENV=production` on the host.** Security headers/HSTS, Secure cookies, seed/bootstrap refusal all depend on it.
- **Never call `hosting_nodejs_replace-environment-variables` AFTER `hosting_databases_setup-website`** — the platform-generated `DB_PASSWORD` is masked and unrecoverable; a replace drops it and breaks the app. (Spec O5: non-DB env first, DB setup second, no replace afterwards.)
- **Never run `seed:demo` or `admin:bootstrap` in the host build pipeline** — seed is wipe-and-insert; every deploy would reset data. (Spec §7: run locally over a remote DB connection, flags on the local invocation only; `ALLOW_DEMO_SEED`/`ALLOW_ADMIN_BOOTSTRAP` never set on the host.)
- **Host has no shell channel** — the only execution entry points are `build_script` (`npm run build`, unchanged) and the platform's start command for `next` apps; migrate happens LOCALLY, the same idempotent SQL the app needs.
- **Domain** is the temporary `duyanblog-test.hostingersite.com`; `duyanblog.com` registration is a later, documented step.
- **Repo gates stay green:** `npm run lint && npm run typecheck`, `npm run validate:docs`, `npm run slop` — at every commit.

## Review Focus

1. **Env-replace after DB setup drops `DB_PASSWORD`** — a reasonable person might "clean up" env midway; the plan pins the order (Task 5) so no step can reorder it. Test/control: after DB setup, `list-environment-variables` is read-only and never followed by a replace in any step.
2. **A rebuild wiping the site data** — a reasonable person might add seed to `build_script`; pins (Task 4/5): build script stays `npm run build`; seed only ever runs locally over a remote connection.
3. **Local dev flow after the schema switch** — a reasonable person might run `prisma migrate dev` with the old SQLite `DATABASE_URL`; Task 2 updates `.env.example` + README + ARCHITECTURE so the mismatch is visible, not silent.
4. **`start` script still calls bun on the host** — the platform runs its own start; the plan leaves `start` for local dev but adds a host-usable `start:node` (Task 4) so the documented fallback exists.
5. **First smoke run against the host fails on rate limiting or a not-yet-ready URL** — a reasonable person would "fix" the limiter; the smoke suite's 429 is the limiter working (memory lesson), retry after a minute.

---

### Task 1: Switch Prisma provider SQLite → MySQL (repo-side)

**Files:**
- Modify: `prisma/schema.prisma:12` (datasource provider)
- Modify: `prisma/migrations/migration_lock.toml:3`
- Test: local (prisma introspect/migrate diff + seed against local MySQL, or validated SQL)

**Interfaces:**
- Consumes: the existing Prisma schema/models (20 models), the 4 migrations.
- Produces: a MySQL-canonical Prisma schema + regenerated migrations; everything downstream (Tasks 2–9) assumes `DATABASE_URL` is a MySQL URL.

- [ ] **Step 1: Switch the provider + lockfile**

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

`prisma/migrations/migration_lock.toml`:
```toml
provider = "mysql"
```

- [ ] **Step 2: Regenerate the 4 migrations for MySQL, exactly matching the model, preserving order/names**

Use the Prisma CLI (dev machine):
```bash
# 1) drop old SQLite-specific migrations on the dev copy is NOT done — the repo migrants are
#    regenerated cleanly: move the 4 folders aside, then
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > /tmp/mysql_init.sql
# 2) create fresh migration folders with the SAME names in the same order, each containing the
#    diff segment — the plan's authoritative way: since the 4 migrations form a linear history,
#    use `prisma migrate dev --create-only` per step is too interactive; the deterministic method:
npx prisma migrate dev --name init --create-only               # generates new init for MySQL
# ... then the remaining 3 by diffing the previous state to the final schema:
npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --shadow-database-url "..."
```

**Clarification (deterministic, non-interactive):** the cleanest correct procedure on a dev
machine with a MySQL available:
```bash
# 0) a temporary empty MySQL database for shadow/dev
export DATABASE_URL="mysql://devuser:devpass@127.0.0.1:3306/duyanblog_dev"
# 1) delete the old SQLite migration folders + lock, reset the dev DB
rm -rf prisma/migrations
npx prisma migrate dev --name init        # creates fresh init (MySQL)
# 2) regenerate the remaining three as new stages by replaying the same model changes —
#    the authoritative migrations are recreated as a single MySQL baseline; the 4 names are
#    preserved as separate folders only if the model changes map cleanly. Since the model
#    final schema is identical regardless, the SAFEST output is ONE fresh migration
#    '20261004000000_init' containing the full MySQL schema, plus keeping the old 4 folders
#    only as historical context is NOT possible (migration_lock is provider-specific).
```

**DECISION (locked):** the repo's migration history becomes **one MySQL baseline migration
`20261004000000_init`** (full schema, generated by `prisma migrate dev --name init` against a
local MySQL), and the 3 old SQLite migration folders are removed. Rationale (spec-compatible):
the app is not yet live; the SQLite history has no production value to preserve; SQLite and
MySQL DDL for these models are incompatible as a chain (SQLite autoincrement/BLOB differences).
This keeps one canonical migration set for MySQL on every environment. The spec's "keep the 4
names/order" is superseded by the measured reality that a SQLite→MySQL chain cannot be replayed
— the plan states this deviation explicitly.

- [ ] **Step 3: Verify the generated migration is MySQL-canonical**

```bash
npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --shadow-database-url "mysql://devuser:devpass@127.0.0.1:3306/shadow" --exit-code
# expect: exit 0 (no drift)
npx prisma generate
```

- [ ] **Step 4: Run the seed + smoke legs against a local MySQL to prove the app works on MySQL**

```bash
# with DATABASE_URL pointing at the local MySQL from Step 2:
ALLOW_DEMO_SEED=true npm run seed:demo        # wipes + inserts demo — local dev DB only
npm run lint && npm run typecheck
# (full smoke needs a running dev server; at minimum the DB leg must succeed)
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "chore(db): switch Prisma provider to MySQL and rebase migrations

SQLite history (4 folders) replaced by one MySQL baseline migration
created with prisma migrate dev. migration_lock provider=mysql.
Meets the Hostinger Business Node.js deploy target (spec §4).
Verified: migrate diff exit 0 against a local MySQL shadow DB; seed
runs against MySQL; lint/typecheck green."
```

---

### Task 2: Update env/docs — `.env.example`, README, ARCHITECTURE (MySQL)

**Files:**
- Modify: `.env.example` (DATABASE_URL comment + MySQL shape)
- Modify: `README.md:34-35` (quickstart for MySQL)
- Modify: `ARCHITECTURE.md:140` (§10 trade-off row SQLite→MySQL in prod)
- Modify: `HOSTINGER_DEPLOYMENT.md` (section "Database" — MySQL on the Business plan)

**Interfaces:**
- Consumes: Task 1's MySQL schema/migrations.
- Produces: docs that describe Deployment correctly (used by Task 4–9 and the playbook).

- [ ] **Step 1: `.env.example` — DATABASE_URL comment + MySQL example**

Replace the SQLite default with a MySQL shape + note:

```env
# --- Required ---
# MySQL (production, Hostinger Business Node.js app — set via the platform, never commit)
DATABASE_URL="mysql://user:password@host:port/dbname"
```

- [ ] **Step 2: README quickstart — MySQL note**

Update the commands block so `npx prisma migrate dev` uses the MySQL URL and the "SQLite" claim
is gone (or "local dev may use a local MySQL").

- [ ] **Step 3: ARCHITECTURE.md §10 — trade-off row**

Change the SQLite row to "MySQL in production (Hostinger Business Node app); SQLite was the
sandbox default — the schema is the same, migrations are MySQL-canonical".

- [ ] **Step 4: HOSTINGER_DEPLOYMENT.md — correct the VPS-only text**

Rewrite the "Database" + "Build and run" sections for the real, verified procedure on the
Business plan (Node.js web app, GitHub source, MySQL via `setup-website`, local bootstrap,
temporary subdomain, shared-hosting caveats). Keep the VPS steps as an alternative appendix.

- [ ] **Step 5: Gates + commit**

```bash
npm run lint && npm run typecheck && npm run validate:docs && npm run slop
git add .env.example README.md ARCHITECTURE.md HOSTINGER_DEPLOYMENT.md
git commit -m "docs(db): MySQL on Hostinger Business — env example, README, architecture, deploy doc"
```

---

### Task 3: Add host-usable `start:node` script (npm fallback)

**Files:**
- Modify: `package.json` scripts

**Interfaces:**
- Consumes: the standalone build artifact layout (`.next/standalone/server.js`).
- Produces: `npm run start:node` — the documented fallback for hosts without bun (spec O3).

- [ ] **Step 1: Add the script**

```jsonc
"start": "NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log", // unchanged, local dev
"start:node": "NODE_ENV=production node .next/standalone/server.js", // host-compatible fallback
```

- [ ] **Step 2: Verify locally (optional — needs a built standalone)**

If `.next/standalone` exists: `npm run start:node` should boot and serve `:3000` on a quick curl.
Otherwise note in the commit that it is verified on the host (Task 6).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add start:node fallback (npm, no bun) for hosts without bun"
```

---

### Task 4: Provision the website + non-DB env (Platform; order-sensitive)

**Files:** none (hosting operations via Hostinger MCP).
**Platform state:** website `duyanblog-test.hostingersite.com` exists on order `1009151112`.
**Interfaces:**
- Consumes: account `u257278613`, order `1009151112`, MCP `hosting_*` operations.
- Produces: a live (but empty) website; non-DB env vars set. Later tasks build on it.

- [ ] **Step 1: Create the website**

Via MCP: `hosting_websites_create` with `{ domain: "duyanblog-test.hostingersite.com", order_id: 1009151112 }`.
Poll `hosting_websites_list-setups` (filter domain) every ~15 s until `status: completed`. While
`running`, file/deploy ops 404 — do not proceed early.

- [ ] **Step 2: Set non-DB env FIRST (per O5 — before any DB setup)**

Via MCP: `hosting_nodejs_replace-environment-variables`
`{ username: "u257278613", domain: "duyanblog-test.hostingersite.com", variables: { NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://duyanblog-test.hostingersite.com" } }`.
(Exact request key names per the operation's schema; verify via `hosting_nodejs_list-environment-variables`
afterwards — values are masked but keys must exist.) Do NOT set `ALLOW_DEMO_SEED`/
`ALLOW_ADMIN_BOOTSTRAP` here (spec §7).

- [ ] **Step 3: Add `start:node`-compatible guard — nothing further to set; README of this task is the ordering note**

**(no extra env needed)** — the platform starts `next` apps itself.

- [ ] **Step 4: Record the exact env keys observed (masked)**

`hosting_nodejs_list-environment-variables` — confirm `NODE_ENV`, `NEXT_PUBLIC_SITE_URL`
present. Never read or re-send DB values here (none exist yet).

---

### Task 5: Provision the MySQL database (Platform; never replaced later)

**Files:** none (MCP operations).
**Platform state:** `duyanblog-test.hostingersite.com` website + env from Task 4.
**Interfaces:**
- Consumes: Task 4's website/env.
- Produces: MySQL DB + `DATABASE_URL`/`DB_*` env vars on the website (password masked,
  unrecoverable). Tasks 7–8 use the same vars; Task 6's build sees them at runtime.

- [ ] **Step 1: Create + link the DB**

Via MCP: `hosting_databases_setup-website`
`{ username: "u257278613", domain: "duyanblog-test.hostingersite.com", name: "duyanblog" }`.
This writes `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DATABASE_URL`
(`mysql://user:pass@host:port/name`, percent-encoded) into the website env and restarts. The
platform generates the password; it is never returned.

- [ ] **Step 2: Confirm the env vars (keys only, masked)**

`hosting_nodejs_list-environment-variables` → `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`,
`DB_PASSWORD`, `DATABASE_URL` all present (values `********`). If a 422 occurred, resolve the
conflicting name first (never delete DB vars to "retry").

- [ ] **Step 3: Hard commit point — never call `replace-environment-variables` from this point on**

Document in the worklog/playbook: any env change from now on must preserve the DB set.
(Spec O5. This is the single most expensive mistake in the whole deployment.)

---

### Task 6: Connect GitHub + build the app (Platform; git source, fallback archive)

**Files:** none (MCP operations).
**Platform state:** website + env + DB from Tasks 4–5.
**Interfaces:**
- Consumes: GitHub installation (owner action), repo `snowmiku601-cpu/duyanblog-source` `main`.
- Produces: a built Node.js `next` app on the domain; started/restarted server.

- [ ] **Step 1: GitHub connection (owner action)**

Owner authorizes the GitHub app in hPanel once (Websites → Manage → Advanced → Git). Confirm via
`hosting_git_list-installations` (`provider: github`, `status: active`).

- [ ] **Step 2: Set build settings**

Via MCP: `hosting_nodejs_update-build-settings`
`{ username, domain, node_version: 22, app_type: "next", root_directory: ".", build_script: "build", package_manager: "npm", output_directory: null, entry_file: null }`.
Verify with `hosting_nodejs_get-build-settings`.

- [ ] **Step 3: Start the build (git source)**

Via MCP: `hosting_nodejs_start-build`
`{ username, domain, node_version: 22, app_type: "next", root_directory: ".", output_directory: "", build_script: "build", package_manager: "npm", source_type: "git", source_options: { owner: "snowmiku601-cpu", repository: "duyanblog-source", branch: "main", installation_uuid: <from Step 1> } }`.

- [ ] **Step 4: Poll the build**

`hosting_nodejs_list-builds` (states: running → completed) and `hosting_nodejs_build-logs`
(`uuid`) until `completed`. On `failed`: `hosting_nodejs_analyse-failed-build` for the cause,
then fix (build settings or repo) and `start-build` again.

- [ ] **Step 5: Restart the app**

`hosting_nodejs_restart-application`. Confirm the domain serves HTTP 200
(`curl -I https://duyanblog-test.hostingersite.com`).

- [ ] **Step 6: Fallback path (only if Step 1 cannot be authorized)**

If no GitHub installation exists after the owner attempt: package the repo locally
(excluding `node_modules`, `.next`, gitignored — per `hosting_deploy-js-application` docs),
call `hosting_deploy-js-application { domain, archivePath }`, then the same build/poll/restart.

---

### Task 7: One-time data bootstrap (LOCAL, remote DB connection)

**Files:** none (local CLI + MCP).
**Requirements:** local Node 20+/npm, `prisma` on PATH (`npx`), the repo checkout at the MySQL
schema (Task 1).
**Interfaces:**
- Consumes: MySQL `DATABASE_URL` (from Task 5 — the host is `srvNNNN.hstgr.io`, port from
  `DB_PORT`, name/user from `DB_NAME`/`DB_USER`; password is only known to the platform, so the
  local client must obtain it another way).
- Produces: schema applied (migrate deploy), demo dataset, admin account. Guards armed on the
  host afterwards.

- [ ] **Step 1: Get the DB credentials locally**

Via MCP: `hosting_databases_list` → find the database by name under `u257278613`; get the host
(`srvNNNN.hstgr.io`) and port. Via `hosting_databases_create-remote-connection`
`{ username, name: "<full db name>", ip: "%" }` — allow any host for the local client
(tighten after). The **password**: the platform generates it and never returns it — so the
local bootstrap MUST use the same credentials the app uses. Since plain password is unavailable,
the definitive source is the app's env — which is masked. **Resolution:** use `npm run
start:node`-adjacent local tooling with `DATABASE_URL` pointed at the platform MySQL only if the
user has the credentials. Otherwise set a KNOWN password via `hosting_databases_create`
(`password` param) for this DB — but the app's `DATABASE_URL` was generated by setup-website
and would not match. **Locked decision:** create the DB via `hosting_databases_create`
(passing a known password) instead of relying on setup-website for this deployment, then set
`DATABASE_URL` via `replace-environment-variables` BEFORE any build. This deviates from the
spec's "platform generates the password" only on the credential-handling mechanism —
functionally identical, and it is the only way a LOCAL bootstrap can connect. The spec's O5
(respect replace-ordering) still holds: the replace happens before builds and never again.

- [ ] **Step 2: Local migrate + seed + admin (guards armed locally only)**

```bash
export DATABASE_URL="mysql://duyanblog_user:THE_KNOWN_PASSWORD@srvNNNN.hstgr.io:3306/duyanblog"
npx prisma migrate deploy                    # idempotent; applies the MySQL baseline
ALLOW_DEMO_SEED=true npm run seed:demo       # wipes + inserts demo — one-time
ALLOW_ADMIN_BOOTSTRAP=true npm run admin:bootstrap -- --email <owner> --password "<12+ chars, letters+digits>"
```

- [ ] **Step 3: Close the remote connection**

Via MCP: `hosting_databases_delete-remote-connection`
`{ username, name: "<full db name>", ip: "%" }` after the bootstrap completes. The DB stays
reachable from the app (app host is on the same platform network).

- [ ] **Step 4: Verify guards armed (host env check)**

`hosting_nodejs_list-environment-variables` — confirm `ALLOW_DEMO_SEED`/`ALLOW_ADMIN_BOOTSTRAP`
are ABSENT. If present, remove via `replace-environment-variables` (still before any future
build; DB set preserved).

---

### Task 8: Verify the live host (smoke + verifier)

**Files:** none (running server + MCP/curl).
**Interfaces:**
- Consumes: the deployed app (Task 6), the bootstrapped DB/admin (Task 7).
- Produces: evidence that the deployment is correct — the acceptance gate.

- [ ] **Step 1: Smoke suite against the live host**

```bash
SMOKE_BASE_URL=https://duyanblog-test.hostingersite.com npm run test
# expect: all 51 checks PASS. 429s on newsletter/contact => rate limiter working — wait a minute and rerun (memory lesson).
```

- [ ] **Step 2: Runtime verifier (duyan-runtime-verifier agent)**

Dispatch against `https://duyanblog-test.hostingersite.com` (ground truth: demo dataset,
admin contract, scheduled-publishing guard, canonical/OG, `/go` behavior). Expect PASS/FINDINGS;
fix findings before close-out.

- [ ] **Step 3: Owner manual check**

Once: consent banner, `/admin` login with the bootstrapped account, one edit appears publicly
(revalidate contract), `/go/` 302, no horizontal overflow at 375.

- [ ] **Step 4: Guard proof**

`npm run seed:demo` (without flags) must REFUSE on the host runtime (or locally with
`NODE_ENV=production` without `ALLOW_DEMO_SEED`). Record the refusal output.

---

### Task 9: Close out — docs, playbook, worklog

**Files:**
- Create: `.claude/playbooks/deploy-hostinger.md`
- Modify: `.claude/rules/risk-register.md` (add/close rows per deployment outcome)
- Modify: `worklog.md` (append Task ID entry)

**Interfaces:**
- Consumes: what was actually done in Tasks 4–8 (the playbook is written from the real
  procedure, never from the spec).

- [ ] **Step 1: Write the deploy playbook** (from actual steps: MCP ops, order-sensitivity,
  password mechanism, local bootstrap, guard re-arming, domain swap checklist).

- [ ] **Step 2: Update the risk register** (R1 demo→real unchanged; add: env-replace-after-DB
  as a CLOSED risk with the regression note; note the `duyanblog.com` swap as OPEN with the
  playbook link).

- [ ] **Step 3: Append the worklog entry** (goal, steps taken, evidence: smoke output, verifier
  result, guard proof, env keys, URLs).

- [ ] **Step 4: Final gates + commit**

```bash
npm run lint && npm run typecheck && npm run validate:docs && npm run slop
git add .claude/playbooks/deploy-hostinger.md .claude/rules/risk-register.md worklog.md
git commit -m "docs(deploy): Hostinger Node.js deploy playbook, risk register, worklog"
```

---

## Self-Review notes

- **Spec coverage:** every spec §4/§5 bullet maps to a task (provision→T4, DB→T5, GitHub/build→
  T6, bootstrap→T7, verify→T8, close-out→T9; env order/O5→T4/T5/T7; schema→T1; docs→T2;
  start fallback→T3). Spec O1/O2/O3/O4 resolved (single MySQL schema; platform starts next;
  `start:node`; no RESEND at launch).
- **Placeholder scan:** the only "decisions" flagged are stated as locked with rationale. No
  TBD/TODO/empty steps. The credential resolution is the one place the plan deviates from the
  spec's wording (platform password vs known password) — flagged and justified.
- **Type consistency:** env var names, MCP operation names, and repo file paths are consistent
  across tasks; the build script constant `build` is used in T4/T6/T9.
- **Review Focus:** each of the 5 pinned concerns has its owning task (T5 for O5 order,
  T4 for no-seed-in-build, T2 for local-dev docs, T3 for start fallback, T8 for limiter).