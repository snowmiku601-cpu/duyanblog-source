# SEO_GUIDE.md — duyanblog.com

What the site emits to search engines, the canonical-URL rules it enforces, and the checklist for publishing. All helpers live in `src/lib/seo.ts`; the public origin comes from `NEXT_PUBLIC_SITE_URL` (default `https://duyanblog.com`, `src/lib/site.ts`).

## 1. Metadata system

`buildMetadata(input)` (`src/lib/seo.ts`) is the single metadata builder; every page uses it (root `layout.tsx` sets `metadataBase` from `site.url`):

| Field | Behaviour |
| --- | --- |
| `alternates.canonical` | absolute URL of `input.path` — always set, always the one canonical route for the content |
| `openGraph` | title, description, `url`, `siteName`, `type` (`website` default, `article` for content), image `input.image ?? /images/og-default.png` at 1344×768 |
| article extras | `publishedTime` / `modifiedTime` / `authors` (mapped to `/authors`) / `section` when `type: "article"` |
| `twitter` | `summary_large_image` card mirroring OG |
| `robots` | `noIndex: true` option (used by `/search`) |
| Title template | `layout.tsx`: `%s | Duyan Blog` |

Article detail pages call `buildMetadata` in `generateMetadata` with the article's title, deck, `articlePath(type, slug)`, hero image, times, author and category.

## 2. JSON-LD emitted

All output passes through `<JsonLd>` (`src/components/seo/json-ld.tsx`), which escapes `<` to prevent script-tag breakout.

| Type | Where | Builder |
| --- | --- | --- |
| `NewsMediaOrganization` | home | `organizationJsonLd()` — includes `publishingPrinciples`, `correctionsPolicy`, `ethicsPolicy` pointing at the policy pages |
| `WebSite` (with SearchAction) | home | `websiteJsonLd()` — search target `/search?q={search_term_string}` |
| `Article` | all 5 article routes | `articleJsonLd()` — headline, deck, canonical URL, author Person, publisher Organization, `datePublished`, `dateModified`, `articleSection`, `isAccessibleForFree: true` |
| `BreadcrumbList` | all article routes, category hubs, authors, deals, methodology | `breadcrumbJsonLd()` |
| `Person` | `/authors` (each) and `/authors/[slug]` | `personJsonLd()` — name, role, bio, profile URL |
| `ItemList` | `/best/[slug]` (pick blocks), `/[category]` hubs | `itemListJsonLd()` — ordered internal article links |

**The demo-data rule (hard rule):** no `Review`, `Product`, `Offer`, or `aggregateRating` structured data is generated anywhere. The scores shown on demo reviews are fictional; emitting `aggregateRating` for them would be feeding fake ratings to search engines. Only add review rich-result schema once real, evidence-backed reviews exist, and add it in `articleJsonLd`/the article routes — not ad hoc.

## 3. Sitemap, robots, RSS

| File | Details |
| --- | --- |
| `src/app/sitemap.ts` | `revalidate = 3600`. Emits: static pages (home, type indexes, deals, articles, authors, about, contact, methodology, 8 policy pages from `policySlugs`), category hubs (`/[slug]`), every published article via `articlePath(type, slug)` with `lastModified: updatedAt`, author profiles. Reviews/roundups priority 0.8, others 0.7 |
| `src/app/robots.ts` | `User-agent: *`, allow `/`, **disallow `/admin`, `/admin/`, `/api/`, `/go/`, `/search`**; declares sitemap and host. `/go/` is disallowed so affiliate redirects never enter the index |
| `src/app/feed.xml/route.ts` | RSS 2.0, 20 latest published, `revalidate = 900`, `Cache-Control: public, max-age=900, stale-while-revalidate=1800`; items link via `articlePath` with `guid isPermaLink="true"`. **Per-section feeds**: `/feed.xml?category=<slug>` filters by category (unknown slugs 404). **Per-tag feeds**: `/feed.xml?tag=<slug>` filters by tag (channel title `— #Tag`, per-item `<category>` carries both the section and the `#tag`; unknown slugs 404; passing both `category` and `tag` → 400). Every page autodiscovers the right feed via `buildMetadata` (`rss` override); category hubs show a visible "Subscribe to this section" chip and tag hubs a "Follow this tag" chip (only when the tag has stories) |
| `src/app/feed.json/route.ts` | JSON Feed 1.1 mirroring RSS scopes: site-wide `/feed.json`, `?category=<slug>`, `?tag=<slug>` (same 404/400 guards, same 20 latest, same cache headers). Autodiscovery: `buildMetadata`'s `jsonFeed` override emits `<link rel="alternate" type="application/feed+json">` on category hubs and tag hubs alongside the RSS link |

