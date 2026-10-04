# Design & SEO — tokens, metadata, structured data

Read before any visual, token, metadata, schema or SEO decision. Full references:
`DESIGN.md`, `SEO_GUIDE.md` at repo root (they are the contracts — this file is the incident
list + index).

## The @theme inline trap (bitten on a sibling project)

Tailwind v4 compiles `bg-gold/20`, `hover:text-bronze`, `from-cream` etc. from `--color-*`
variables **registered in `@theme inline` inside `src/app/globals.css`**. Adding a colour to
`:root` without its `--color-*` line in the same edit compiles to nothing, silently, with a
green build. The do-not-change list lives in `DESIGN.md` — the palette (warm paper, charcoal,
single vermilion accent, sun-disc motif, hairline rules) is the product's identity; do not
redesign, protect.

## SEO invariants (SEO_GUIDE.md is the full contract)

- One canonical URL per article type (`articleTypePaths` in `src/lib/site.ts`); canonical +
  OG + JSON-LD emitted by `src/lib/seo.ts`; **never emit fake `Review`/`aggregateRating`
  structured data** on demo content (the codebase already refuses — keep it).
- `robots.ts` disallows `/admin`, `/api/`, `/go/`, `/search` — affinity router stays out of
  indexes.
- OG fallback is `/images/og-default.png` (code-referenced; deleting it breaks every page
  without an explicit og:image — the media page shows it as protected).
- Feeds: `/feed.xml` + `/feed.json`, both support `?category=` / `?tag=` scopes; unknown slug
  404, category+tag together 400. Keep the guard rails.
- `scheduled publishing`: `liveDateGuard()` hides future-dated published stories everywhere
  public; admin shows the Scheduled badge. Do not "unhide" them for testing by lowering
  `publishedAt` unless you intend to publish.

## The verification habit

Design/SEO work is not done until the **rendered page** is checked: both themes, 1280 and 375,
no horizontal overflow, console clean, canonical/metadata match the route. `scripts/smoke.mjs`
covers statuses; it cannot see pixels. Visual claims need a screenshot or a browser probe, not
a class list.