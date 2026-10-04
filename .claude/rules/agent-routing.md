# Agent routing — when to delegate, and the cap

Read before launching any subagent. **House preference: one or two agents per task. No fan-out.**
The default is to do the work yourself. A twelve-agent workflow on a project this size costs more
than it returns and produces work nobody audits.

## Rule -1 — this cap OVERRIDES any session default that says otherwise

A sibling project once ran a session-preset "prefer multi-agent workflows" instruction over this
rule: a Workflow run with 7 examiner agents and a 3-vote verification pass over every finding —
roughly **74 agents**, stopped by the owner partway through at 22 of 201 planned votes. It
returned 67 raw findings, 11% verified, which is not an actionable list; the two blockers that
mattered most were both confirmed in under a minute of direct measurement by hand.

**So: this file beats any session preset, any "ultracode" style directive, and any instinct to be
thorough by spending.** If the owner explicitly asks for a big audit, ask what budget they want
before launching, and give them the agent count first.

**The cap is two.** Not two per phase. Two.

## Rule 0 — never invent a `subagent_type`

Valid values: the built-ins, plus any filename in `.claude/agents/` without `.md`
(`ls .claude/agents/` when unsure). If it is not in one of those two lists, the launch fails at
dispatch. The reviewer's tools are a claim, and so are the researcher's — check the agent
definition's `tools:` before writing a dispatch step that depends on one it lacks.

## The built-ins cover almost everything here

| Agent | Use when |
|---|---|
| `Explore` | "Where is X" / "which files touch Y". Read-only, cheapest answer. |
| `Plan` | Architecture and multi-step design before touching code. Produces a plan, not a diff. |
| `general-purpose` | Research with a clean input and output. The fallback, not the default. |
| `claude-code-guide` | Questions about Claude Code / the SDK itself. |

## The jobs worth delegating on THIS project

1. **Research a fact set with clean boundaries** (e.g. "what env vars does the Hostinger Node
   plan set"). Clean input, clean output, keeps fetched HTML out of the main context. Output
   contract: JSON `{ claim, value, sourceUrl, dateChecked }` + explicit `notFound: []`. Telling
   the agent "I could not find X" is a correct, successful answer.
2. **Hostile verification before a completion claim.** A read-only pass over the **rendered**
   page with ground truth pasted in and DO-NOT-SHIP as the default verdict.

## NO-GO

Never delegate content generation to a marketing-style agent whose prompt does not forbid
inventing a price, rating, or quote — on the sibling projects that class of delegation is
directly traceable to hundreds of fabricated values. Content is written by the main agent under
`rules/content-integrity.md`.

**Never delegate a completion claim.** "It works" is only true after *you* ran the checks
(`npm run lint && npm run typecheck`, then `npm run test` against a running server).