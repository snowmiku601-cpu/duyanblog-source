# AFFILIATE_INTEGRATION.md — duyanblog.com

How commerce works: the components, the data model, the click router, logging, and what to change to go live. Governing principle (implemented, not aspirational): **affiliate navigation never depends on consent** — navigation and tracking are separate concerns.

## 1. Component inventory

| Component / helper | File | Purpose |
| --- | --- | --- |
| `affiliateHref(offerId, articleSlug?)` | `src/components/affiliate/affiliate-link.tsx` | Builds `/go/<offerId>[?src=<articleSlug>]` — the only sanctioned way to reference an offer |
| `AffiliateLink` | same | Inline anchor, `rel="sponsored noopener"`, `target="_blank"` |
| `AffiliateButton` | same | Button wrapper around the same anchor (used by offer cards, comparison cells, picks) |
| `AffiliateDisclosure` | same | `variant="inline"` (small text) or `"box"` (aside with links to /affiliate-disclosure, /methodology, /how-we-make-money); rendered above the body and inside offer cards |
| `MerchantOffer` | `src/components/affiliate/merchant-offer.tsx` | The standard offer card: merchant eyebrow, label, badge, price, deal text, note, buy button, "(demo)" hint, disclosure |
| `ComparisonOffer` | same | Compact CTA for table cells and pick rows ("Get it — $32.50") |
| `AdSlot` | `src/components/affiliate/ad-slot.tsx` | Consent-gated ad container; placeholder until a network is wired |
| `GET /go/[offerId]` | `src/app/go/[offerId]/route.ts` | The 302 click router (see §3) |
| `offerToView()` | `src/lib/offers.ts` | Maps an `AffiliateOffer` row (+merchant) to the `OfferView` view model the components accept |

Article prose does not use these components directly — it uses the `[label](go:OFFER_ID)` inline syntax, which `src/components/editorial/inline-text.tsx` renders as a `/go/` link with `rel="sponsored noopener"`.

## 2. Offer data model

`AffiliateOffer` (`prisma/schema.prisma`):

