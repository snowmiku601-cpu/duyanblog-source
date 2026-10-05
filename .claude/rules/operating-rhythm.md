# Operating rhythm — session start, the gate, drift checks, session end

The frame around every session. A rule nobody can run is worse than no rule, because it makes
the ones beside it look optional too — every step below is a command or a yes/no question.

## Session start (in order)

1. Read this repo's memory index (`.claude/memory/README.md`) and the user-scope store index
   (`C:\Users\PC\.claude\projects\e--duyanblog-source\memory\MEMORY.md`) — hooks, not contents.
2. `git status` and `git log --oneline -5` — know the drift before you add to it.
3. Read the ONE rule the task needs (index in `.claude/CLAUDE.md`), not all of them.
4. Tail of `worklog.md` — the conventions from the last round.

## Superpowers — process aid

Use an installed `superpowers:*` skill when it matches the job: brainstorming → plans → execute,
systematic-debugging, TDD, verification-before-completion, review before merge. Smallest fit.
**Duyan governance precedes Superpowers** — rules/playbooks beat a generic Superpowers step; the
two-agent cap, one reviewer and the gates still bind.

Run the gate in `.claude/CLAUDE.md` before any commit/push and `npm run validate:docs` before
reporting (auto-load budget + links + indexes). Verification claims include the exact command,
its output and exit code — `tsc` alone is not sufficient.

## Drift check (when you catch yourself about to skip a step)

Ask the five questions:

1. Did I run the gate, or did I push on a green `tsc` alone?
2. Did I verify on the **rendered** page, or did I grep `src/` and call it done?
3. Did I read the file before editing it, in this session?
4. Did I ask the owner about a schema/seed/prod-visible change, or did I decide it for them?
5. Did I check the control that must NOT match, or only the one that must?

*"I'll fix it later"* · *"I don't need to check"* · *"Let me just hardcode this one thing"* ·
*"It's just a demo change"* — hearing yourself say any of these means stop.

## Session end

1. New lesson learned this session? Write the memory file (one fact, named after the fact) and
   the index line, and link it back from the rule it belongs to.
2. The task changed behaviour or conventions? Update the root doc (`ARCHITECTURE.md`,
   `README.md`, `SEO_GUIDE.md`, …) in the same commit — stale docs are how the next session
   gets lost.
3. Append a `Task ID: N` entry to `worklog.md` — built, changed, validation results,
   recommended next steps. That is the repo's institutional memory.
4. Commit one concern per commit, English message, attribution line per the system reminder.