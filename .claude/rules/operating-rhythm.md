# Operating rhythm — session start, the gate, drift checks, session end

The frame around every session. A rule nobody can run is worse than no rule, because it makes
the ones beside it look optional too — every step below is a command or a yes/no question.

## Session start (in order)

1. Read this repo's memory index (`.claude/memory/README.md`) and the user-scope store index
   (`C:\Users\PC\.claude\projects\e--duyanblog-source\memory\MEMORY.md`) — hooks, not contents.
2. `git status` and `git log --oneline -5` — know the drift before you add to it.
3. Read the ONE rule the task needs (index in `.claude/CLAUDE.md`), not all of them.
4. Tail of `worklog.md` — the conventions from the last round.

## The gate (before any commit or push)

All four, exit code 0, output pasted when you report:

```bash
npm run lint && npm run typecheck   # 1. fast gates
npm run build                       # 2. standalone build (copy steps are part of it)
npm run test                        # 3. smoke against a RUNNING dev server
node scripts/validate-docs.mjs      # 4. governance gate (once it exists)
```

- `tsc` alone is not sufficient — it never sees a route you forgot to revalidate, a scheduled
  story leaking, or bytes that disagree with an extension.
- A verification claim must include the exact command, its literal output, and the exit code.
  "Looks correct", "should work", "the format is right" are not verification.

## Drift check (when you catch yourself about to skip a step)

Ask the five questions:

1. Did I run the gate, or did I push on a green `tsc` alone?
2. Did I verify on the **rendered** page, or did I grep `src/` and call it done?
3. Did I read the file before editing it, in this session?
4. Did I ask the owner about a schema/seed/prod-visible change, or did I decide it for them?
5. Did I check the control that must NOT match, or only the one that must?

Drift sentences (if you hear yourself, stop): *"I'll fix it later"* · *"I don't need to check"* ·
*"Let me just hardcode this one thing"* · *"It's just a demo change"*.

## Session end

1. New lesson learned this session? Write the memory file (one fact, named after the fact) and
   the index line, and link it back from the rule it belongs to.
2. The task changed behaviour or conventions? Update the root doc (`ARCHITECTURE.md`,
   `README.md`, `SEO_GUIDE.md`, …) in the same commit — stale docs are how the next session
   gets lost.
3. Append a `Task ID: N` entry to `worklog.md` — built, changed, validation results,
   recommended next steps. That is the repo's institutional memory.
4. Commit one concern per commit, English message, attribution line per the system reminder.