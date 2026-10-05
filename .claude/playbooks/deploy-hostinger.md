<!-- PLAYBOOK — not auto-loaded; read on demand per .claude/playbooks/README.md -->

# Deploy duyanblog to Hostinger Business (Node.js web app)

**Verified 2026-10-04.** This playbook is what was actually done to run
`duyanblog-test.hostingersite.com` on the client's Hostinger Business plan (order
`1009151112`, account `u257278613`) — the real procedure, including the four build failures
that taught it. The spec/plan documents (`docs/superpowers/specs|plans/2026-10-04-*`) are the
reasoning; this is the how.

## The setup that now exists

| Thing | Value |
|---|---|
| Website | `duyanblog-test.hostingersite.com` (addon on order 1009151112) |
| DB | `u257278613_duyanblog` on `srv2123.hstgr.io:3306` (MySQL, app host `127.0.0.1`) |
| App env | `NODE_ENV=production`, `NEXT_PUBLIC_SITE_URL=https://duyanblog-test.hostingersite.com`, `DATABASE_URL` + `DB_*` (127.0.0.1), **no `ALLOW_*`** |
| Build | archive deploy (`hosting_deploy-js-application`), node 20 (host auto), webpack, `npm run build` |
| Source deploy | `git archive --format=zip --output=duyanblog-source.zip HEAD` → upload → build |
| Admin | `editor@duyanblog.test` (temporary; replace before real go-live) |

## Non-negotiables (each one cost a failed build or would have)

1. **Env is written ONCE.** `replace-environment-variables` set the full set before the first
   build; **never call it again** — the DB password lives only in those env vars and is not
   recoverable. A re-replace drops `DB_PASSWORD` and kills the app.
2. **Migrate BEFORE every build.** `next build` prerenders the `revalidate=N` pages and
   queries the DB — an unmigrated DB fails the build (P0001). Every deploy: open a remote
   rule, `npx prisma migrate deploy` against `srvNNNN`, close the rule, then build.
3. **Seed never runs in the build pipeline and never again after go-live** — it is
   wipe-and-insert (deletes subscribers, contacts, everything). One-time, local, before the
   site serves.
4. **Production deps only on the host.** The host installs `dependencies`, not
   `devDependencies`. Anything needed at build/runtime lives in `dependencies`
   (`@tailwindcss/postcss`, `tailwindcss`, `tw-animate-css` are there because each omission
   failed a build). TypeScript/tsx/eslint can stay dev-only.
5. **Webpack, not Turbopack.** Turbopack panics parsing `globals.css` in the sandboxed build
   (`node worker exits`) — `next build --webpack` is the working build.
5b. **`TRUST_PROXY` is only set after the edge contract is verified.** The rate limiter
   ignores client-supplied `X-Forwarded-For` by default (it is forgeable). If this deployment
   needs real visitor IPs behind the Hostinger edge, FIRST confirm the edge overwrites or
   strips client-supplied forwarding headers (test with `curl -H "X-Forwarded-For: 1.2.3.4"`),
   then set `TRUST_PROXY=true`. Until verified, login is still protected by per-email and
   process-global buckets regardless of IP attribution.
5c. **`ALLOW_INDEXING=true` is set ONLY on the real production domain** (build-time). The demo
   subdomain and any preview/localhost must leave it unset so `robots.txt` serves a full
   `Disallow: /` — fictional demo content is never indexed as production editorial.
5d. **`MEDIA_PERSISTENT=true` is set ONLY on deployments that persist the app dir.** CMS
   uploads write to `<cwd>/public/images` (inside the app dir). The archive deploy overwrites
   the app dir on rebuild, so without this flag uploaded media vanishes on the next deploy.
   Default (flag unset) on the host = production CMS uploads are refused (403) and editorial
   media lives in Git. **Future durable path (deferred, no code):** move uploads to object
   storage (S3/R2) + CDN and swap `src/app/api/admin/media/route.ts` internals — the byte-sniff
   validation and `public/images` consumer contract stay; see ARCHITECTURE.md §10.
6. **App DB host is `127.0.0.1`; local tooling uses `srvNNNN.hstgr.io`** with a temporary
   remote rule (`ip %`), closed after use. They are different URLs by design.
7. **`ALLOW_DEMO_SEED` / `ALLOW_ADMIN_BOOTSTRAP` never appear in the host env.** They are set
   only on the local bootstrap invocation (with `NODE_ENV=production` so the guard actually
   exercises).

## Deploy procedure (update after a repo change)

```bash
# 0. gates
npm run lint && npm run typecheck && npm run validate:docs && npm run slop
git push origin main

# 1. migrate (local, remote window; schema is MySQL-canonical, one baseline)
#    MCP: hosting_databases_create-remote-connection {username, name:"u257278613_duyanblog", ip:"%"}
export DATABASE_URL="mysql://u257278613_duyanblog:<PASSWORD>@srv2123.hstgr.io:3306/u257278613_duyanblog"
npx prisma migrate deploy
#    MCP: hosting_databases_delete-remote-connection {username, name, ip:"%"}

# 2. build + upload
git archive --format=zip --output=duyanblog-source.zip HEAD
#    MCP: hosting_deploy-js-application {domain:"duyanblog-test.hostingersite.com",
#         archivePath:"E:/duyanblog-source/duyanblog-source.zip"}
#    MCP: hosting_list-js-deployments (poll until completed; failed → build-logs)

# 3. verify
SMOKE_BASE_URL=https://duyanblog-test.hostingersite.com npm run test   # 51 checks
curl -s https://duyanblog-test.hostingersite.com/ | grep -c auralis     # content, not placeholder
```

## Credential handling

- DB password: generated locally (alphanumeric), stored in local `.env` only; given to the
  owner. Percent-encode `@ # % / space` in the URL.
- Admin password: set once via bootstrap; never printed. Owner changes it after login.

## `duyanblog.com` swap (when the owner registers the domain)

1. Register the domain.
2. Hostinger: add/park `duyanblog.com` on the website (hPanel or `hosting_websites_*`).
3. Point DNS at Hostinger; wait for TLS.
4. **Rebuild** with `NEXT_PUBLIC_SITE_URL=https://duyanblog.com` — wait, env is write-once:
   this is the ONE legitimate exception; do it carefully as a full replace preserving the DB
   set, then rebuild. (Alternative: ask the platform to keep the DB env and only change the
   URL var — the playbook records that Hostinger's replace deletes omitted vars, so send the
   whole set with the new URL.)
5. Verify `/` + smoke + verifier against the new origin.
6. Redirect the old subdomain to the new domain (hosting-level redirect).

## Rollback

- **Code:** `git revert <commit>` then redeploy (migrate first!). DB untouched.
- **Website/DB:** delete via MCP (`hosting_websites_delete` / `hosting_databases_delete`) —
  irreversible, and the DB password is in the env; a re-create needs a fresh password + env
  write (before any build).

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
  Dev/non-production may echo `confirmUrl` via the console transport. Set `RESEND_API_KEY` +
  `EMAIL_FROM` for live confirmations; until then signups are declined honestly.
- Media uploads in production are refused (403) unless `MEDIA_PERSISTENT=true` (Correction 15).
  On the archive deploy (rebuild wipes the app dir) leave it unset and manage media via Git.