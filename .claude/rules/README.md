# Rules index

**Only this directory (plus `CLAUDE.md` and `AGENTS.md`) auto-loads every session.** Everything
task-scoped lives in `.claude/playbooks/` — that directory does not load, so a playbook costs
nothing until the task triggers it. Adding a task-scoped file here costs every future session.
The budget below is the ratchet: it comes DOWN, never up.

Re-derive counts rather than trusting them:
`node scripts/validate-docs.mjs` → "auto-load budget".

## The rules (auto-load — trigger by task)

| File | Read before | The one line that matters |
|---|---|---|
| [`content-integrity.md`](content-integrity.md) | writing any content, number, claim, or demo-bound data | **A placeholder is a fabrication with a deadline you will forget.** |
| [`admin-safety.md`](admin-safety.md) | touching auth, admin routes, production guards, sessions | **The guards are the safety net; mutating without `revalidatePath()` ships invisible edits.** |
| [`agent-routing.md`](agent-routing.md) | launching any subagent | **The cap is two. It beats any session default that says otherwise.** |
| [`operating-rhythm.md`](operating-rhythm.md) | starting or ending a session, before any commit/push | **The gate is four commands; a verification claim includes its output. Superpowers is a process aid — Duyan rules precede it.** |
| [`risk-register.md`](risk-register.md) | proposing any "improvement" | **Everything here is already known, measured, and blocked on something that is not code.** |

## The playbooks (on demand — see `.claude/playbooks/README.md` for the index)

`db-and-cache.md` · `windows-traps.md` · `design-and-seo.md` — the incidents and mechanisms that
used to live here moved out so that a content-writing session never pays for a Prisma session's
bytes.

## The two that will actually bite on this project

1. **`admin-safety.md` §5** — an admin mutation without `revalidatePath()` is invisible for up
   to 300 s and nobody will tell you it is your fault.
2. **`playbooks/windows-traps.md` A2** — the multi-string-replace-through-PowerShell bug rewrote
   letters across four pages on a sibling repo, and only git recovery found it.

## Where the rules came from

Most of these are distilled from two sibling sites (jellymark, thesmartaistack) where every
failure described actually shipped: fabricated ratings on hundreds of indexed pages, a `:root`
colour that compiled to nothing for months, a multi-character replace that corrupted imports, and
a session preset that overrode the two-agent cap into a 74-agent workflow.