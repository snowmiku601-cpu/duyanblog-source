---
name: admin-edit-invisible-without-revalidate
description: A site-setting or content edit that skips revalidatePath() / invalidateSettingsCache() stays invisible up to the ISR window (300s) or settings cache (30s) — the contract, not a bug
metadata:
  type: lesson
---

## What happened

The admin contract (`ARCHITECTURE.md` §2, `rules/admin-safety.md` §5) exists because the ISR model makes every mutation a two-part operation: write the row **and** revalidate the affected routes. On the sibling projects, an admin feature that skipped the revalidate half shipped edits that "didn't save" from the editor's point of view — invisible for up to the revalidate window, with nobody telling you it was your fault.

## The lesson

- **Every admin mutation MUST call `revalidatePath()`** on the affected public routes — use `src/lib/admin-revalidate.ts` helpers (`revalidateForArticle`, `revalidateLists`, `revalidateEverything` for taxonomy) — and **`invalidateSettingsCache()`** when `SiteSetting` rows change (30 s module cache).
- A test that edits content and immediately fetches the public page can produce a false "edit didn't save" — the ISR window is real. Fetch twice, or wait the window.
- If a page shows stale content after a mutation, the first suspect is a missing revalidate call, the second a missed `invalidateSettingsCache`, never the DB write.

## State now

Distilled into `rules/admin-safety.md` §5. Related: [[newsletter-rate-limiter-is-the-feature]].