Drafts never appear in any of the three — all queries filter `status: "published"`.

## 4. Canonical URL rules

- **One canonical route per article type** (`articleTypePaths` in `src/lib/site.ts`): review→`/reviews/[slug]`, roundup→`/best/[slug]`, versus→`/compare/[slug]`, guide→`/guides/[slug]`, editorial→`/articles/[slug]`. `articlePath(type, slug)` is the only URL builder; sitemap, feed, breadcrumbs, JSON-LD and internal links all use it.
- **Type + slug must match.** Each detail route loads through `getPublishedArticleBySlug(slug)` and then checks `article.type !== "<route type>"` → `notFound()` (e.g. `src/app/reviews/[slug]/page.tsx`). Consequence: an article whose canonical home is `/reviews/auralis-note-14-review` will **404 at `/best/auralis-note-14-review`** and every other prefix — the site never serves the same article under two URLs, so there is no duplicate-content variant to canonicalise away.
- Slugs are globally unique (`Article.slug @unique`), so a new article cannot collide with a retired one under a different type. If you must retire a URL, create a `Redirect` row (see §6) rather than reusing the slug for different content.
- Category hubs are the only parameterised non-article routes (`/[category]`); unknown slugs 404.

## 5. Internal linking patterns

| Pattern | Implementation |
| --- | --- |
| Breadcrumbs | `Breadcrumbs` component on every article header + matching `BreadcrumbList` JSON-LD (Home → type index → article) |
| Related articles | `getRelatedArticles()` — same category, latest 3, rendered as cards under the body; links back to the category hub ("All Tech") |
| Category cross-links | Article header eyebrow links the section (`/tech`); home page links all three hubs; footer carries sections + explore nav |
| In-prose links | `[label](/path)` inline syntax renders `next/link` with sun-coloured underlines — link to the methodology and related reviews inside the body (the demo articles model this) |
| Hub indexes | `/reviews`, `/best`, `/compare`, `/guides`, `/articles` via `TypeIndex`; category hubs list the category's articles |
| Authors | Byline links `/authors/[slug]`; author pages list their articles (Person JSON-LD ties them together) |

## 6. Freshness fields

| Field | Meaning | Where used |
| --- | --- | --- |
| `publishedAt` | First publication; set once | Sorting, RSS `pubDate`, OG `publishedTime`, JSON-LD `datePublished` |
| `updatedAt` | Automatic on every save | "Updated <date>" in the header, sitemap `lastModified`, JSON-LD/OG `dateModified` |
| `lastReviewedAt` | Last editorial fact-check | "Fact-checked <date>" in the header — set it when re-verifying, not on cosmetic edits |

Never reset `publishedAt` on an update; the freshness story depends on the trio being honest.

## 7. Redirect handling

- `Redirect` model (`from` unique, `to`, `statusCode`, `active`) + seed sample `/old-esim-guide` → `/best/best-esim-providers`. Nothing serves these rows yet — wiring options are documented in ARCHITECTURE.md §8.
- `/go/[offerId]` affiliate redirects are excluded from indexing via robots.txt; they must never be used as canonical article URLs.
- When an article moves slug or type, add a `Redirect` row with the old path as `from` and keep it active — old sitemap/RSS entries and external links keep resolving.

## 8. Pre-publish checklist (new article)

1. Title ≤ ~60 characters, declarative, no hype adjectives (EDITORIAL_GUIDE.md §8).
2. `deck` written as a standfirst (one or two sentences, states the verdict angle) — it is the meta description and RSS description.
3. TL;DR filled for reviews/roundups/versus.
4. ≥2 source citations (methodology + external/merchant docs) via `SourceCitation` or a `sources` block.
5. If review: `ReviewScore` criteria with weights + `reviewerId` set + `lastReviewedAt`.
6. Hero image with meaningful `heroAlt` (and `heroCredit`); images live in `public/images/`.
7. Blocks validated with `serializeBlocks()`; every affiliate mention uses `go:OFFER_ID`, never a raw URL.
8. Tags attached (`ArticleTag`) and correct `categoryId`.
9. After publish: admin revalidates article path, type index, home, sitemap and feed; verify the page, then check `/sitemap.xml` and `/feed.xml` include it (`npm run test` covers the plumbing).
10. Confirm the canonical URL is the intended one (correct type prefix) and the article 404s under every other prefix.