| Field | Notes |
| --- | --- |
| `id` | cuid, or a stable seeded id like `off_nomadlink_global30` — **article copy references offers by this id**, so ids are permanent once published |
| `merchantId` → `Merchant` | Merchant owns name, website, note (onDelete Restrict: delete the merchant's offers first) |
| `articleId?` → `Article` | Optional attachment; drives the "Where to buy" sidebar on that article |
| `label` | Reader-facing line, e.g. "NomadLink Global 30 — 15GB across 120+ countries" |
| `url` | Destination. **Must be `https:`** (validated at input; the `/go` router 302s straight to it — never store `http://` or `javascript:`). Demo seed uses `https://example-*.test/...?ref=duyanblog-demo` |
| `price`, `currency` (default USD) | Display strings; prices are examples in demo mode |
| `note`, `badge`, `isDeal`, `dealText` | Editorial framing: "Best overall" badge, "15% off first purchase" deal text; `isDeal` rows feed `/deals` |
| `active` | Inactive offers stop resolving in `/go` (falls back to `/deals`) and disappear from sidebars/tables |
| `order` | Sidebar/table ordering |

Related models: `AffiliateClick` (§4), `ComparisonItem.offerId` (a comparison column can carry an offer). The seeded dataset ships 7 merchants and 7 offers across eSIM, hosting, laptop and VPN demos.

## 3. Click routing — `/go/[offerId]`

`src/app/go/[offerId]/route.ts`, `export const dynamic = "force-dynamic"`:

1. Look up the offer by id **with `active: true`**; unknown/inactive → `302` to `/deals` (never an error page).
2. Log an `AffiliateClick` (failures are caught and logged, never blocking navigation).
3. `302` redirect to the offer's declared `url`. No interstitials, no URL rewriting, no deceptive redirects.

Because this is a plain server-side 302, it works for every visitor regardless of consent state — the click itself is navigation, not tracking. Robots disallows `/go/`.

## 4. Click logging — `AffiliateClick`

| Field | Policy |
| --- | --- |
| `offerId`, `articleId?` | What was clicked and from which article |
| `referer` | The `?src=` hint param (article slug, max 200 chars) when present, else the HTTP Referer header truncated to 500; no IP address is stored anywhere |
| `sessionHash?` | Reserved for a salted, non-reversible identifier; unused by the current router |
| `consentAnalytics` | **Consent snapshot.** The server cannot read the localStorage consent store, so the router accepts an explicit, non-identifying `c=1` query hint (client MAY append it; navigation is identical without it) and stores `true` only for that. Reporting can then separate consented vs unconsented clicks honestly |
| `createdAt` | Time of click |

The `src` param is appended by `affiliateHref()`/`inline-text.tsx` from the article slug.

## 5. Link hygiene — `rel="sponsored noopener"`

Every commercial anchor — `AffiliateLink`, `AffiliateButton`, inline `go:` links — carries `rel="sponsored noopener"` and `target="_blank"`. `sponsored` is the search-engine signal for paid links; `noopener` pairs with `target="_blank"`. External non-commercial links in prose get `nofollow noopener` instead. Do not "upgrade" sponsored links to `dofollow` for partners; that breaks the published how-we-make-money policy.

## 6. Replacing demo merchant URLs with real ones

The demo database contains fictional merchants (`example-*.test`). Go-live sequence:

1. Create real `Merchant` rows (name, website).
2. Create real `AffiliateOffer` rows per article — **keep the same offer ids where an offer replaces a demo one** (`off_auralis_direct` etc.). Offer ids are referenced from article blocks (`go:off_auralis_direct`), pick blocks (`offerId`) and comparison items, and they are stable by design; reusing ids means zero article edits. If you must create new ids, update every referencing block.
3. Set the real destination `url` (https), `price`, `badge`, `dealText`, `active=true`; mark the demo offers `active=false` or delete them after re-pointing.
4. Update article prose only where the *label text* names a product you no longer sell — the `go:` references themselves resolve through the offer id.
5. Re-run the flow manually: click a buy button, confirm the 302 target and that an `AffiliateClick` row lands.
6. Retire the demo labelling (DemoNotice, "demo merchant" strings, footer disclaimer, `demo_mode` setting) once no demo content remains visible.

## 7. Ad enablement (AdSlot)

Current state: `AdSlot` renders a reserved, labelled placeholder and nothing else. `ads_enabled` defaults to `false` (seeded `SiteSetting`); `NEXT_PUBLIC_ADS_ENABLED` in `.env.example` is documented as a force-enable but is **not read by code yet** — the runtime gate is the DB setting. To actually serve ads:

1. Enable the switch: set `ads_enabled = "true"` in the site settings (admin settings page when it exists; until then a DB update — remember to `invalidateSettingsCache()`), or wire the `NEXT_PUBLIC_ADS_ENABLED` fallback into the pages that pass `enabled={isAdsEnabled(settings)}`.
2. Wire a real network **inside `AdSlot`**, after both gates: `enabled` (server) AND `loadConsent()?.advertising === true` (client, live-updating via `onConsentChange`). The component must never load third-party script before advertising consent.
3. Keep the reserved box (`min-h-24`, dashed border) to avoid layout shift when ads load.
4. Respect the editorial rule: ads never overwhelm the page — current placements are one per article body (`review-top`, `roundup-top`) plus sidebar space. New placements need the same restraint and a disclosure (`/advertising-disclosure`).

## 8. Compliance notes

- **Disclosure proximity:** `AffiliateDisclosure` renders directly above article bodies (box variant), inside `MerchantOffer` cards, and the comparison table footer states that buy links are affiliate links. Disclosure is one click from every offer (`/affiliate-disclosure`).
- **No deceptive redirects:** the `/go` destination is always the offer's declared merchant URL; logging is anonymous (no IP).
- **Legacy-URL redirects** are served at runtime by `src/proxy.ts` from the admin-managed `Redirect` table (30s cache TTL, chain-resolving, query-preserving). They are site navigation — kept entirely separate from `/go` click tracking, and they work regardless of consent state. See ARCHITECTURE.md §8.
- **Consent layer honesty:** `src/lib/consent.ts` + the banner are a functional consent store (necessary/analytics/advertising, localStorage + events), but this is **not a certified CMP** and the code says so in its header comment. If targeting EU traffic at scale, swap in a real certified CMP — keep or map the same event contract (`dy:consent`, `dy:consent-open`, storage shape) so `AdSlot` and `trackEvent` keep working; the gating logic itself (`loadConsent()?.advertising`) is the integration point, not the banner UI.
- **Policy pages** (`src/content/policies.ts`): `/affiliate-disclosure`, `/how-we-make-money`, `/advertising-disclosure` commit the site to specific behaviour (no preview/veto for merchants, verdicts before rates, labelled sponsorships). Any affiliate feature that violates those pages is a bug.
