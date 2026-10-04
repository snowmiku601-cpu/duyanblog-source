# Playbooks index

Task-scoped procedures, loaded on demand. **This directory does NOT auto-load** — the budget
principle: a content-writing session never pays for a Prisma session's bytes. `CLAUDE.md` and
`.claude/rules/README.md` are the only auto-loading indexes; this file is for humans and the
Validate-docs gate.

| Playbook | Read before | The one line that matters |
|---|---|---|
| [`db-and-cache.md`](db-and-cache.md) | any Prisma model, migration, seed, ISR/revalidate decision | **`liveDateGuard()` composes into every public surface; an unguarded new surface leaks scheduled stories.** |
| [`windows-traps.md`](windows-traps.md) | any multi-line shell work, path juggling, PowerShell/Bash mixing | **Never run a multi-string replace through the shell — use the Edit tool.** |
| [`design-and-seo.md`](design-and-seo.md) | any visual, token, metadata, schema or SEO decision | **A `:root` colour without its `@theme inline` `--color-*` line compiles to nothing, silently.** |

## What graduates where

- A playbook procedure that becomes an invariant graduates to `.claude/rules/`.
- A playbook that becomes history retires to `.claude/archive/`.
- A playbook fact that becomes a lesson moves to `.claude/memory/`.

## Why the split exists

Measured on a sibling project: `.claude/rules/` with 15 files cost every session ~534 KB of
context; the same files moved to a non-loading directory cost ~137 KB. The lever is the
directory name, not the file type — so task-scoped material lives here, and only the six
auto-loading files stay in `rules/`.