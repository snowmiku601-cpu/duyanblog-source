---
name: duyanblog-add-content
description: Use when creating or editing editorial content on duyanblog.com — an article of any of the 5 types (review/roundup/versus/guide/editorial), a comparison, a category hub, an author profile, or a policy page. Covers the route map, the block JSON contract, go:OFFER_ID, the DemoNotice framing, and the verification pass. Load BEFORE the first edit.
---

# Adding or editing content

Load before the first edit. The route map and block contract come from `EDITORIAL_GUIDE.md`,
`SEO_GUIDE.md`, `src/lib/content-schema.ts`, and `src/lib/site.ts` — this file is the checklist,
not the reference.

## 0. Where content lives

- Articles live in the **database** (Prisma `Article.blocks` — JSON), not MDX files.
- URL comes from `articleTypePaths` (`src/lib/site.ts`): review → `/reviews/[slug]`,
  roundup → `/best/[slug]`, versus → `/compare/[slug]`, guide → `/guides/[slug]`,
  editorial → `/articles/[slug]`.
- Slugs are kebab-case, unique, and — once published — a redirect should accompany any change
  (`Redirect` table, admin managed, served by `src/proxy.ts`).
- Metadata is derived (`src/lib/seo.ts`): canonical = site url + route; OG json-ld; feeds pick
  articles up automatically. Keep one canonical route per article — never duplicate a slug
  across types.

## 1. Blocks contract (database content)

`Article.blocks` is a JSON string validated by `blocksSchema` (`src/lib/content-schema.ts`,
15 block types: paragraph, heading, list, quote, callout, stats, comparisonEmbed, offerEmbed,
pick, image, faq, sources, divider, table…). Rules:

- Serialize with `serializeBlocks()` (throws on invalid) — the admin editor does this for you;
  if you write blocks by hand, parse with `parseBlocks()` first.
- Offer embeds reference offers by id; picks use `offerId`; never a raw merchant URL inside a
  block (`go:OFFER_ID` is the only legal offer reference).
- A bad block must never take down a page — the pipeline drops invalid blocks individually.
  Validate before saving, never after.

## 2. Content integrity & the demo framing

- The seeded dataset is **fiction, labelled**. New editorial content follows the same rule:
  demo/example values stay visibly demo (`DemoNotice` component), real facts carry sources
  (`SourceCitation` rows) and a `lastReviewedAt` / `publishedAt` the reader can see.
- No fake `Review`/`aggregateRating` JSON-LD, ever — on demo or real content alike.
- Before go-live the owner swaps demo → real; `rules/content-integrity.md` §demo→launch.

## 3. Comparison engine

- `Comparison` rows attach to a versus article (`Comparison.articleId`) or embed anywhere via
  `comparisonEmbed` block by slug.
- `ComparisonItem.attributes/pros/cons` are JSON strings validated by
  `src/lib/comparison.ts`. Items must actually differ on the table's ranking axis — a table
  where every row ties on every axis is filler.
- Winner dots are computed (`winnerFor`, unique best, ties → no winner); the sort preference is
  per-reader localStorage. Server never fakes a winner.

## 4. Verification pass (before claiming done)

1. `npm run lint && npm run typecheck` — zero errors.
2. `npm run test` against the running dev server (51 checks) — all pass.
3. **Open the rendered page**: both themes, 1280 + 375, no horizontal overflow, console clean,
   canonical matches the route, DemoNotice present where demo data shows, first buy link has the
   adjacent disclosure — a class list is not evidence; a screenshot or browser probe is.
4. Scheduled stories (future `publishedAt`) must stay invisible publicly — verify with the
   `duyan-runtime-verifier` agent if you made schedule changes.