# PRODUCT.md — duyanblog.com

What this product is for, who it serves, how it makes money, and the rules that protect it. Code references are given where a rule is enforced in software.

## Purpose

duyanblog.com is an independent editorial review publication. It exists to help people make software, travel and technology decisions with **the reasoning visible**: named authors, published methodology, sources listed, trade-offs stated plainly. The tagline — "Reviews with reasons attached." — is the product specification in three words (`site.tagline` in `src/lib/site.ts`).

## Users

| Audience | What they need | Where the product serves them |
| --- | --- | --- |
| Readers researching a decision (buy a laptop, pick an eSIM, choose a host, choose a VPN) | A defensible verdict, the criteria behind it, the counter-arguments, and a safe purchase path | Article pages (TL;DR box, score breakdown with weights, pros/cons, comparison tables), `/deals` |
| Editors/authors (internal) | A way to write structured content without a rich-text swamp, with revisions and review discipline | Admin area (pending, Task 3-a); block schema in `src/lib/content-schema.ts` is the contract |
| Future advertisers/merchants | Clear rules of engagement: labelled placements, no influence on verdicts | `/how-we-make-money`, `/advertising-disclosure` (copy in `src/content/policies.ts`) |

## Business model

| Stream | Status | Rules |
| --- | --- | --- |
| Affiliate commissions | Implemented (offer model, `/go` router, click logging) | Verdicts finalised before rate considerations; disclosure shown wherever commerce appears; `rel="sponsored"` on all commercial links. See AFFILIATE_INTEGRATION.md |
| Display advertising | Implemented as consent-gated `AdSlot` placeholders; no network wired | Off by default (`ads_enabled=false`); requires advertising consent; must never overwhelm editorial |
| Newsletter | Signup works (`/api/newsletter`, DB rows); sending not built | Double opt-in documented as follow-up (`NewsletterSubscriber.confirmed` defaults true) |
| Sponsorships / paid placements | Not built | Must be labelled, produced separately from editorial, never scored or ranked (policy copy already commits to this) |
| Leads / other | Not built | Same independence rules apply |

The publisher note shown in the footer and hero: "Reader-supported: we may earn a commission when you buy through links on this site. It never changes our verdicts." (`site.publisherNote`).

## Content model

Five article types, each with exactly one canonical URL prefix (`articleTypePaths` in `src/lib/site.ts`). A slug lives under one type only — the same slug under another prefix 404s (enforced per route, see SEO_GUIDE.md).

| Type | URL | Use it for | Demo example (seed) |
| --- | --- | --- | --- |
| `review` | `/reviews/[slug]` | Verdict on one product after testing; scores with weights | `auralis-note-14-review`, `terrasim-go-review` |
| `roundup` | `/best/[slug]` | "Best X for Y" ranked picks | `best-esim-providers` |
| `versus` | `/compare/[slug]` | Two (rarely three) options head-to-head with a sortable table | `cloudpeak-vs-harborstack` |
| `guide` | `/guides/[slug]` | Evergreen how-to / decision frameworks | `choose-a-vpn` |
| `editorial` | `/articles/[slug]` | Opinion, policy-in-practice, notes on the publication | `why-we-publish-testing-notes` |

Three sections (Category rows, slug = URL prefix): `/software` (Software & AI), `/travel` (Travel & Connectivity), `/tech` (Tech & Hosting). Every article belongs to exactly one section (`Article.categoryId`, onDelete Restrict).

Supporting content: author profiles (`/authors/[slug]`), methodology hub (`/methodology` + DB-backed `MethodologyEntry` detail pages), deals index (`/deals`, active `isDeal` offers), search, contact, and eight policy pages.

### Route map (public surface as built)

