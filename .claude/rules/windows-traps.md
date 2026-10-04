# Windows traps — shells, paths, encoding

This repo runs on Windows 10 (PowerShell 5.1 primary, Git Bash available via the Bash tool).
Each entry below has already cost a session somewhere in this house. Read before any multi-line
shell work, path juggling, or PowerShell/Bash mixing.

## A1. PowerShell 5.1 lacks `&&` / `||` chain operators

Every `A; if ($?) { B }` pattern works; `A && B` is a parser error in PS 5.1. Same for ternary
and `??`. Write explicit `if/else`.

## A2. Never run a multi-string find/replace through a shell

PowerShell flattens nested arrays, so a loop over `@( @(a,b) )` pairs gets the *string* and `[0]`
is its first **character** — `String.Replace(char, char)` rewrites one letter everywhere. This
once turned `import Link from "next/link"` into `imporh Link from "nexh/link"` across four pages.
Use the Edit tool with exact `old_string`/`new_string` instead, or a script with a brace-aware
parser. Multi-line strings in PS: use a single-quoted here-string `@'...'@` — the closing
`'@` must be at column 0.

## A3. `Get-Content`/`Out-File` default to the system ANSI codepage

Files other tools will read (JSON, TS) must be written with UTF-8:
`Out-File -Encoding utf8` (and note PS 5.1's utf8 emits a BOM — a plain `utf8` BOM breaks the
first character of some parsers; strip it or use the Write tool for new files).

## A4. Destructive cmdlets prompt

`Remove-Item`, `Stop-Process`, `Clear-Content` in a non-interactive session block or fail.
Add `-Confirm:$false` (and `-Force` for read-only/hidden items) when the intent is certain.

## A5. Native stderr via `2>&1` wraps in ErrorRecord

In PS 5.1, redirecting a native command's stderr wraps each line and sets `$?` false even on exit
0. stderr is captured for you without `2>&1` — do not add it.

## A6. Paths: Git Bash vs PowerShell

- Bash tool is **Git Bash** (POSIX). Use `/e/...` or `"E:\..."` quoting as the tool expects.
- PowerShell prefers `E:\...`; `~` is `C:\Users\PC`.
- `NUL` is a reserved name on Windows: a file named `NUL` (seen on a sibling repo) is a broken
  redirect artifact — delete it and move on, it has no content.

## A7. Dev server habit

`npm run dev` pegs port 3000 and tees to `dev.log`. The sandbox dev server has been reaped
mid-round repeatedly on sibling repos; recover with a restart, and let the smoke suite's
"fetch failed" storm tell you the server died rather than blaming the app. Back-to-back smoke
runs can trip the newsletter rate limiter (5/min/IP → 429) — wait a minute; the limiter is the
feature.