# Saily vs Airalo — draft import & approval notes

Status: **DRAFT, unpublished, local DB only.** This file documents what exists and how the
owner reviews/approves it. Nothing here runs against production.

## What exists

| Piece | Where |
|---|---|
| Draft article row | Local MySQL `duyanblog_dev`, `Article` slug `saily-vs-airalo`, `status: "draft"`, `isDemo: false`, `publishedAt: null`, author `duyan` (Duy An Tran), category `travel` |
| Draft source of truth | `content/drafts/saily-vs-airalo.json` (committed — re-running the persist script re-syncs the DB row from this file) |
| Integrity gate | `node scripts/test-article-draft-saily-vs-airalo.mjs` (26 checks, must exit 0) |
| Evidence ledger | `.superpowers/sdd/2026-10-06-saily-vs-airalo-research/ledger-notes.md` (git-ignored; §DRAFT-TIME REFRESH has the same-day price refresh + conflict rulings) |
| Media | `public/images/articles/saily-vs-airalo/` (1 Pexels hero photo, Git-managed) |

## Author / byline publish gate

The local draft currently uses author slug `duyan` / byline `Duy An Tran`.
Owner must explicitly confirm this is the intended real byline before publish.
(The other seed authors are fictional demo characters and must not be used.)
If the byline should differ, swap `authorId` in the admin UI before publishing.

## Production import — what a git merge does and does not do

**A git merge of this branch ships draft JSON + media files only.** The `Article`
row exists ONLY in the local `duyanblog_dev` database — production does NOT
contain this article after merging. To get it into production:

1. Owner approves the draft content (this review).
2. An explicit, owner-approved create/import step creates the production
   `Article` row with `status: "draft"` first (via the production admin editor
   or a one-time import run against the production DB by the owner).
3. Publishing (`status: "published"` + `publishedAt`) is a later, separate action.
4. Never seed demo content into production.

## How to review

1. Local only: `npm run dev`, log into `/admin`, open the article editor for
   `saily-vs-airalo` (status draft → invisible on the public site by design).
2. Re-verify prices before publish: the research gate's 8-week rule applies — if publishing
   later than 2026-12-01, re-fetch all three Saily + Airalo plan pages, update the three
   table captions and the sources dates, re-run the integrity gate.
3. To publish: set `status: "published"` + `publishedAt` in the admin editor, then revalidate
   the article path, `/compare` index, home, sitemap and feed (admin mutations do this).
4. Public URL after publish: `https://duyanblog.com/compare/saily-vs-airalo` (indexing stays
   off until the owner flips `ALLOW_INDEXING`).

## Affiliate retrofit (later, per owner decision)

No affiliate links exist in this draft. When a partnership lands: create real
`AffiliateOffer` rows, then convert the pricing sections to structured commerce surfaces
(`offerEmbed`/`pick`/`comparisonEmbed`) — not inline `go:` links — per the EDITORIAL_GUIDE
launch constraint. Re-run the integrity gate with the commerce checks re-enabled.

## Re-sync command (local)

```bash
# from content/drafts/saily-vs-airalo.json → local DB row
npx tsx - <<'EOF'
import { PrismaClient } from "@prisma/client";
import { serializeBlocks } from "./src/lib/content-schema";
import { readFileSync } from "node:fs";
const p = new PrismaClient();
const d = JSON.parse(readFileSync("content/drafts/saily-vs-airalo.json", "utf8"));
const author = await p.author.findUniqueOrThrow({ where: { slug: "duyan" } });
const cat = await p.category.findUniqueOrThrow({ where: { slug: d.categoryId } });
await p.article.update({ where: { slug: d.slug }, data: {
  title: d.title, deck: d.deck, tldr: d.tldr, blocks: serializeBlocks(d.blocks),
  authorId: author.id, categoryId: cat.id, isDemo: false,
}});
console.log("synced");
await p.$disconnect();
EOF
```
