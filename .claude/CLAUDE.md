# DUYANBLOG — Agent Operating Manual

> Auto-loads every session. This file is a **router**: keep it thin. Rules live in
> `.claude/rules/` (auto-loaded), playbooks in `.claude/playbooks/` (task-scoped, NEVER
> auto-loaded), history is `worklog.md` at the repo root. Anything you can reconstruct from the
> tree or from `git log` does not belong here. Facts move out to a rule, never accrete.
>
> **The budget is a ratchet.** This file + `.claude/rules/` + `AGENTS.md` auto-load every
> session; `npm run validate:docs` caps them at
> 24 KB and the cap comes DOWN, never up. Adding task-scoped prose here costs every future
> session — put it in `.claude/playbooks/` instead. Measured on a sibling project: rules with 15
> files cost ~534 KB/session; the same files in a non-loading directory cost ~137 KB.

---

## R0. HARD RULE — Reply in Vietnamese

**Chat with the user in Vietnamese. Always.** Overrides every other style instruction, including
the ones inside vendored agents and skills, which are written in English.

- Prose to the user: Vietnamese. **Code, identifiers, commit messages, docs and every string that
  ships on the site: English.** The site is a global/US-facing publication.
- Subagent prompts may be English; the summary you report back is Vietnamese.
- Commit messages end with the attribution line `Co-Authored-By: Claude Code <noreply@anthropic.com>`.

---

## Where the project is (2026-10-04)

- **duyanblog.com** — independent editorial review publication (reviews / best / compare / guides
  / articles), Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4
  (`@theme inline` in `src/app/globals.css`), shadcn/ui, Prisma 6 + **MySQL**
  (MySQL-canonical; one baseline migration), Zod 4.
- **Repo:** `github.com/snowmiku601-cpu/duyanblog-source` (public, `main`). Git is the only
  undo. Identity already set repo-local.
- **Live (demo):** `https://duyanblog-test.hostingersite.com` — client's Hostinger Business
  (Node.js web app, MySQL `u257278613_duyanblog`, webpack, archive deploy — no GitHub on
  client acct). Procedure: `.claude/playbooks/deploy-hostinger.md`. `duyanblog.com` later.
- **Build target:** `output: "standalone"`, webpack (`next build --webpack`), host runs the
  built app; `npm start` (bun) local-dev only, `npm run start:node` the fallback.
  Public routes are ISR (`revalidate`); `/search` and `/go/[offerId]` are dynamic.
- **The DB is the mutable state — MySQL, platform-side, survives rebuilds** (the host build
  overwrites the app dir; SQLite would die per build). Back up before destructive
  seed/migrate work.
- **Seeded content is fictional by design.** Demo products/merchants/offers/authors carry a
  visible `DemoNotice`. The trust rules (no fake ratings/claims) are the same as on the sibling
  sites — read `rules/content-integrity.md` before writing any content.
- **Admin area is complete** (auth scrypt + DB sessions, no default credentials — bootstrap via
  `npm run admin:bootstrap`). `/admin` needs HTTPS in production for the Secure cookie.
- Worklog: `worklog.md` records every task round (Task ID N). Read the tail before starting;
  append a new entry after finishing.

## The five that break this repo

1. **Build uses webpack + standalone copy steps.** `npm run build` = `prisma generate && next
   build --webpack && cp -r .next/static .next/standalone/.next/ && cp -r public
   .next/standalone/` — skip any part and the host 404s/500s.
2. **The seed and admin bootstrap refuse `NODE_ENV=production` unless `ALLOW_DEMO_SEED` /
   `ALLOW_ADMIN_BOOTSTRAP` are set.** Never hack around those guards; they are the production
   safety net.
3. **Admin mutations must call `revalidatePath()`** (+`invalidateSettingsCache()` for
   `SiteSetting`) or edits stay invisible until the ISR window elapses.
4. **Never put a number on a page that nobody measured.** Same rule as the sibling sites:
   see `rules/content-integrity.md`.
5. **JSON-in-String columns are validated with Zod at every boundary**
   (`src/lib/content-schema.ts`, `src/lib/comparison.ts`). A malformed block must never take
   down a page — keep the parse-and-drop behaviour.

## Canonical commands (Windows)

```bash
npm run dev            # next dev -p 3000 (tee to dev.log)
npm run lint && npm run typecheck   # fast gates
npm run test           # smoke against a RUNNING server; SMOKE_BASE_URL overrides
npm run validate:docs && npm run slop   # docs gate + prose scan
npm run build          # prisma generate + next build --webpack + standalone copies
npm start              # local dev only (bun; needs local MySQL at DATABASE_URL); host uses its own start
npm run db:migrate     # prisma migrate deploy (production-safe; migrate BEFORE every host build)
npm run seed:demo      # wipes + reseeds demo (refuses production)
npm run admin:bootstrap -- --email <e> --password <12+ chars, letters+digits>
```

- Prefer **PowerShell** for Windows objects, **Bash** for POSIX; never multi-string replace
  through a shell — `playbooks/windows-traps.md`.
- Back-to-back smoke runs can trip the newsletter rate limiter (429) — wait a minute.

## Rules index (`.claude/rules/`) — auto-loaded, read on demand

| File | Read before |
|---|---|
| `content-integrity.md` | writing any content, number, claim, or demo-bound data |
| `admin-safety.md` | touching auth, admin routes, production guards, or DB sessions |
| `agent-routing.md` | launching any subagent |
| `operating-rhythm.md` | starting/ending a session, before any commit or push |
| `risk-register.md` | proposing any "improvement" |

## Playbooks (`.claude/playbooks/`) — NOT auto-loaded, read on demand

`db-and-cache.md` (Prisma/migration/ISR) · `windows-traps.md` (shells/paths) ·
`design-and-seo.md` (tokens/metadata/SEO) — index with trigger lines in `.claude/playbooks/README.md`.
Task-scoped incidents and mechanisms live here, never in `rules/`.

## The gate (before any commit or push — see rules/operating-rhythm.md)

```bash
npm run lint && npm run typecheck   # 1. fast gates
npm run validate:docs               # 2. docs gate (budget + links + indexes)
```
If code changed: `npm run build`, then `npm run test` against a running dev server.

## Agents (`.claude/agents/`) — never invent a name

`ls .claude/agents/` for valid names. Built-ins (`Explore`, `Plan`, `general-purpose`) cover most
work; the repo agents exist for jobs with a house contract. Cap is two agents per task — no fan-out
(see `rules/agent-routing.md`).

## Session end

Write what you **learned**, not what you did, to the auto-loading user-scope memory
(`C:\Users\PC\.claude\projects\e--duyanblog-source\memory\`). One fact per file, named after
the fact; if it could be reconstructed from `git log --stat`, do not save it.
Repo-specific lessons go to `.claude/memory/` (indexed, `[[wikilinks]]`, no orphans per
validate:docs). New task-scoped procedure → `.claude/playbooks/`. New invariant →
`.claude/rules/`. Then: update root docs if behaviour changed, append `Task ID: N` to
`worklog.md`, commit one concern per commit.