# EDITORIAL_GUIDE.md — how to write for duyanblog.com

For humans and AI agents authoring content. Storage is structured JSON blocks, not HTML/Markdown files. The schema is `src/lib/content-schema.ts`; the renderer is `src/components/editorial/article-renderer.tsx`; validation on read is forgiving (invalid blocks are dropped individually), validation on write (`serializeBlocks`) is strict — write valid JSON.

## 1. Article types and when to use each

| Type | URL prefix | Use when | Required extras |
| --- | --- | --- | --- |
| `review` | `/reviews/` | You researched one product and have a verdict | Author + reviewer, `ReviewScore` rows, TL;DR, sources, `lastReviewedAt` |
| `roundup` | `/best/` | You can name a ranked set of picks for a need | Pick blocks (ranked), TL;DR, sources |
| `versus` | `/compare/` | Two concrete options, one decision | Comparison data attached (`Comparison.articleId`), TL;DR |
| `guide` | `/guides/` | A reusable method/decision framework, not tied to one verdict | Sources; TL;DR recommended |
| `editorial` | `/articles/` | Position pieces, publication notes | — |

Every article also needs: `slug` (unique across the site, one type per slug — the same slug cannot appear under two prefixes), `title`, `deck` (standfirst), `categoryId` (software/travel/tech), `authorId`, optional `heroImage` + `heroAlt` + `heroCredit`, optional `tldr`, `readingMinutes`, and `status: "published"` + `publishedAt` to go live.

> **Reading minutes:** leave the field empty and the server auto-calculates it from the body copy (≈200 wpm, clamped 1–600) on every save. Only type a number to override the estimate.

## 2. Block JSON format

`Article.blocks` is a JSON **array** of block objects (max 300). Minimal working example showing the inline syntax:

```json
[
  { "type": "paragraph",
    "text": "The **Auralis Note 14** is *calm* rather than exciting. Its published spec claims `14h 22m` of battery in a looped-work profile — [read the methodology](/methodology) or [the maker's spec sheet](https://example-auralis.test/spec) for what that test means." },
  { "type": "heading", "level": 2, "text": "Who it is for" },
  { "type": "paragraph",
    "text": "If the price works for you, [buy the Note 14 direct](go:off_auralis_direct) — that is an affiliate link by construction." },
  { "type": "callout", "variant": "note", "title": "About our numbers",
    "text": "Every figure above is cited to a dated source. Where we could not verify something, we leave it empty rather than invent it." }
]
```

### Inline syntax (inside `text` fields only; parsed by `src/components/editorial/inline-text.tsx`)

| Syntax | Renders as | Rules |
| --- | --- | --- |
| `**bold**` | `<strong>` | |
| `*italic*` | `<em>` | |
| `` `code` `` | `<code>` chip | |
| `[label](/internal/path)` | Internal link, `next/link`, sun-coloured underline | Always prefer internal links over leaving the site |
| `[label](https://…)` | External link, `rel="nofollow noopener"`, new tab | Use for genuine external sources only |
| `[label](go:OFFER_ID)` | **Affiliate link** → `/go/OFFER_ID?src=<articleSlug>`, `rel="sponsored noopener"`, new tab, vermilion underline | See the rule below |

**`go:` vs raw URLs — the rule.** Article prose must reference offers by ID (`go:off_auralis_direct`), never by merchant URL. Reasons: the destination is owned by the `AffiliateOffer` row (change the URL once in the database, every article follows); every click is logged consistently with `rel="sponsored"`; article text can never leak a stale or non-HTTPS URL. Never paste a raw merchant URL into a `text` field — it would render as a plain `nofollow` external link with no tracking and no disclosure chain.

> **Launch constraint (until a dedicated inline-disclosure pass).** Structured commerce surfaces — `pick` with `offerId`, `offerEmbed`, `comparisonEmbed` — carry their own adjacent affiliate disclosure. Inline `[label](go:OFFER_ID)` links in prose do **not**, and routes like guides/editorials have no page-level disclosure. Until that pass ships, the first real content wave uses structured commerce surfaces on guide/editorial pages rather than inline `go:` links.

## 3. Block type reference (all 15)

| Type | Fields | Limits |
| --- | --- | --- |
| `paragraph` | `text` | 1–8000 chars, inline syntax |
| `heading` | `level` (2 or 3), `text` | ≤300 chars; auto-ID via `slugifyHeading` feeds the TOC |
| `list` | `ordered` (bool, default false), `items[]` | 1–30 items, inline syntax each |
| `quote` | `text`, `attribution?` | pull-quote, display serif italic |
| `callout` | `variant`: `note` \| `warning` \| `tip`; `title?`, `text` | note=sun border, tip=primary, warning=vermilion |
| `prosCons` | `title?`, `pros[]`, `cons[]` | ≤12 each, ≤300 chars — used for "the trade-offs, plainly" |
| `stats` | `items[]` of `{value, label}` | 1–6; evidence-led — cite a dated source for each value or label it demo |
| `table` | `caption?`, `head[]`, `rows[][]` | ≤8 cols, ≤40 rows; plain text cells |
| `image` | `src`, `alt` (required), `caption?`, `credit?` | alt is mandatory by schema |
| `pick` | `rank` 1–100, `name`, `blurb`, `badge?`, `imageUrl?`, `offerId?`, `url?` | roundup building block; `offerId` wires the buy button |
| `comparisonEmbed` | `comparisonSlug` | renders the full sortable `ComparisonTable` from DB data |
| `offerEmbed` | `offerId` | renders one `MerchantOffer` card |
| `faq` | `title?` (default "Frequently asked questions"), `items[]` of `{q, a}` | 1–15; accordion |
| `sources` | `title?`, `items[]` of `{label, url?}` | 1–25; numbered citations |
| `divider` | — | dashed hairline |

