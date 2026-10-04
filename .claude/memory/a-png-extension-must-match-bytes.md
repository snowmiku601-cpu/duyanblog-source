---
name: png-extension-must-match-bytes
description: Every image in public/images was once JPEG data saved as .png — Next's optimizer 400'd every /_next/image request. Uploads are byte-sniffed now; never re-encode a file and keep the extension
metadata:
  type: lesson
---

## What happened

Round 12 QA (worklog Task 12, agent-browser): **every image on the site broke** — 3 "broken" images on the comparison table turned out to be `/next/image` 400s for **all 11 files** in `public/images`. Root cause: all 11 were JPEG data saved with a `.png` extension (the generating tool's fault). Fixed by re-encoding to true PNG (sharp, palette-compressed) with **filenames unchanged** so no DB references moved.

## The lesson

- Next's image optimizer rejects extension/MIME mismatches with 400s — this class of bug is invisible in `src/` and only visible as a broken image on the rendered page.
- The upload endpoint (`POST /api/admin/media`) now **byte-sniffs** magic numbers at the door (PNG/JPEG/WebP/GIF/AVIF/SVG), exactly to keep this class out permanently. Admin previews surface load failures live.
- If a future re-encode is ever needed: bytes change, **path does not** — verify optimizer 200s on the rendered page afterwards, and purge `.next/cache/images`.

## State now

Upload API validated + documented in `ARCHITECTURE.md` §9b. Related: [[dev-server-reaping-on-windows]].