# DESIGN.md — duyanblog.com

The design system of record. The look is: warm paper, charcoal ink, one burnt-orange primary, golden ochre support, a single controlled vermilion accent, sun-disc geometry, hairline rules and aggressive typographic hierarchy. Inspired by an editorial "warm modernism" direction; all values are original. Source of truth: `src/app/globals.css`.

## 1. Identity — the nón lá mark

A Vietnamese conical hat reduced to geometry. Construction of the canonical path (viewBox `0 0 64 64`, identical in `LogoMark` in `src/components/logo.tsx` and all SVG files):

- **Cone silhouette:** `M32 8 L59 49 Q32 57.5 5 49 Z` — apex at (32,8), straight edges to (59,49) and (5,49), the bottom edge is a shallow downward-bulging quadratic curve through (32,57.5). A cone with a softly curved brim, not a triangle.
- **Two rib lines, knocked out:** two thin lens-shaped subpaths (`M16.85 31 … Z` and `M9.6 42 … Z`), each a 3.5-unit-tall pair of quadratic arcs spanning the cone. Because the path uses `fill-rule="evenodd"`, these are *transparent holes*, not drawn lines — the mark reads on any background and recolours via `currentColor`.
- **Sun dot:** `M29.4 21.5 a2.6 2.6 … Z` — a 2.6-radius circle knocked out near the apex, sitting between the ribs and the tip.
- **Wordmark:** "duyanblog" in the display serif + a vermilion period (`LogoWordmark`); the period is part of the identity ("verdicts end with a full stop").

| File | Contents |
| --- | --- |
| `public/logo/logo-symbol.svg` | Hat only, `currentColor`, transparent background |
| `public/logo/logo-horizontal.svg` | Hat + serif wordmark + vermilion dot, fixed `#25201A`/`#B4561F` for contexts without webfonts |
| `public/logo/logo-black.svg` / `logo-white.svg` | Single-colour exports |
| `public/favicon.svg` | Vermilion rounded square (rx 14, `#B4561F`) with the hat knocked out in cream; no sun dot at this size |

The hero on `/` composes the mark at 3.2× scale with a drifting sun disc (`var(--sun)`) and hairline horizon (`src/app/page.tsx`).

## 2. Colour system (exact values — do not round, do not "improve")

All tokens live in `src/app/globals.css` (`:root` light, `.dark` dark) and are exposed to Tailwind via `@theme inline`. Everything is OKLCH.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--background` (paper) | `oklch(0.977 0.011 88)` | `oklch(0.222 0.014 55)` | Page ground — warm paper / deep umber |
| `--foreground` (charcoal ink) | `oklch(0.252 0.02 55)` | `oklch(0.93 0.012 82)` | Text; also equals `--ink` |
| `--card` / `--popover` | `oklch(0.991 0.007 90)` | `oklch(0.258 0.015 55)` | Raised surfaces |
| `--primary` (burnt orange) | `oklch(0.585 0.148 46)` | `oklch(0.755 0.135 58)` | Buttons, prices, score dials, bullet dots |
| `--primary-foreground` | `oklch(0.985 0.01 85)` | `oklch(0.2 0.02 50)` | Text on primary |
| `--secondary` (golden ochre) | `oklch(0.842 0.098 82)` | `oklch(0.78 0.1 78)` | Badges, TL;DR box tint, avatar circles |
| `--secondary-foreground` | `oklch(0.3 0.03 60)` | `oklch(0.2 0.02 50)` | |
| `--muted` / `--muted-foreground` | `oklch(0.941 0.014 84)` / `oklch(0.482 0.02 62)` | `oklch(0.3 0.014 55)` / `oklch(0.72 0.015 70)` | Quiet panels and secondary text |
| `--accent` | `oklch(0.912 0.03 84)` | `oklch(0.32 0.02 55)` | Hover washes |
| `--destructive` | `oklch(0.505 0.19 27)` | `oklch(0.665 0.19 28)` | Form errors only |
| `--border` / `--input` | `oklch(0.885 0.018 80)` / `oklch(0.86 0.018 80)` | `oklch(0.34 0.014 55)` / `oklch(0.36 0.014 55)` | Hairline rules everywhere |
| `--ring` | = primary | = primary | Focus rings |
| `--sun` (sun disc) | `oklch(0.735 0.148 70)` | `oklch(0.78 0.13 70)` | Hero sun, internal-link underlines (`decoration-sun`), text selection background |
| `--vermilion` (the accent) | `oklch(0.545 0.19 30)` | `oklch(0.68 0.185 30)` | See the single-accent rule below |
| `--ochre` (editorial) | `oklch(0.722 0.128 76)` | `oklch(0.78 0.115 76)` | Mid scores, note-callout border, warning icon |
| `--ink` | `oklch(0.252 0.02 55)` | `oklch(0.93 0.012 82)` | Dark bands (`bg-ink`) — note it *inverts* in dark mode |
| `--radius` | `0.375rem` | — | See radii below |

Dark mode is class-based (`@custom-variant dark`, `next-themes`, `suppressHydrationWarning` on `<html>`). Viewport theme colors: `#f8f4ea` light / `#231f19` dark (`layout.tsx`).

