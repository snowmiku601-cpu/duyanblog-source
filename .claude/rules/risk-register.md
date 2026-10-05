# Risk register — known risks, measured

The live backlog: most "improvements" are known, measured, blocked on something not
code. Re-derive, never copy. Risks leave only when fixed+verified or accepted with a
date; an audit scoring a known risk PASS is a register bug.

## OPEN

| # | Risk | Current state | Measured how | Blocker that is not code |
|---|---|---|---|---|
| R1 | **Seeded demo shipped as real** | 6 articles, 3 authors, 7 merchants; `demo_mode=true` | `grep -c demo_mode prisma/seed.ts` | Owner decision; swap in AFFILIATE_INTEGRATION.md |
| R2 | **Admin edit invisible after mutation** | `revalidatePath`+`invalidateSettingsCache` contract; not mechanically enforced | Manual; [[a-admin-edit-invisible-without-revalidate]] | Probe needs an admin session |
| R3 | **Scheduled story leaks to a public surface** | `liveDateGuard()` in all 9 fetchers + feeds + sitemap | `grep -rn liveDateGuard src/` | Needs content-level probe; smoke checks status only |
| R4 | **`@theme inline` colour drift** | Tokens in `globals.css`; `:root` colour without `--color-*` compiles to nothing | Visual render 1280/375 both themes | No automated token check |
| R5 | **`.env.example` backsliding** | Recreated 2026-10-04 | `test -f .env.example` in validate-docs | None — gate check |
| R6 | **Config rot in `.claude/`** | Budget ratchet + validation | `node scripts/validate-docs.mjs` | Script must exist first |
| R7 | **`duyanblog.com` unregistered; temp subdomain** | Live `duyanblog-test.hostingersite.com` (demo) | `curl https://duyanblog-test.hostingersite.com/` | Owner registers domain; swap in `playbooks/deploy-hostinger.md` |

## CLOSED

| # | Risk | Closed when | Regression test kept |
|---|---|---|---|
| C1 | **Stray `download/` + root PNG** | 2026-10-04 clean | `.gitignore` no `download` exemption; root list re-derive with `ls` |
| C2 | **`.claude/` silently untracked** | 2026-10-04 (bare `.claude` line) | `git check-ignore .claude/CLAUDE.md` exit 1; `settings.local.json` exit 0 |
| C3 | **Env replace drops `DB_PASSWORD`** | 2026-10-04 | Playbook #1; regression: `/` 500s Prisma auth |
| C4 | **Build before migrate → P0001** | 2026-10-04 | Playbook #2; regression: "table does not exist" |
| C5 | **Turbopack panic (globals.css)** | 2026-10-04 (cc4769d) | Build script `next build --webpack`; regression: panic log |

## OWNED DECISIONS

Owner's calls recorded so no future session re-implements the alternative.

| # | Decision | Default today | Reversible how |
|---|---|---|---|
| D1 | **AI-crawler blocking** via robots.txt | **Allow** (owner has not decided; no bot arrays, no `BLOCK_AI_CRAWLERS` code) | Add a single `robots.ts` group later — robots-only, never Terms-enforcement |