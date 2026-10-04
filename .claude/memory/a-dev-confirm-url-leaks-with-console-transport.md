---
name: dev-confirm-url-leaks-with-console-transport
description: The newsletter confirm URL is only echoed in dev when the console transport was used (nothing was emailed). A real provider never leaks it in any environment. Treat "dev shortcut" fields as documentation of a security property
metadata:
  type: lesson
---

## What happened

The newsletter double opt-in (round 11, Task 11) returns `confirmUrl` in the JSON body — but **only** when the email transport is the dev console transport (nothing actually emailed) and only outside production. With a real provider (`RESEND_API_KEY` set), `sendMail()` never echoes the URL in any environment. This is a deliberate, documented security property (`ARCHITECTURE.md` §9), not an accident.

## The lesson

- "Dev shortcut" fields are a **security property wearing a convenience hat**: if a session ever sees `confirmUrl` in a response, it is proof no real email was sent. Do not "improve" it by removing the gate or by echoing the URL with a real provider.
- The same pattern recurs in the admin resend action (`POST /api/admin/subscribers/[id]/resend`) — token rotation kills previously copied links, and the URL is only returned on the console transport.
- When the production provider goes live, the operator step is: set `RESEND_API_KEY` + verify `EMAIL_FROM` — nothing else changes, and the dev shortcut quietly becomes unreachable.

## State now

Documented in `ARCHITECTURE.md` §9 (double opt-in + admin actions). Related: [[newsletter-rate-limiter-is-the-feature]].