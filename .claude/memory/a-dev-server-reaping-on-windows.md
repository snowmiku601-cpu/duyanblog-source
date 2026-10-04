---
name: dev-server-reaping-on-windows
description: The sandbox dev server gets reaped mid-round on Windows; a "fetch failed" storm in smoke.mjs means the server died, not the app
metadata:
  type: lesson
---

## What happened

Across 14 build rounds (worklog Task 4→14) the `next dev` server was reaped mid-round **7+ times** — documented as "dev server reaped (documented sandbox issue, Nth occurrence)". Each time the whole smoke suite printed a storm of `fetch failed` errors that looked exactly like an app regression.

## The lesson

- **A "fetch failed" storm is the server dying, not the app breaking.** Recover with a restart (`setsid`-style, or a fresh background `npm run dev`), then re-run the suite.
- Back-to-back smoke runs can ALSO trip the newsletter rate limiter (5 POSTs/min/IP → 429 on two checks) — that is the limiter working, not flakiness. Wait a minute.

## State now

The pattern lives on in `worklog.md` and `rules/windows-traps.md` A7. Related: [[a-newsletter-rate-limiter-is-the-feature]].