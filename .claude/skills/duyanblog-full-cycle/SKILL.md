---
name: duyanblog-full-cycle
description: Use when a change request spans the whole stack — new route/page, new admin surface, new API, schema change, or a cross-cutting fix on duyanblog.com. Chains the house process: verify baseline, plan, implement, verify (lint/typecheck/smoke), update docs + worklog, commit. Load BEFORE touching code.
---

# Full-cycle change protocol

The house loop for any change that touches more than one layer of this stack. For a single-file
fix the loop still applies, just shorter — the gates are the same.

## Phase 0 — baseline (never skip)

```bash
npm run lint && npm run typecheck   # must be 0/0 BEFORE you start, or any breakage is yours
```

If the dev server is already running (`curl http://localhost:3000` 200), note it; if not, start
`npm run dev` in the background and let `dev.log` settle before Phase 3. Record the baseline in
your head: 0 errors in, must be 0 errors out.

## Phase 1 — plan

- Read the relevant rules first (`rules/` index in `CLAUDE.md`); read `worklog.md` tail for the
  conventions from the last round.
- One concern per change. If the request is three things, do three commits, not one soup.
- If it needs a decision the owner should make (schema break, seed changes, prod-visible
  behaviour), ask before building — one question, options listed.

## Phase 2 — implement

- Read the file in the session before editing it. Match surrounding idiom, comment density, and
  naming.
- Admin mutations: `revalidatePath()` + `invalidateSettingsCache()` when SiteSetting —
  `rules/admin-safety.md` §5.
- Content or metadata: `duyanblog-human-voice` skill before prose, `duyanblog-add-content`
  before content files.
- Never `npm run db:push` without saying so; real schema changes get a migration.

## Phase 3 — verify (evidence before assertions)

1. `npm run lint && npm run typecheck` — 0/0.
2. `npm run test` against the running dev server — all 51 green (wait out the rate limiter if
   429s).
3. If UI/behaviour changed: rendered-page check at 1280 + 375, both themes, console clean —
   `duyan-runtime-verifier` agent for hostile verification, or a browser probe yourself.
4. If the build output matters (server config, env, new deps): `npm run build` then
   `npm start` and one smoke against the standalone.

## Phase 4 — close out

- **Docs**: if behaviour or conventions changed, update the relevant root doc
  (`ARCHITECTURE.md`, `README.md`, `SEO_GUIDE.md`, …) in the same commit — stale docs are how
  the next session gets lost.
- **Worklog**: append a `Task ID: N` entry — what was built, what changed, validation results,
  recommended next steps. That is the repo's institutional memory.
- **Commit**: one concern per commit, message in English, ended with
  `Co-Authored-By: Claude Code <noreply@anthropic.com>`. Push to `origin/main` only when the
  owner asked.

## Red flags (stop and think)

- A gate that was green at Phase 0 goes red in your diff → fix the diff, do not explain it away.
- "It builds" with `npm run build` but the standalone 404s assets → the copy step was skipped;
  `package.json` has it, do not "fix" by editing around it.
- An admin route that skips `guardAdmin`, a fetch that bypasses `liveDateGuard`, a mutation
  without `revalidatePath` — all three are rules with incidents; they are not optimisation
  opportunities.