**Single controlled red accent rule.** Vermilion is used only for: the wordmark period, sentence-ending periods on display headlines, the H1/eyebrow accents, numbered section indices, warning callout borders, deal text, low score tones, the comparison winner dot, and affiliate inline-link underlines (`decoration-vermilion/60`). It is never a background, never a button, never more than one accent moment per view. Nothing else in the palette may carry that saturation level — the system has one shout.

**No blue/purple rule.** There is no blue and no purple anywhere in the palette, and hue angles are all in the 27–90 range (warm). Adding a link that "default blue" styles itself is a regression, not a convenience.

## 3. Typography

| Face | Use | Config (`src/app/layout.tsx`) |
| --- | --- | --- |
| Fraunces (display serif) | H1–H4, prices, scores, pick ranks, wordmark | `subsets: ["latin","latin-ext","vietnamese"]`, `variable: "--font-fraunces"`, **`axes: ["opsz"]`**, `display: "swap"` |
| Inter (UI/body) | Body, UI, nav, small print | same subsets, `variable: "--font-inter"` |

- `@theme inline` maps `--font-display` → Fraunces stack and `--font-sans` → Inter stack; `h1–h4` get `font-display` + `letter-spacing: -0.015em` in `@layer base`.
- **Do not add fixed `weight` to the Fraunces import.** `next/font` rejects combining an explicit weight list with a variable-font `axes` option — the build fails. Weight styling (e.g. `font-semibold`) is done in CSS, and Fraunces is loaded as a variable font across its weight range.
- **The `vietnamese` subset is required** — the publication is Vietnamese-rooted and diacritics must render in display type. Removing subsets changes the served font files and breaks diacritics.
- Scale anchors: hero H1 `text-5xl → lg:text-[4.4rem] leading-[1.04]`; article H1 `text-4xl sm:text-5xl leading-[1.08]`; body `.prose-body` = `1.0625rem`/`1.78`; long-form measure `.prose-measure` = `68ch`.
- Small caps label: `.eyebrow` = `0.7rem / 600 / 0.16em tracking / uppercase`; `.section-index` adds `font-variant-numeric: tabular-nums` for the "01 —" indices.

## 4. Spacing, radii, edges

- `--radius: 0.375rem`; `--radius-sm/md/lg/xl` derive from it. **Sharp editorial look** — cards, tables and callouts are `rounded-sm`/`rounded-md` at most. No giant rounded rectangles, no `rounded-3xl`, no pill-shaped containers (the only `rounded-full` elements are dots, avatars, sun circles and the scrollbar thumb).
- Hairline rules structure every page: `border-border` on section boundaries, header strip, card edges; "hairline table" trick = `grid gap-px bg-border` with `bg-card` cells (home sections grid, score cells, methodology band cards).
- Section rhythm: content sections use `py-14`–`py-16` with alternating plain / `bg-muted/40` bands.
- Content width: `max-w-6xl` shell; long-form uses `max-w-3xl` (roundup/versus/guide bodies) or `lg:col-span-8` of the 12-column grid (reviews) with a sticky `lg:col-span-4` sidebar.

## 5. Visual motifs

