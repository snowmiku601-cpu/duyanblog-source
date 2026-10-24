# Operating rhythm — session start, the gate, drift checks, session end

Every session follows these gates.

## Secret-output gate — all tools

Never dump env/config, DB URLs, passwords or tokens via CLI/MCP, stdout/stderr,
shell history, logs, prompts or commits (including `grep DATABASE_URL`, `printenv`,
`cat` of secret files or shell tracing). No secrets in tool arguments or responses.
Read/write secrets only within trusted protected processes; report booleans only.
If exposed, stop and rotate per `.claude/playbooks/db-and-cache.md`.

## Session start (in order)

1. Read this repo's memory index (`.claude/memory/README.md`) and the user-scope store index
   (`C:\Users\PC\.claude\projects\e--duyanblog-source\memory\MEMORY.md`) — hooks, not contents.
2. `git status` and `git log --oneline -5` — know the drift before you add to it.
3. Read the ONE rule the task needs (index in `.claude/CLAUDE.md`), not all of them.
4. Tail of `worklog.md` — the conventions from the last round.

## Superpowers — process aid

Use the smallest fitting `superpowers:*` skill for plan, debug, TDD, verify or review.
**Duyan governance overrides generic skills**; two-agent cap, one reviewer and gates still bind.

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

1. New lesson? Record one fact in a named memory file, index it and link from its rule.
2. Changed behaviour or convention? Update the relevant root doc in the same commit.
3. Append a `Task ID: N` entry to `worklog.md` — built, changed, validation results,
   recommended next steps. That is the repo's institutional memory.
4. Commit one concern per commit, English message, attribution line per the system reminder.