## 4. Review requirements (type = `review`)

1. **Author + reviewer.** `authorId` (required) and `reviewerId` (a second editor who verified the claims). Rendered in the article header with roles.
2. **Dates.** `publishedAt` on publish; `updatedAt` is automatic; set `lastReviewedAt` when the verdict is re-checked — it renders as "Fact-checked <date>" and is the honesty signal readers scan for.
3. **ReviewScore criteria with weights.** Rows of `{label, score 0–10, weight (default 1), note?, order}`. The page computes the weighted average into the score dial; readers can recompute the number, so weights must reflect what actually drove the verdict. Score colour bands (`src/lib/format.ts`): ≥8 primary, ≥6 ochre, else vermilion.
4. **TL;DR** (`tldr`): the verdict plus the main trade-off, in ~2 sentences. Rendered in the "The short version" box before the body.
5. **Sources.** At least the methodology entry plus product/merchant documents, via `SourceCitation` rows (rendered as the numbered "Sources" list) or a `sources` block.
6. **FAQ.** Answer the purchase-blocking questions (compatibility, support, hidden costs). The demo reviews model the depth expected.
7. **Offers.** Attach `AffiliateOffer` rows (articleId) for the "Where to buy" sidebar instead of pasting buy links into prose; in prose use `go:OFFER_ID` only.

## 5. Roundup pick blocks

Order picks by `rank` starting at 1. Each pick: a specific need in `badge` ("Best for multi-region trips"), a `blurb` that names the trade-off (what it wins *and* what it costs you), and `offerId` to wire the buy button. The home page and `/best` index read pick blocks for teasers, so `name` and `blurb` must stand alone. Model: seed article `best-esim-providers`.

## 6. Comparisons

- **Embedded table in any article:** add `{ "type": "comparisonEmbed", "comparisonSlug": "cloudpeak-vs-harborstack-table" }`. The slug points at a `Comparison` row; rows/attributes/winner logic come from the database, not the article.
- **Versus pages:** attach the `Comparison` to the article (`Comparison.articleId = article.id`) — `/compare/[slug]` then renders the table automatically above the body. Write the prose to interpret the table (who wins what, and who should buy which), not to repeat every cell. Attributes that should drive a "winner" mark need `numeric` values and a `direction` (`"high"` or `"low"`); ties show no winner by design. A versus article launching **without** structured commerce/comparison data may use static evidence `table` blocks in the body instead and leave the `Comparison` relation null — attach a `Comparison` row only when using the structured comparison engine, and never fabricate scores or items merely to satisfy the relation.

## 7. Labelling rule for demo/sample content

While `demo_mode` is on: every fictional product, merchant, price and measurement must stay visibly labelled. Articles do this with a `callout`/paragraph saying the data is demo data, the pages render `DemoNotice`, and offer cards say "(demo)". **Never present seeded content as a real recommendation, and never fabricate stats, credentials, awards or reviews** — that is a trust-destroying bug, not a style choice. When you replace demo content with real content, remove the labels deliberately rather than leaving contradictory notices.

## 8. Tone of voice

- **Headlines: short declaratives ending with a vermilion period on H1s.** "Reviews with reasons attached." / "Find the verdict." / "How we earn the byline." The period is a brand mark (`<span className="text-vermilion">.</span>`).
- **Trade-offs in the open.** Every recommendation names what it is bad at. "You pay for it in graphics grunt and port variety." If there is no downside, you have not researched enough.
- **No hype adjectives.** Banned register: "game-changing", "must-have", "amazing deals", "best-ever". Superlatives must be earned by a stated criterion ("the best keyboard in this price class — because X").
- **Evidence over confidence.** Numbers come with their dated sources ("14h 22m per the maker's published spec, checked October 4, 2026"); absence of data is stated, not papered over.
- **First person plural, plain verbs.** "We read the vendor's published pages and record the day we checked each figure." Contractions fine; jargon explained on first use. If an article genuinely includes first-hand testing, say so and describe exactly what was done — never imply it when it did not happen.

## 9. Workflow (admin, when it lands)

The admin UI is built (`/admin`): login, article editor with JSON blocks, revision history.

1. **Draft:** create the article with `status: "draft"` — drafts never appear publicly (`getPublishedArticleBySlug` filters `status: "published"`), nor in sitemap/feed.
2. **Publish:** set `status: "published"` + `publishedAt`. The admin mutation must call `revalidatePath()` on the article path, its type index, the home page, `/sitemap.xml` and `/feed.xml` (ARCHITECTURE.md §2 documents the contract).
3. **Schedule:** with `status: "published"`, set `publishedAt` to a future date — the story stays out of every public surface (indexes, search, feeds, sitemap, the story URL itself) until the moment passes, then goes live within one cache cycle (≤5 minutes; admin pages show an amber **Scheduled** badge and the articles list has a Scheduled filter). A published story whose date already passed behaves exactly as before — nothing existing needed to change.
4. **Revisions:** every save snapshots title + blocks into `ArticleRevision` (note: "Edited via admin"). The editor page has a **Revision history** section — expand it to browse, preview (pretty JSON) and **restore** any snapshot. Restoring first saves the current content as an automatic "Auto-backup before restore" revision, so a restore is itself reversible. Revisions are append-only audit history — never a public changelog.
5. **Editing published work:** update `blocks`/fields; `updatedAt` moves automatically and feeds `dateModified` metadata. Substantive verdict changes follow `/corrections-policy` and get a dated note.
6. Reading time: leave the field empty and the server computes it from the blocks (≈200 wpm, clamped 1–600).
7. Validate with `serializeBlocks()` before saving; smoke-test the rendered page after publishing.
