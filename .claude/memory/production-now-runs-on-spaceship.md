---
name: production-now-runs-on-spaceship
description: duyanblog.com production runs on Spaceship Web Hosting Pro (CloudLinux Node.js app); Hostinger duyanblog-test.hostingersite.com is rollback/reference only. Indexing stays disabled (ALLOW_INDEXING=false) until real content launch review. Production never receives demo seed.
metadata:
  type: lesson
---

## What happened

Deployment moved from the client's Hostinger Business plan to **Spaceship Web Hosting Pro**
(CloudLinux Node.js application, Node 22.23.3, supported cPanel Node selector). `https://duyanblog.com`
is live; the Hostinger subdomain `duyanblog-test.hostingersite.com` is **rollback/reference only**.

Operational facts that are durable, not reconstructable from git alone:

- Production domain is Spaceship (`duyanblog.com`); Hostinger account is rollback/reference — **do not touch it**.
- Indexing is intentionally disabled: `ALLOW_INDEXING=false` (robots.ts is fail-closed; only the real deployed host with the env flag set exposes the index). Do **not** enable until the real-content launch review passes.
- Production must **never receive demo seed or unintended demo editorial data**; no demo content has ever been seeded there.
- Production schema is managed only by canonical Prisma migrations; deploy/build uses `prisma migrate deploy`; never rewrite an applied migration (build script in `package.json` is authoritative).
- `experimental.cpus: 2` is merged on `main` and validated on Spaceship (shared-hosting LVE limit).

## The lesson

- Spaceship, not Hostinger, is the current deployment target. Any playbook/step that says
  "deploy to Hostinger" is referring to the rollback/reference platform.
- Never seed demo content into production, and never loosen the `ALLOW_INDEXING` flag before the
  content-launch review. The robots.ts fail-closed default is the safety net.

## State now

Indexing gate: content launch review → `ALLOW_INDEXING=true`. Related: [[a-dev-confirm-url-leaks-with-console-transport]]
(newsletter truthful/disabled is another launch gate).