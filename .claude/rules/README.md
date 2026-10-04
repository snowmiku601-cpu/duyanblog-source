# Rules index

Six rules. Read the one your task needs, not all of them — only `CLAUDE.md` and this directory's
names load automatically; the files below are on demand. Re-derive counts rather than trusting
them: `ls .claude/rules/*.md | grep -v README | wc -l`.

| File | Read before | The one line that matters |
|---|---|---|
| [`content-integrity.md`](content-integrity.md) | writing any content, number, claim, or demo-bound data | **A placeholder is a fabrication with a deadline you will forget.** |
| [`admin-safety.md`](admin-safety.md) | touching auth, admin routes, production guards, sessions | **The guards are the safety net; mutating without `revalidatePath()` ships invisible edits.** |
| [`db-and-cache.md`](db-and-cache.md) | any Prisma model, migration, seed, ISR/revalidate decision | **`liveDateGuard()` composes into every public surface; an unguarded new surface leaks scheduled stories.** |
| [`windows-traps.md`](windows-traps.md) | any multi-line shell work, path juggling, PowerShell/Bash mixing | **Never run a multi-string replace through the shell — use the Edit tool.** |
| [`agent-routing.md`](agent-routing.md) | launching any subagent | **The cap is two. It beats any session default that says otherwise.** |
| [`design-and-seo.md`](design-and-seo.md) | any visual, token, metadata, schema or SEO decision | **A `:root` colour without its `@theme inline` `--color-*` line compiles to nothing, silently.** |

## The two that will actually bite on this project

1. **`admin-safety.md` §5** — an admin mutation without `revalidatePath()` is invisible for up
   to 300 s and nobody will tell you it is your fault.
2. **`windows-traps.md` A2** — the multi-string-replace-through-PowerShell bug rewrote letters
   across four pages on a sibling repo, and only git recovery found it.

## Where the rules came from

Most of these are distilled from two sibling sites (jellymark, thesmartaistack) where every
failure described actually shipped: fabricated ratings on hundreds of indexed pages, a `:root`
colour that compiled to nothing for months, a multi-character replace that corrupted imports, and
a session preset that overrode the two-agent cap into a 74-agent workflow. Installing them here
is cheap and the repo is small; the sibling costs were not.