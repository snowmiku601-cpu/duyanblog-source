# DUYANBLOG — Agent Operating Manual

> Auto-loads every session. This file is a **router**: keep it thin. Rules live in
> `.claude/rules/` (loaded on demand), playbooks in `.claude/playbooks/` (task-scoped, never
> auto-loaded), history is `worklog.md` at the repo root. Anything you can reconstruct from the
> tree or from `git log` does not belong here. Facts move out to a rule, never accrete.
>
> **The budget is a ratchet.** `.claude/rules/` and this file are the only things the harness
> auto-loads. Pay for every addition by retiring something finished (`worklog.md` grows, rules
> must not).

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
  (`@theme inline` in `src/app/globals.css`), shadcn/ui, Prisma 6 + SQLite (`db/custom.db`;
  Postgres-portable), Zod 4.
- **Repo:** `github.com/snowmiku601-cpu/duyanblog-source` (public, branch `main`). Git is the only
  undo. Repo-local identity: `DienPower <snowmiku601-cpu@users.noreply.github.com>` (already set).
- **Build target:** `output: "standalone"`, run with bun (`npm start`). Every route is ISR
  (`revalidate`), nothing public is per-request dynamic except `/search` and `/go/[offerId]`.
- **The DB is the mutable state; everything else is rebuildable.** SQLite file at `db/custom.db`
  (repo-root — `.gitignore`d). Back up before destructive seed/migrate work.
- **Seeded content is fictional by design.** Demo products/merchants/offers/authors carry a
  visible `DemoNotice`. The trust rules (no fake ratings/claims) are the same as on the sibling
  sites — read `rules/content-integrity.md` before writing any content.
- **Admin area is complete** (auth scrypt + DB sessions, no default credentials — bootstrap via
  `npm run admin:bootstrap`). `/admin` requires HTTPS in production for the Secure cookie.
- Worklog: `worklog.md` records every task round (Task ID N). Read the tail before starting work;
  append a new entry after finishing.

## The five that break this repo

1. **`next build` and `bun run dev` share port 3000, and the standalone copy steps are part of the
   build.** `npm run build` must copy `.next/static` and `public/` into `.next/standalone/`
   (`package.json` already does) or the server 404s its own assets.
2. **The seed and admin bootstrap refuse `NODE_ENV=production` unless `ALLOW_DEMO_SEED` /
   `ALLOW_ADMIN_BOOTSTRAP` are set.** Never hack around those guards; they are the production
   safety net.
3. **Admin mutations must call `revalidatePath()`** (+`invalidateSettingsCache()` for
   `SiteSetting`) or edits stay invisible until the ISR window elapses.
4. **Never put a number on a page that nobody measured.** Same rule as the sibling sites:
   see `rules/content-integrity.md`.
5. **JSON-in-String columns are validated with Zod at every boundary**
   (`src/lib/content-schema.ts`, `src/lib/comparison.ts`). A malformed block must never take down a
   page — keep the parse-and-drop behaviour.

## Canonical commands (Windows)

```bash
npm run dev            # next dev -p 3000 (pegged to 3000 — the Caddyfile proxies there)
npm run lint           # eslint .  — the fast gate
npm run typecheck      # tsc --noEmit  — the second gate
npm run test           # node scripts/smoke.mjs against a RUNNING server (51 checks; SMOKE_BASE_URL overrides)
npm run build          # next build + static/public copy into standalone
npm start              # NODE_ENV=production bun .next/standalone/server.js
npm run db:migrate     # prisma migrate deploy (production-safe)
npm run seed:demo      # wipes + reseeds demo content (refuses production)
npm run admin:bootstrap -- --email <e> --password <12+ chars, letters+digits>
npm run media:manifest # backfill public/images/.media-manifest.json dimensions
```

- Prefer **PowerShell** for Windows objects (`Get-ChildItem`, `Test-Path`) and **Bash** for
  POSIX pipelines; the Bash tool is Git Bash. Never run a multi-string replace through a shell —
  see `rules/windows-traps.md`.
- Back-to-back smoke runs can trip the newsletter rate limiter (5/min/IP → 429). Wait a minute;
  that limiter is the feature.

## Rules index (`.claude/rules/`) — read on demand

| File | Read before |
|---|---|
| `content-integrity.md` | writing any content, number, claim, or demo-data bound to the page |
| `admin-safety.md` | touching auth, admin routes, production guards, or DB sessions |
| `db-and-cache.md` | any Prisma model, migration, seed, or ISR/revalidate decision |
| `windows-traps.md` | any multi-line shell work, path juggling, or PowerShell/Bash mixing |
| `agent-routing.md` | launching any subagent |
| `design-and-seo.md` | any visual, token, metadata, schema or SEO decision |

Each rule file starts with the incident that produced it. If the incident is in `worklog.md`
instead, the rule says so and links the Task ID.

## Agents (`.claude/agents/`) — never invent a name

`ls .claude/agents/` for valid names. Built-ins (`Explore`, `Plan`, `general-purpose`) cover most
work; the repo agents exist for jobs with a house contract. Cap is two agents per task — no fan-out
(see `rules/agent-routing.md`).

## Session end

Write what you **learned**, not what you did, to the memory store that actually auto-loads — the
user-scope `C:\Users\PC\.claude\projects\e--duyanblog-source\memory\` directory — **not** to
`.claude/memory/` (kept for durable reference material only, it does not auto-load). One fact per
file, named after the fact (e.g. `the-upload-api-accepts-a-folder-param.md`). If it could be
reconstructed from `git log --stat`, do not save it.