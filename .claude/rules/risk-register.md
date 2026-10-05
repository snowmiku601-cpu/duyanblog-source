# Risk register — known risks, measured

The live backlog: most "improvements" are known, measured, blocked on something
not code. Re-derive, never copy. Risks leave only when fixed+verified or accepted.

## OPEN

| # | Risk | Current state | Measured how | Blocker that is not code |
|---|---|---|---|---|
| R1 | **Seeded demo shipped as real** | 6 articles, 3 authors, 7 merchants; `demo_mode=true` | `grep -c demo_mode prisma/seed.ts` | Owner; swap in AFFILIATE_INTEGRATION.md |
| R2 | **Admin edit invisible after mutation** | `revalidatePath`+`invalidateSettingsCache`; manual | [[a-admin-edit-invisible-without-revalidate]] | Needs admin probe |
| R3 | **Scheduled story leaks to public surface** | `liveDateGuard()` in all 9 fetchers + feeds + sitemap | `grep -rn liveDateGuard src/` | Needs content probe |
| R4 | **`@theme inline` colour drift** | Tokens in `globals.css`; `:root` colour w/o `--color-*` compiles to nothing | Visual render 1280/375 | No automated check |
| R5 | **`.env.example` backsliding** | Recreated 2026-10-04 | `test -f .env.example` | None — gate |
| R6 | **Config rot in `.claude/`** | Budget ratchet + validation | `node scripts/validate-docs.mjs` | Script must exist |
| R7 | **`duyanblog.com` unregistered; temp subdomain** | Live duyanblog-test.hostingersite.com (demo) | `curl https://duyanblog-test.hostingersite.com/` | Owner registers domain; playbook |

## CLOSED

| # | Risk | Closed when | Regression test kept |
|---|---|---|---|
| C1 | **Stray `download/` + root PNG** | 2026-10-04 clean | `.gitignore` no `download` exemption; `ls` |
| C2 | **`.claude/` silently untracked** | 2026-10-04 (bare `.claude` line) | `git check-ignore .claude/CLAUDE.md` exit 1 |
| C3 | **Env replace drops `DB_PASSWORD`** | 2026-10-04 | Playbook #1; `/` 500s Prisma auth |
| C4 | **Build before migrate → P0001** | 2026-10-04 | Playbook #2; "table does not exist" |
| C5 | **Turbopack panic (globals.css)** | 2026-10-04 (cc4769d) | `next build --webpack`; panic log |
| C6 | **Search `take:100`+JS filter ceiling** | 2026-10-05 (Task 20) | smoke `?q=` empty-on-demo; `searchArticles` LIMIT 30 |
| C7 | **Newsletter fake `{ok:true,emailed:false}`** | 2026-10-05 (Task 21) | smoke prod-like 503 no-provider; 0 ghost rows |
| C8 | **Prod media uploads lost on rebuild** | 2026-10-05 (Task 22) | upload 403 w/o `MEDIA_PERSISTENT`; banner |
| C9 | **Soft-404: loading.tsx Suspense ate notFound()** | 2026-10-05 (83d4477) | smoke 6 bogus `[slug]` routes → 404 |
| C10 | **Newsletter limiter forgeable via x-real-ip** | 2026-10-05 (83d4477) | smoke fixed-header 6th req → 429; global bucket |

## OWNED DECISIONS

Owner's calls so no future session re-implements the alternative.

| # | Decision | Default today | Reversible how |
|---|---|---|---|
| D1 | **AI-crawler blocking** via robots.txt | **Allow** (no bot arrays) | Single `robots.ts` group later — robots-only |