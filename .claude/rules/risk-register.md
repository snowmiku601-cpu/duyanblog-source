# Risk register — known risks, measured

The live backlog of what can bite this project. Read before proposing any "improvement": most
improvements an agent proposes here are already known, already measured, and blocked on
something that is not code.

## How this file works

- **Every number carries the command that produced it. Re-derive, never copy.** A number pasted
  from another line is a rumor with digits attached — and every doc in a sibling repo drifted
  exactly that way.
- **A risk leaves this file only when fixed and verified, or when a human records
  accept-the-risk with a date.** "No decision recorded" is not acceptance.
- **An audit that scores a known risk as PASS is a register bug**, not a clean bill.

## OPEN

| # | Risk | Current state | Measured how | Blocker that is not code |
|---|---|---|---|---|
| R1 | **Seeded demo content shipped as real** | 6 fictional articles, 3 demo authors, 7 fictional merchants/offers; `demo_mode=true`, `DemoNotice` on pages | `grep -c demo_mode prisma/seed.ts`; page render check | Owner decision to go real; content swap is documented in `AFFILIATE_INTEGRATION.md` |
| R2 | **Admin edit invisible after mutation** | Contract exists (`revalidatePath` + `invalidateSettingsCache`) but nothing enforces it mechanically | Manual; see [[a-admin-edit-invisible-without-revalidate]] | A probe that mutates-and-fetches would need an admin session |
| R3 | **Scheduled story leaks to a public surface** | `liveDateGuard()` composed into all 9 fetchers + feeds + sitemap | `grep -rn liveDateGuard src/` — each surface must use it | Smoke checks status only; content-level assertion needs a probe (see CLAUDE.md) |
| R4 | **`@theme inline` colour drift** | Tokens in `src/app/globals.css`; a `:root` colour without its `--color-*` line compiles to nothing | Visual render check at 1280/375 both themes | No automated token check |
| R5 | **`.env.example` backsliding** | Recreated 2026-10-04 after being missing while 8+ docs/code pointed at it | `test -f .env.example` in validate-docs | Nothing — it is a gate check |
| R6 | **Config rot in `.claude/`** — rules grow, links die, memory orphans | Budget ratchet + validation checks being added | `node scripts/validate-docs.mjs` | The script itself must exist first |

## CLOSED

| # | Risk | Closed when | Regression test kept |
|---|---|---|---|
| C1 | **Stray `download/` folder + artifact PNG at repo root** | 2026-10-04 (initial commit cleanup) | `.gitignore` has no `download` exemption; repo root list is 22 files — re-derive with `ls` before trusting |
| C2 | **Whole `.claude/` silently untracked** | 2026-10-04 (bare `.claude` gitignore line was excluding everything; fixed + verified with `git check-ignore`) | `git check-ignore .claude/CLAUDE.md` must exit 1; `git check-ignore .claude/settings.local.json` must exit 0 |