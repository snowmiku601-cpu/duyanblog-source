# Saily vs Airalo — draft import & approval notes

Status: **DRAFT, unpublished.** The article exists in BOTH the local `duyanblog_dev` DB and
the **production** DB (`status: "draft"` in both) — the production import and the
pre-publish metadata pass are complete. This file documents the current state and how the
owner reviews/publishes it. Nothing here publishes anything.

## What exists

| Piece | Where |
|---|---|
| Draft article row | Production MySQL (Spaceship) AND local `duyanblog_dev` — `Article` slug `saily-vs-airalo`, `status: "draft"`, `isDemo: false`, `publishedAt: null`, author `duyan` (Duy An Tran), category `travel` |
| Draft source of truth | `content/drafts/saily-vs-airalo.json` — committed, now carries hero metadata, `readingMinutes: 14`, and the 4 approved tags; **34 blocks** |
| Integrity gate | `node scripts/test-article-draft-saily-vs-airalo.mjs` (30 checks, must exit 0) |
| Evidence ledger | `.superpowers/sdd/2026-10-06-saily-vs-airalo-research/ledger-notes.md` (git-ignored; §DRAFT-TIME REFRESH has the same-day price refresh + conflict rulings) |
| Media | `public/images/articles/saily-vs-airalo/` (1 Pexels hero photo, Git-managed; hero lives in `heroImage`, not in body blocks) |
| Production metadata | heroImage/heroAlt/heroCredit set; `readingMinutes: 14`; tags exactly `eSIM`, `travel-connectivity`, `saily`, `airalo`; `comparison: null` (intentional v1 — static evidence tables); `reviewerId`/`lastReviewedAt` null |

## Author / byline

The local draft currently uses author slug `duyan` / byline `Duy An Tran`.
Owner confirmed public byline: Duy An Tran (2026-10-06).
(Fictional seed authors must not be used. If the byline ever needs to change,
swap `authorId` in the admin UI before publishing.)

## Production import — what a git merge does and does not do

**Done (2026-10-06):** the production `Article` row was created by an explicit
owner-approved import and the metadata pass is complete — production draft matches the
committed source of truth. Merging further branches keeps the repo and production in sync
only via the re-sync workflow below; production DB writes stay explicit and owner-approved.

1. Owner approves the draft content (this review).
2. Publishing (`status: "published"` + `publishedAt`) is a separate, later action.
3. Never seed demo content into production.

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

Restores title/deck/tldr/blocks AND the hero metadata, readingMinutes, and the exact tags
(same slug normalization as the app's `resolveTagIds`):

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
const slugifyTag = (name: string) =>
  name.toLowerCase().normalize("NFKD").replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim().replace(/\s+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "tag";
const tagIds: string[] = [];
for (const name of d.tags) {
  const tag = await p.tag.upsert({ where: { slug: slugifyTag(name) }, create: { slug: slugifyTag(name), name }, update: {} });
  if (!tagIds.includes(tag.id)) tagIds.push(tag.id);
}
await p.$transaction(async (tx) => {
  const row = await tx.article.update({ where: { slug: d.slug }, data: {
    title: d.title, deck: d.deck, tldr: d.tldr, blocks: serializeBlocks(d.blocks),
    heroImage: d.heroImage, heroAlt: d.heroAlt, heroCredit: d.heroCredit,
    readingMinutes: d.readingMinutes,
    authorId: author.id, categoryId: cat.id, isDemo: false,
  }});
  await tx.articleTag.deleteMany({ where: { articleId: row.id } });
  await tx.articleTag.createMany({ data: tagIds.map((tagId) => ({ articleId: row.id, tagId })) });
});
console.log("synced");
await p.$disconnect();
EOF
```
