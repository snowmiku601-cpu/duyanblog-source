# Memory index

Durable lessons for this project. **This directory does NOT auto-load** — sessions find entries
here on purpose, via this index. The auto-loading memory store is the user-scope
`C:\Users\PC\.claude\projects\e--duyanblog-source\memory\`; see `.claude/CLAUDE.md` "Session
end" for which store gets what.

## The rules

- **One fact per file, named after the fact** (`a-dev-server-reaping-on-windows.md`, not
  `2026-10-04-notes.md`). If the file could be reconstructed from `git log --stat`, delete it.
- **Write what you LEARNED, not what you did** — a fact is something that would have changed how
  the next session starts.
- Every entry links to its relatives with `[[wikilink]]`; a new entry links back from the rule
  it belongs to in the same commit (orphan files are where lessons die).
- An entry that becomes a rule gets retired from here (the rule is the shorter form).

## Index

| File | Hook |
|---|---|
| [a-dev-server-reaping-on-windows.md](a-dev-server-reaping-on-windows.md) | "fetch failed" storm = server died, not the app. Restart, don't debug. |
| [a-newsletter-rate-limiter-is-the-feature.md](a-newsletter-rate-limiter-is-the-feature.md) | A 429 on newsletter/contact checks is the guard working. Wait a minute. |
| [a-png-extension-must-match-bytes.md](a-png-extension-must-match-bytes.md) | Next optimizer 400s when bytes ≠ extension; every /images file was once JPEG-as-.png. |
| [a-admin-edit-invisible-without-revalidate.md](a-admin-edit-invisible-without-revalidate.md) | Edit "didn't save"? Missing revalidatePath()/invalidateSettingsCache(), not a DB bug. |
| [a-dev-confirm-url-leaks-with-console-transport.md](a-dev-confirm-url-leaks-with-console-transport.md) | confirmUrl in a response = proof no real email was sent. Drop it, don't extend it. |