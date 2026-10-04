# Risk register — known risks, measured

The live backlog of what can bite this project: most "improvements" are known, measured,
blocked on something not code. Re-derive, never copy. Risks leave only when
fixed+verified or accepted with a date; an audit scoring a known risk PASS is a register bug.

## OPEN

| # | Risk | Current state | Measured how | Blocker that is not code |
|---|---|---|---|---|
| R1 | **Seeded demo content shipped as real** | 6 fictional articles, 3 demo authors, 7 fictional merchants; `demo_mode=true` | `grep -c demo_mode prisma/seed.ts`; render | Owner decision; swap in AFFILIATE_INTEGRATION.md |
| R2 | **Admin edit invisible after mutation** | Contract (`revalidatePath` + `invalidateSettingsCache`); not mechanically enforced | Manual; [[a-admin-edit-invisible-without-revalidate]] | Probe needs an admin session |
| R3 | **Scheduled story leaks to a public surface** | `liveDateGuard()` composed into all 9 fetchers + feeds + sitemap | `grep -rn liveDateGuard src/` — each surface must use it | Content-level assertion needs a probe; smoke checks status only |
| R4 | **`@theme inline` colour drift** | Tokens in `src/app/globals.css`; `:root` colour without `--color-*` compiles to nothing | Visual render at 1280/375 both themes | No automated token check |
| R5 | **`.env.example` backsliding** | Recreated 2026-10-04 (was missing while 8+ docs cited it) | `test -f .env.example` in validate-docs | None — gate check |
| R6 | **Config rot in `.claude/`** | Budget ratchet + validation checks | `node scripts/validate-docs.mjs` | The script must exist first |
| R7 | **`duyanblog.com` unregistered; site on temp subdomain** | Live `duyanblog-test.hostingersite.com` (demo, 2026-10-04) | `curl https://duyanblog-test.hostingersite.com/` | Owner registers domain; swap checklist in `playbooks/deploy-hostinger.md`

## CLOSED

| # | Risk | Closed when | Regression test kept |
|---|---|---|---|
| C1 | **Stray `download/` folder + artifact PNG at root** | 2026-10-04 (initial commit cleanup) | `.gitignore` has no `download` exemption; root list is 22 files — re-derive with `ls` |
| C2 | **Whole `.claude/` silently untracked** | 2026-10-04 (bare `.claude` gitignore line excluded everything; fixed + verified) | `git check-ignore .claude/CLAUDE.md` exit 1; `.claude/settings.local.json` exit 0 |
| C3 | **Env replace after the app is live drops `DB_PASSWORD`** | 2026-10-04 (env written once, Task 5) | Playbook §Non-negotiables #1; regression: `/` 500s with Prisma auth errors |
| C4 | **Build before migrate → next build P0001** | 2026-10-04 (deploy 6A before 6B) | Playbook §Non-negotiables #2; regression: build logs show "table does not exist" |
| C5 | **Turbopack panic on the host build (globals.css)** | 2026-10-04 (webpack, cc4769d) | Build script is `next build --webpack`; regression: Turbopack panic log |