| Motif | Where | How |
| --- | --- | --- |
| Sun disc | Hero background, newsletter card ornament | `rounded-full bg-sun/25` + concentric `border-border` rings; hero sun is an SVG circle `fill="var(--sun)"` |
| Numbered sections | Home, category hubs | `SectionHeading index="01"` (`src/components/editorial/section-heading.tsx`) renders vermilion `01 — Title … View all →` over a hairline; pick ranks and stat cells reuse `section-index` |
| Eyebrow small caps | Every label ("Versus", "The short version", merchant names) | `.eyebrow` class |
| Dark methodology band | Home bottom band, footer | Non-inverting band tokens `--band-bg`/`--band-fg` (mapped as `bg-band-bg`/`text-band-fg`): a dark panel with cream text in BOTH themes. Light `oklch(0.252 0.02 55)`/`oklch(0.93 0.012 82)`; dark stays a dark panel `oklch(0.15 …)` with the same cream text — it deliberately does not follow `--ink`'s inversion |
| Asymmetric grids | Hero `lg:grid-cols-12` (7/5), review layout (8/4), versus teaser (5/7) | Never equal-thirds card rows; the only 3-col grid is the sections grid, which is a `gap-px` hairline table, not cards |
| Sentence-period accent | Hero, section headlines, H2s | `<span className="text-vermilion">.</span>` at the end of display headlines |
| Winner dot | Comparison table best-in-row | 1.5-dot `bg-vermilion` + sr-only "(best)" |

## 6. Motion

- **Reveal** (`src/components/reveal.tsx`): IntersectionObserver (threshold 0.12, rootMargin `-6%` bottom) sets `data-in="1"`; CSS `.reveal` transitions opacity + `translateY(14px)` over 0.7 s `cubic-bezier(0.2, 0.6, 0.2, 1)`. One-shot; unobserved after entry.
- **Drift**: `.animate-drift` — the hero sun floats `translateY(-10px)` over 8 s, ease-in-out, infinite. The only looping animation on the site.
- **`prefers-reduced-motion: reduce` kills everything** (`globals.css`): all animation/transition durations forced to 0.01 ms, `.reveal` forced visible, smooth scroll disabled. Any new animation must be covered by this block.
- Nothing bounces, nothing scales on hover except 0.5px arrow nudges (`group-hover:translate-x-0.5`) and underline offsets.

## 7. Do not change casually (failure modes included)

| Rule | Failure mode if changed |
| --- | --- |
| Palette values in `globals.css` (exact OKLCH above) | The palette is tuned so `--primary` passes on paper and `--vermilion` stays scarce; "prettier" values drift the whole site into generic-landing-page territory and break dark-mode contrast pairs (e.g. `--secondary-foreground` is paired to its `--secondary`) |
| The evenodd logo path | The rib lines and sun dot exist only because of `fill-rule="evenodd"`; changing fill rule or merging subpaths turns them solid and the mark stops working on dark backgrounds. It is duplicated intentionally in `logo.tsx`, the SVG files and the hero — keep them in sync |
| Fraunces config (`axes: ["opsz"]`, no `weight`, `vietnamese` subset) | Adding `weight` breaks the build (invalid next/font combo); dropping the vietnamese subset breaks diacritics; changing `variable` names breaks `--font-display` mapping |
| Single controlled vermilion accent | A second saturated accent (or vermilion as background/button) destroys the hierarchy the whole layout relies on; the reader's eye must land on the verdict, the number, the period |
| No blue / no purple / no gradients / no glassmorphism / no pill-soup | These are the site's anti-generic rules. A `backdrop-blur` card, a gradient hero or a rounded-full CTA reintroduces the template look this design exists to avoid |
| `--radius: 0.375rem` and the sharp edges | Bumping radii is the fastest way to make an editorial site look like a SaaS dashboard |
| Footer sticky pattern (`body` = `min-h-screen flex flex-col`, `main` = `flex-1 flex flex-col`, footer = `mt-auto`) | Short pages (404, policy) will leave the footer floating mid-screen if layout classes change |
| `prefers-reduced-motion` block | New animations would keep moving for motion-sensitive users |
| `eyebrow` / `section-index` classes | Labels are a structural motif; restyling them per-component fragments the voice |

## 8. Anti-slop checklist (used during the design pass; re-run it on every new page)

- No card soup: repeated surfaces must differ in weight (feature vs row vs wire item on the home page), not be N identical cards.
- Every decoration has a job: sun = masthead identity; hairlines = structure; numbers = ordering; the period = finality. If a shape doesn't carry information, delete it.
- Aggressive typographic hierarchy: display serif at 4rem+ against 0.7rem small caps; body never above 1.0625rem; mute the secondary text (`text-muted-foreground`) rather than shrinking everything.
- Copy does real work: no "Lorem", no "Welcome to our website", no stock hero adjectives; headlines are short declaratives ending in a vermilion period.
- Commerce never visually outshouts the verdict: buy buttons are standard `Button` variants, badges are ochre, deal text is vermilion small caps — never animated, never pulsing.
- Accessibility floor: focus-visible rings (`--ring`), `sr-only` context on icon-only controls and winner dots, `aria-live` on sort status and form errors, skip link in `layout.tsx`.