| Route | Source | Role |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Hero, featured story + "the wire", section grid, versus teaser, top picks, guides, methodology band, newsletter |
| `/reviews`, `/best`, `/compare`, `/guides`, `/articles` | `src/app/<type>/page.tsx` | Type indexes (`TypeIndex` component) |
| `/reviews/[slug]` etc. | `src/app/<type>/[slug]/page.tsx` | Article detail; review variant adds score dial + "Where to buy" sidebar |
| `/software`, `/travel`, `/tech` | `src/app/[category]/page.tsx` | Section hubs with ItemList JSON-LD |
| `/deals` | `src/app/deals/page.tsx` | Active `isDeal` offers, revalidate 120 |
| `/authors`, `/authors/[slug]` | `src/app/authors/…` | Named-human trust surface (Person JSON-LD) |
| `/methodology`, `/methodology/[entry]` | `src/app/methodology/…` | Static intro + DB `MethodologyEntry` playbooks |
| `/search`, `/contact`, `/about` | `src/app/…` | noIndex search, contact form + `/api/contact`, about |
| 8 policy pages | `src/content/policies.ts` + `src/app/<slug>/page.tsx` | editorial-policy, how-we-make-money, affiliate-disclosure, advertising-disclosure, corrections-policy, privacy-policy, cookie-policy, terms |
| `/go/[offerId]`, `/api/newsletter`, `/api/contact`, `/feed.xml`, `/sitemap.xml`, `/robots.txt` | route handlers | Commerce, capture, syndication |

### Demo dataset shipped by `npm run seed:demo`

| Entity | Contents (all fictional) |
| --- | --- |
| Authors | Duy An Tran (`duyan`), Mai Linh (`mai-linh`), Khoa (`khoa`) |
| Sections | software, travel, tech |
| Merchants | NomadLink, TerraSIM, Waveline (eSIM); Cloudpeak Hosting, Harborstack (hosting); Auralis (laptops); Meridian VPN |
| Articles | 2 reviews, 1 roundup (`best-esim-providers`), 1 versus (`cloudpeak-vs-harborstack`), 1 guide (`choose-a-vpn`), 1 editorial (`why-we-publish-testing-notes`) |
| Comparison | `cloudpeak-vs-harborstack-table` attached to the versus article |
| Extras | 3 tags, 1 methodology playbook (`esim-testing-playbook`), sample redirect `/old-esim-guide`, `ads_enabled=false`, `demo_mode=true`, zero admin users |

## Success signals (what "working" looks like)

- A reader can recompute any score from the published criteria and weights and get the same number.
- Every commercial click is preceded by a disclosure the reader actually passed (inline or box).
- Corrections are findable: `updatedAt`/`lastReviewedAt` move, and verdict changes come with dated notes.
- The demo labels are impossible to miss — no seeded product reads as a real recommendation.
- Editorial velocity does not depend on developers: everything above is data (blocks, offers, comparisons), not code.

## Trust principles

These are enforced or at least structurally supported by the code — keep them true.

1. **Named authors + second reviewer on reviews.** `Article.authorId` is required; `Article.reviewerId` is optional but the review pages, policy copy and JSON-LD assume it for reviews. The article header renders author, reviewer, and published/updated/fact-checked dates (`src/components/editorial/article-header.tsx`).
2. **Published methodology.** Every score block and roundup links to `/methodology`; the methodology index plus per-vertical playbooks live in `MethodologyEntry`.
3. **No fabricated stats, credentials or awards.** Author `role` is a role, never a credential (`prisma/schema.prisma` comment on `Author.role`); policies forbid invented numbers; where evidence is thin the demo copy says so explicitly ("one honest sample, not a lab").
4. **Corrections stay public.** `/corrections-policy` commits to dated public corrections; `Article.updatedAt` is always rendered and fed to `dateModified` JSON-LD — never quietly reset.
5. **Sample content is always labelled.** The demo build renders `DemoNotice` on every article page and "demo merchant" hints inside offer cards (`merchant-offer.tsx`), and the footer states it. When real content replaces demo data, the `demo_mode` setting and these notices are what to retire — deliberately, page by page.
6. **Commerce never edits.** Scores come from `ReviewScore` rows with published weights; buy buttons are separate components that never receive score data.

## Future expansion (deliberately not built)

| Item | Notes / constraints |
| --- | --- |
| Finance vertical | Only with an explicit **no-financial-advice** rule page and language vetting; affiliate money in finance is exactly where independence dies — needs the strongest labelling of any vertical |
| Double opt-in newsletter | Add a confirmation token + confirmed-at flow to `NewsletterSubscriber`; until then treat the list as single-opt-in and say so in the privacy policy |
| Comments | Prefer a third-party host with heavy moderation; anonymous comments conflict with the "named humans" principle |
| User accounts (reader-facing) | No use case yet; admin-only auth exists. If added, extend the Session model rather than inventing a second auth system |
| Real ad network | Wire inside `AdSlot` after the consent gate; see AFFILIATE_INTEGRATION.md for the steps |
| More sections | `Category.accent` currently supports `amber | ochre | vermilion`; adding colours is a DESIGN.md change, not a free choice |
