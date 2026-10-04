---
name: newsletter-rate-limiter-is-the-feature
description: POST /api/newsletter and /api/contact are rate-limited 5/min/IP in-memory; a 429 in tests is the guard working, never a bug to "fix"
metadata:
  type: lesson
---

## What happened

During round-13 of the build, back-to-back smoke runs tripped `429` on the newsletter/contact checks. The smoke header itself documents it: "can trip the newsletter rate limiter (5/60s) and fail those two checks with 429 — wait a minute and re-run. That limiter working is the feature being protected."

## The lesson

- The in-memory fixed-window rate limiter (`src/lib/rate-limit.ts`) keys by `clientIp()` and applies to login + public POST endpoints. It is **working as designed** — do not weaken it, remove it, or special-case the smoke suite.
- If you found yourself "fixing" a 429, what you are really doing is disabling a security control. Wait a minute instead. Production upgrade path (in-process only): Redis keyed by IP, same return shape.

## State now

Documented in `ARCHITECTURE.md` §10 and `rules/windows-traps.md` A7. Related: [[dev-server-reaping-on-windows]].