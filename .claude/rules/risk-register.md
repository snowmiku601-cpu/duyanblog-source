# Risk register — known risks, measured

The live backlog: most "improvements" are known, measured, blocked on something not
code. Re-derive, never copy. Risks leave only when fixed+verified or accepted with a date.

## OPEN

| # | Risk | Current state | Measured how | Blocker that is not code |
|---|---|---|---|---|
| R1 | **Seeded demo shipped as real** | 6 articles, 3 authors, 7 merchants; `demo_mode=true` | `grep -c demo_mode prisma/seed.ts` | Owner decision; swap in AFFILIATE_INTEGRATION.md |
| R2 | **Admin edit invisible after mutation** | `revalidatePath`+`invalidateSettingsCache` contract; manual | [[a-admin-edit-invisible-without-revalidate]] | Probe needs admin session |
| R3 | **Scheduled story leaks to public surface** | `liveDateGuard()` in all 9 fetchers + feeds + sitemap | `grep -rn liveDateGuard src/` | Needs content-level probe; smoke status-only |
| R4 | **`@theme inline` colour drift** | Tokens in `globals.css`; `:root` colour w/o `--color-*` compiles to nothing | Visual render 1280/375 both themes | No automated check |
| R5 | **`.env.example` backsliding** | Recreated 2026-10-04 | `test -f .env.example` | None — gate check |
| R6 | **Config rot in `.claude/`** | Budget ratchet + validation | `node scripts/validate-docs.mjs` | Script must exist first |
| R7 | **`duyanblog.com` unregistered; temp subdomain** | Live `duyanblog-test.hostingersite.com` (demo) | `curl https://duyanblog-test.hostingersite.com/` | Owner registers domain; swap in playbook |

## CLOSED

| # | Risk | Closed when | Regression test kept |
|---|---|---|---|
| C1 | **Stray `download/` + root PNG** | 2026-10-04 clean | `.gitignore` no `download` exemption; `ls` root |
| C2 | **`.claude/` silently untracked** | 2026-10-04 (bare `.claude` line) | `git check-ignore .claude/CLAUDE.md` exit 1; `settings.local.json` exit 0 |
| C3 | **Env replace drops `DB_PASSWORD`** | 2026-10-04 | Playbook #1; `/` 500s Prisma auth |
| C4 | **Build before migrate → P0001** | 2026-10-04 | Playbook #2; regression: "table does not exist" |
| C5 | **Turbopack panic (globals.css)** | 2026-10-04 (cc4769d) | Build script `next build --webpack`; regression: panic log |
| C6 | **Search `take:100`+JS filter ceiling** | 2026-10-05 (Task 20) | smoke `?q=` empty-on-demo + `?q=zzz` empty; `searchArticles` LIMIT 30 |
| C7 | **Newsletter fake `{ok:true,emailed:false}`** | 2026-10-05 (Task 21) | smoke prod-like 503 no-provider + 0 ghost rows |
| C8 | **Prod media uploads lost on rebuild** | 2026-10-05 (Task 22) | upload 403 w/o `MEDIA_PERSISTENT`; banner test |

## OWNED DECISIONS

Owner's calls recorded so no future session re-implements the alternative.

| # | Decision | Default today | Reversible how |
|---|---|---|---|
| D1 | **AI-crawler blocking** via robots.txt | **Allow** (no bot arrays; no `BLOCK_AI_CRAWLERS`) | Single `robots.ts` group later — robots-only, never Terms-enforcement |