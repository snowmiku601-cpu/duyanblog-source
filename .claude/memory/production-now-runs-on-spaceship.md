---
name: production-now-runs-on-spaceship
description: duyanblog.com production runs on Spaceship Web Hosting Pro (CloudLinux Node.js app); Hostinger duyanblog-test.hostingersite.com is rollback/reference only. Indexing is ENABLED since Task 42 (ALLOW_INDEXING=true). Production never receives demo seed.
metadata:
  type: lesson
---

## What happened

Deployment moved from the client's Hostinger Business plan to **Spaceship Web Hosting Pro**
(CloudLinux Node.js application, Node 22.23.3, supported cPanel Node selector). `https://duyanblog.com`
is live; the Hostinger subdomain `duyanblog-test.hostingersite.com` is **rollback/reference only**.

Operational facts that are durable, not reconstructable from git alone:

- Production domain is Spaceship (`duyanblog.com`); Hostinger account is rollback/reference — **do not touch it**.
- Indexing is ENABLED since Task 42 (2026-10-07): `ALLOW_INDEXING=true` in the Spaceship
  node-selector env; robots.txt exposes `Allow: /` with `/admin /admin/ /api/ /go/ /search`
  disallowed and the sitemap+host declared. Reversal (rollback) requires setting the flag back
  to false AND a rebuild+restart — robots.ts reads the flag into the built app, so env-only
  changes have no effect.
- Production must **never receive demo seed or unintended demo editorial data**; no demo content has ever been seeded there.
- Production schema is managed only by canonical Prisma migrations; deploy/build uses `prisma migrate deploy`; never rewrite an applied migration (build script in `package.json` is authoritative).
- `experimental.cpus: 2` is merged on `main` and validated on Spaceship (shared-hosting LVE limit).

## The lesson

- Spaceship, not Hostinger, is the current deployment target. Any playbook/step that says
  "deploy to Hostinger" is referring to the rollback/reference platform.
- Never seed demo content into production. The `ALLOW_INDEXING` flag (robots.ts fail-closed
  default = false) is the switch that exposes the index; it is now true in production by owner
  decision (Task 42).

## State now

Indexing: ENABLED (Task 42 complete) — the launch cluster (3 canonical articles) is open to
crawlers. Related: [[a-dev-confirm-url-leaks-with-console-transport]]
(newsletter truthful/disabled is another launch gate).