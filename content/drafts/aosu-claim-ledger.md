# aosu security camera guide — claim and evidence ledger

Checked **November 26, 2026 (2026-11-26)**. **LOCAL DRAFT ONLY**. Task ID: 63.
Route: `/guides/how-to-choose-aosu-security-cameras`; guide/tech; draft; publishedAt=null;
lastReviewedAt=2026-11-26T00:00:00.000Z; isDemo=false. No DB rows created.

## Evidence method and boundaries

Primary evidence is the owner-supplied cache checked 2026-11-26 under `tmp/task-aosu/downloads/`
and `prefetch-summary.json` (22 available parent listings, including bundles). A single compact
Node extractor, `tmp/task-aosu/extract-evidence.mjs`, removed scripts/styles/SVGs, made line-numberable
plain-text extracts and recorded selected variant amounts, availability, displayed sale-price
HTML line anchors, og:image and HTML/JSON SHA-256 in `extracted-evidence.json`. Spec-image URLs
were extracted from the same cached galleries; missing image-only facts were read from actual
pixels, with URL/status/decode/hash records in `spec-image-evidence.json`. No product or policy
catalog page was re-fetched. Two targeted official buying-guide pages supplied missing powered
recording/installation details; sanitized extracts/hashes are in `extra-evidence.json`.

The saved HTML displays USD, but the country selector says **Vietnam (USD $)**. We do not call
this a completed US checkout, a US-localized session or a reservation. USD amount parity is
verified for the exact selected variants; country-specific checkout eligibility remains separate.
All five have parent available=true, selected available=true and four enabled Add to cart submit
controls in the captured HTML. A hidden Sold out badge exists in the theme template; it is not
visible stock status. The controls have no disabled attribute. We do not fabricate an In stock
label absent from these pages. `extra-evidence.json` records cart HTML anchors. A global grep for
Sold out would incorrectly include hidden templates and unrelated recommendation cards.

This is documented research, not hands-on testing. Duyan did NOT measure motion detection latency,
night-vision clarity, Wi-Fi range, winter battery drain, weather sealing, detection accuracy,
energy use, electrical safety, encryption, app traffic or access controls. Manufacturer output,
capacity, resolution and compatibility statements are not Duyan measurements. No customer score,
review count, crime-prevention claim, certification or security guarantee is adopted. No Product,
Review, aggregateRating or FAQPage schema is added. Existing Article/BreadcrumbList rendering stays
unchanged. No Article/Merchant/AffiliateOffer database rows were created.

## Affiliate and image authorization

- GoAffPro **Store ID 7100712**, status **approved**, currency **USD**, from the verified data
  supplied in this task. We did not reopen credentials or independently call the API.
- Exact storefront: `https://www.aosulife.com/?ref=NGUYENTHIDUYAN`.
- Exact case-sensitive code: **NGUYENTHIDUYAN**; literal lowercase key `ref`.
- Product-level deep-link commission attribution is **unverified**. All five pick.url values use
  that storefront only. The unchanged renderer labels these **Visit merchant store**, keeps
  product headings plain, sets sponsored/noopener/new-tab and puts AffiliateDisclosure at each CTA.
- Every official source navigation URL has the same literal `?ref=NGUYENTHIDUYAN`; the existing
  isReferralUrl helper sponsors it. The helper identifies commercial parameters, not commission
  attribution or referral-value validity. Draft tests independently enforce exact key/value case.
- No raw merchant domain appears in paragraph/list/callout/FAQ prose. Source labels identify the
  merchant without a raw domain. CDN image requests are media, not navigation, and omit referral.
- No unconditional affiliate-price, discount or unchanged checkout-price promise. Merchant controls
  checkout; displayed prices, availability, destination, promotions, taxes and delivery can differ.
- IMAGE PERMISSION: **OWNER-REPORTED AUTHORIZATION** to use, crop, edit and composite official
  aosu product photography for this affiliate editorial, explicitly supplied for this session.
  **No written license**, signer, contract or independently verified legal grant is asserted.

## Selected variants: displayed price versus Shopify and cart evidence

| Pick / selected variant | Displayed USD store price | Shopify USD amount | Variant ID / SKU | Availability evidence |
|---|---:|---:|---|---|
| SolarCam System — 2-Cam Kit | $129.99 | $129.99 | 47706762641644 / C7L-2H | available=true; parentAvailable=true; cartEnabled=true; HTML sale L7761; cart L8396 |
| SolarCam P1 Max — Default Title | $99.99 | $99.99 | 46089260597484 / C8S | available=true; parentAvailable=true; cartEnabled=true; HTML sale L7711; cart L8225 |
| Video Doorbell Pro — Default Title | $95.99 | $95.99 | 42652737274092 / V8P | available=true; parentAvailable=true; cartEnabled=true; HTML sale L7642; cart L8156 |
| Floodlight Cam Pro — Floodlight Cam Pro only | $159.99 | $159.99 | 46957081854188 / L5P | available=true; parentAvailable=true; cartEnabled=true; HTML sale L7698; cart L8338 |
| IndoorCam P1 Pro — Default Title | $49.99 | $49.99 | 44288361038060 / C2P | available=true; parentAvailable=true; cartEnabled=true; HTML sale L7671; cart L8185 |

Displayed amounts are `<sale-price>` amounts, not crossed-out reference values. The seller's
Reference Price Policy says crossed-out amounts are internally estimated values rather than
historical transaction or prevailing-market prices. No savings percentage or historical-price
comparison is carried into the guide. C7L 4-Cam Kit is unavailable in JSON and is not selected;
C7L 6-Cam is a different amount/configuration. Floodlight bundles are not the L5P-only pick and
some bundle HTML/JSON prices disagree; no bundle amount is adopted.

## Source registry and model-specific claim map

Below, text lines refer to task-local extracts named after the cached handles, not live site
pagination. The original HTML/JSON and their hashes are retained. Every navigation URL is referral
suffixed. Image URLs in this ledger remain unmodified media references.

### S1 — SolarCam System with New aosuBase, C7L-2H

https://www.aosulife.com/products/aosu-solarcam-system-with-new-aosubase?ref=NGUYENTHIDUYAN

- Price/selected 2-Cam title: `aosu-solarcam-system-with-new-aosubase.txt` L19–29, L111–125,
  L137–173; JSON selected variant above. Job: **multi-camera solar perimeter**, an editorial
  synthesis of separate cameras sharing an included New aosuBase, not an all-property coverage test.
- **2K QHD / 6× zoom**: L177–178. Draft uses 2K only; no inferred pixel dimensions.
- **32GB built-in hub; up to 1TB; six cameras; expansion microSD sold separately**: L194–199.
  `spec-images/c7-4.png` independently shows the same caption and card-purchase footnote.
- **Recording to aosuBase during Wi-Fi outage**: L194–195. This is the merchant statement;
  it does not establish internet-independent remote alerts, battery backup for hub or indefinite
  operation. No promise of outage notification is made.
- **Alexa / Google Assistant**: L200–203. Only supported named integrations, no all-command claim.
- **Separate panels**: `spec-images/c7-6.png` (official gallery image
  `6_590a0f93-2f6e-4289-9e76-1b37239dc753.png?v=1780651179&width=1600`), read as flexible panel
  placement apart from camera. Lens/panel tradeoff is editorial, no performance measurement.
- **NOT FOUND:** exact router Wi-Fi band, hub uplink method, panel wattage, numeric sunlight-hours
  threshold, complete compatible-camera matrix. Explicit buyer confirmation conditions; no
  substitute D1 Max kit specifications are transferred to C7L.
- og:image: `https://www.aosulife.com/cdn/shop/files/C7L.png?v=1787714762&width=2048`.
- Thumbnail: `https://www.aosulife.com/cdn/shop/files/C7L.png?v=1787714762&width=240`.
  This is the merchant's generic kit og:image, not proof that every depicted accessory/kit count
  is included with C7L-2H; exact variant text, not the decorative thumbnail, defines the pick.

### S2 — SolarCam P1 Max, C8S

https://www.aosulife.com/products/solarcam-p1-max?ref=NGUYENTHIDUYAN

- Price: `solarcam-p1-max.txt` L17–27, L109–125; exact default variant C8S.
- **4K, integrated solar, camera-side microSD up to 128GB OR optional cloud**: L149–170.
  The page presents app setup and camera-side storage, but does not explicitly establish hub-free
  operation. P1 Max is the **single-camera sunlit outbuilding approach** candidate, subject to
  confirming direct-to-router use for C8S, not an asserted hub-free starter or aosuCortex bundle.
- **Two hours direct sunlight to power a day**: actual pixels in `spec-images/p1-solar.jpeg`,
  sourced from official gallery `3_a42f4428-a9e5-4d84-9b62-b65db470f440.jpg?v=1757680855&width=1600`.
  Attributed maker claim, not verified winter/shade/high-activity endurance or “free forever”.
- **Alexa / Google Assistant**: L189–190. Privacy zones appear L181–182, but no no-cloud promise.
- **NOT FOUND:** explicit hub-free/direct-to-router confirmation, exact Wi-Fi band and whether
  the card is supplied. Draft conditions the single-camera recommendation on confirming C8S
  connection requirements and says confirm/budget, not “included” or “definitely sold separately.” No unseen manual or third-party autogenerated
  manual website is accepted as a source. Integrated panel/lens-placement tradeoff is editorial.
- og:image: `https://www.aosulife.com/cdn/shop/files/SolarCamP1Max.png?v=1757680855&width=2048`.
- Thumbnail: `https://www.aosulife.com/cdn/shop/files/SolarCamP1Max.png?v=1757680855&width=240`.

### S3 — Video Doorbell Pro, V8P

https://www.aosulife.com/products/video-doorbell-pro?ref=NGUYENTHIDUYAN

- Price: `video-doorbell-pro.txt` L12–22, L104–120. **Battery front-door visitor calls** is the
  distinct job, not a whole-perimeter or wired-doorbell pick.
- **2K; built-in battery; aosuBase Mini included; 166° headline; Alexa and Google Assistant**:
  L18; L148–176. The advertised **180-day battery** is manufacturer marketing, expressly not
  promised in the guide.
- Comparison table: **133° horizontal, 103° vertical; 4:3; battery; SD up to 128GB on aosuBase
  Mini, card not included; 802.11 b/g/n at 2.4GHz**: L177–204. Headline 166° is not relabelled as
  horizontal or vertical and not silently replaced with a separate model's angle.
- **Wi-Fi conflict:** cached official bundle descriptions name enhanced 2.4/5GHz, including
  `aosu-t2-ultra-video-doorbell-pro-indoorcam-p1-pro.js.json` description and separate D1 Classic
  bundle. Draft reports conflict and plans conservatively for 2.4GHz, not guaranteed 5GHz.
- **NOT FOUND:** wired existing chime operation, transformer rating, whether a separately named
  chime is included, Mini's exact built-in capacity. “Mini inclusion” does not prove all those.
- og:image: `https://www.aosulife.com/cdn/shop/files/v8p_b200bc42-ac04-4607-aa94-e2a76f9871b9.png?v=1783057101&width=2048`.
- Thumbnail: `https://www.aosulife.com/cdn/shop/files/v8p_b200bc42-ac04-4607-aa94-e2a76f9871b9.png?v=1783057101&width=240`.

### S4 — Floodlight Cam Pro only, L5P

https://www.aosulife.com/products/floodlight-cam-pro?ref=NGUYENTHIDUYAN

- Price: `floodlight-cam-pro.txt` L14–24, L106–122; **Floodlight Cam Pro-only** variant, not a bundle.
- **5MP; 360° PTZ; three PIR sensors / 270° detection; adjustable 0–2,600 lumens; two light heads**:
  L183–206 plus S15 below. The 270° sensor detection region is not lens FOV or simultaneous
  panoramic recording. Rotation is not simultaneous all-direction coverage.
- **Wired; SD/cloud**: L225–240. **Siren**, model-specific local recording, human/pet/vehicle local
  detection and optional paid cloud: S15 L47–49 and cached official bundle descriptions.
- **Wired mains installation / existing light circuit / junction box / weather-rated box / new
  cable**: S15 L19–22, L77–83. This justifies mains AC installer planning, not a verified voltage
  range, a DIY wiring instruction or a guarantee of safe fit. No inferred wire colors/voltage.
- **Continuous microSD video + playback without subscription; local human/pet/vehicle detection
  without subscription; optional paid cloud**: S15 L47–50, L61–64, L88–89. Budget compatible card
  and installer cost. No all-features-free statement.
- Alexa/Google: `floodlight-cam-pro-media.json` official image alt and cached bundle description;
  official gallery `7-4_308838dd-5728-4605-8006-ab806a571835.jpg?v=1693484793&width=1144` names both.
- **NOT FOUND:** exact AC voltage, Wi-Fi band, maximum card capacity and siren dB. We do not borrow
  Ring's similarly named Floodlight Cam Pro data or third-party generated-manual values.
- og:image: `https://www.aosulife.com/cdn/shop/files/FloodlightCamPro.png?v=1768548879&width=2048`.
- Thumbnail: `https://www.aosulife.com/cdn/shop/files/FloodlightCamPro.png?v=1768548879&width=240`.

### S5 — IndoorCam P1 Pro, C2P

https://www.aosulife.com/products/indoorcam-p1-pro?ref=NGUYENTHIDUYAN

- Price: `indoorcam-p1-pro.txt` L14–24, L106–122. **Plug-in shared-room activity** is a distinct
  job, not outdoor perimeter, emergency supervision or a medical/life-safety monitor.
- **4MP, pan/tilt, 360° round-look preset, both 2.4GHz and 5GHz, one-touch calls, Privacy Mode**:
  L150–175. Exact mechanical tilt travel not stated; no invented 90°/155° specification.
- **8–128GB microSD, A1, Class 10, not included**: actual `spec-images/indoor-storage.jpeg`
  pixels, official gallery `white_fd9691ab-fcd1-4df3-a5d4-cc37668bcb61.jpg?v=1689500386&width=1630`.
- **Plug-in power, keep plugged in, select 24/7 local recording; cloud is event recording**:
  S16 L33–45, L66–70. This is not a battery camera; outlet/supplied-power-lead planning is
  reasonable editorial advice, not measured lead length. Adapter electrical ratings not verified.
- **Alexa / Google Assistant**: actual `spec-images/indoor-spec.jpeg` pixels (official 7_93c...
  gallery) name both; cached media alt also identifies both. 360° preset does not show all room
  directions at once. No outdoor weather rating is adopted.
- og:image: `https://www.aosulife.com/cdn/shop/files/C2P_f7323620-ba09-4465-8b23-6ba1de1b1389.png?v=1786001288&width=2048`.
- Thumbnail: `https://www.aosulife.com/cdn/shop/files/C2P_f7323620-ba09-4465-8b23-6ba1de1b1389.png?v=1786001288&width=240`.

### S6 — D1 Max single-camera trap (not selected)

https://www.aosulife.com/products/solarcam-d1-max?ref=NGUYENTHIDUYAN

`solarcam-d1-max.js.json` selected available variant: 48398557315308 / C9S, title exactly
**1-Cam(aosuBase not included)**, $89.99 in JSON and displayed HTML. That proves omission, not a
mandatory hub or supported pairing. `solarcam-d1-max.txt` L28, L114–129, L182–200 says 3K and
tracking but does not settle hub requirements. Official gallery `sd.jpg?v=1715064855&width=1250`,
read as `spec-images/d1-storage.jpeg`, says onboard microSD local recording with no monthly fee,
optional cloud and seven-day trial. New kit copy uses a hub (S7). **UNRESOLVED: exact single-SKU
hub dependency/standalone behavior.** Both facts are retained before the first CTA and in FAQ;
we do not infer “requires aosuBase” from “not included,” and do not recommend it as a proven
add-on. Its old 7-day trial conflicts with the cloud page's 30-day description; no trial length
is promised universally. The draft doesn't quote D1 price since it is not a selected pick.

### S7 — New D1 Max kit (not selected; don't transfer its specs)

https://www.aosulife.com/products/solarcam-kit-d1-max-aosubase?ref=NGUYENTHIDUYAN

`solarcam-kit-d1-max-aosubase.txt` L187–211: newer 4K headline versus single listing's 3K;
private aosuBase Wi-Fi signal up to six cameras (L203–204), up to four live views (L205–206),
separate/detached panel (L210–211). Solar copy says **a few hours sunlight; based on 50 events/day,
20s each; charging varies; below -5°C (23°F) charging stops and device runs on battery**
(L207–211). These conditions are attributed ONLY to that kit in the guide. C7L/P1 Max do not
inherit them. Kit variant 1-Cam(new aosuBase not included) is also not a hub-included starter kit.
No promise that C7L, older aosuBase, Mini and aosuCortex interoperate. aosuCortex configurations
exist in the cached catalog, but their storage capacity and pairing matrix are NOT established
for the selected five; no guessed capacity is published.

### S8 — aosuProtect+ cloud plans, prices, limits and renewal

https://www.aosulife.com/pages/cloud-storage?ref=NGUYENTHIDUYAN

`pages-cloud-storage.txt`:
- L124–135: displayed **Standard $0.00/mo**, **Basic $4.99/mo**, **Basic + Face ID $8.99/mo**,
  last labeled for video doorbells only; Standard says live mode, no event recordings.
- L144–158: 30-day unlimited event videos, 14/30-day loop wording, facial recognition, package
  detection only SE; vehicle/pet rows restricted to D1 Max / Security Cam D1 SE / Floodlight.
  Feature inclusion/table checkmarks and per-camera allowance are not clearly resolved by the
  supplied extract; the guide does NOT promise each tier's complete entitlements.
- L225–258: app/device account needed; maker says all devices compatible; **event-triggered,
  not continuous cloud recording**; **14-day OR 30-day event-loop retention** by plan.
- L265–271: **30-day trial**, payment details/authorization required, charges afterward.
- L272–292: cancel next billing, prepaid period remains; monthly/yearly recurring, not one-time;
  FAQ says deletion follows 14/30-day loop, not immediate merely on expiration.
- L36–48/L162–166: encryption/AWS/access claims are merchant claims, not a Duyan security audit.
- Conflict: D1 gallery says seven-day trial, page says 30 days; Terms (S13) allow immediate
  access restriction after expiration/cancellation/unlink/account deletion. Article explicitly
  warns to export first, no post-cancellation access or forever-retention guarantee.
- The $0 cloud plan must NOT be conflated with card/hub local recording. Local Floodlight
  human/pet/vehicle AI is separately documented by S15, not denied by a cloud feature table.

### S9 — Shipping & Delivery Policy

https://www.aosulife.com/pages/shipping-delivery-policy?ref=NGUYENTHIDUYAN

`pages-shipping-delivery-policy.txt` L3–7: **processing starts 1–2 business days**, tracking on
shipment; free shipping destinations named **US, Canada, Germany, France, Italy, UK**; no PO boxes.
L8–27: **US 2–5 business-day transit**, Canada 2–5, Europe table 3–5, Japan 2–5. Table additionally
names Poland, Spain and Japan, inconsistent with the shorter destination list. Guide explicitly
requires address/total confirmation; no guaranteed combined arrival window. Tax-inclusive tariff
statement L28–29 is not adopted as an unconditional worldwide delivered-total guarantee.

### S10 — Returns and refunds

https://www.aosulife.com/pages/return-policy?ref=NGUYENTHIDUYAN

`pages-return-policy.txt` L2–19: direct-store **30 days from receipt**, permission required,
original packaging/all contents **unused/unmarked/not defaced**, relaxable for quality reasons;
**return shipping not covered**, prepaid freight required, wrong/missing-accessory returns may
be rejected. After receipt/inspection/approval, **3–5 business days** to original method. Other
retailers handle returns. “30-Day Free Return” badges on all selected product pages conflict
with this buyer-paid wording; guide says ask before drilling/installing. No unconditional free
trial, free return freight or fully refundable used installation is promised.

### S11 — Warranty Policy and promotion conflict

https://www.aosulife.com/pages/warranty-policy?ref=NGUYENTHIDUYAN

`pages-warranty-policy.txt` L3–13: eligible official-channel products, **12 months from original
purchase**, EEA **24 months**, defects of material/workmanship under normal instructed use;
purchase proof, serial number, fault evidence; **prepaid label/necessary freight for covered
inspection and replacement**. Replacement term is remaining original or 90 days (not quoted in
guide). L19–25 excludes improper installation/use beyond limits, incompatible electrical supply,
unauthorized changes, normal battery-capacity decline, lost/stolen and non-official channels.
Normal battery aging exclusion does not erase material/workmanship battery defects. L40–41
acknowledges separate express promises. Product badges say **2-Year Warranty (Black Friday
Special)**; exact promotional eligibility/conditions not verified. Guide does not “resolve” the
conflict by universally applying either term. Not legal advice and no statutory-rights conclusion.

### S12 — Privacy Policy

https://www.aosulife.com/pages/privacy-policy?ref=NGUYENTHIDUYAN

`pages-privacy-policy.txt` (last updated October 27, 2026), L14–25: account/device/operational
processing, video/audio not cloud-uploaded unless cloud enabled, **thumbnail previews uploaded
for notifications/app previews**. Local storage does not mean no cloud processing. L70–75 has
maker encryption/access-control statements, not independently verified security guarantees.
The draft avoids specific biometric-law advice and no legality assertion for any recording setup.

### S13 — Terms of Use

https://www.aosulife.com/pages/terms-of-use?ref=NGUYENTHIDUYAN

`pages-terms-of-use.txt` (last updated September 15, 2026), L21–25: no timely/error-free alert
promise and prices/stock can change; L33–42: auto-renewal, payment, cancel/prepaid period,
trial conversion, export responsibility, **access may be immediately restricted** on
expiration/cancellation/unlink/account deletion; L65–69: AI delays/misses/false alerts and no
reliance for emergency/high-risk/life-safety decisions. The guide summarizes those merchant
terms; no independent interpretation of arbitration, consumer rights or local recording laws.

### S14 — About Us / support background

https://www.aosulife.com/pages/aboutus?ref=NGUYENTHIDUYAN

`pages-aboutus.txt` L42–64 lists support contacts. Merchant mission/security slogans are NOT
adopted as evidence of reliability or safety. About page's company information differs from the
entity in Terms/Privacy; no corporate-history or ownership claim is needed or made in the draft.
The source is offered as the official support/background route, not hands-on verification.

### S15 — Targeted official floodlight installation and recording guidance

https://www.aosulife.com/blogs/buying-guides/floodlight-cameras-compared-lighting-recording-and-total-cost?ref=NGUYENTHIDUYAN

Fetched only for missing wired-installation/continuous-local detail; HTTP 200, checked
2026-11-26; page dates itself October 25, 2026. `official-floodlight-installation.txt` L19–22
covers wired fixture, circuit, junction/weather-rated box and electrician; L47–50/L61–64 confirms
L5P 5MP, two heads, 0–2,600 lumens, local continuous microSD recording/playback and local
human/pet/vehicle detection without subscription, optional paid cloud. L49 distinguishes
270° PIR coverage from simultaneous view. No competitor specs/prices, user quotes or the
merchant's own ranking language are reused as independent evidence.

### S16 — Targeted official indoor plug-in and local recording guidance

https://www.aosulife.com/blogs/buying-guides/best-indoor-cameras-with-continuous-recording-in-2026?ref=NGUYENTHIDUYAN

Fetched only for missing plug-in/continuous detail; HTTP 200, checked 2026-11-26; page dated
September 28, 2026 and reports September 15 source checks. `official-indoor-power.txt` L33–45,
L66–70 says plug-in power, compatible card, 24/7 local recording setting, keep plugged in,
2.4/5GHz and optional event-cloud difference. We do not adopt the merchant's “top pick” label
or competitor ranking. Its illustrative storage-duration arithmetic is NOT a tested aosu
retention number and is not imported. Suggested owner quiet-interval playback/export check is
editorial setup advice, not a test Duyan performed.

## Official thumbnail verification and hero provenance

`asset-and-link-verification.json` records all five direct official thumbnail requests at width=240,
HTTP 200 plus full sharp decode, checked 2026-11-26:

| Handle | Format / decoded size | Bytes | HTTP |
|---|---|---:|---:|
| aosu-solarcam-system-with-new-aosubase | PNG 240×240 | 50293 | 200 |
| solarcam-p1-max | PNG 240×240 | 37519 | 200 |
| video-doorbell-pro | PNG 240×240 | 26938 | 200 |
| floodlight-cam-pro | PNG 240×300 | 29202 | 200 |
| indoorcam-p1-pro | PNG 240×240 | 23956 | 200 |

First thumbnail is 293 bytes over the skill's 50KB target but below 100KB warning and is the
explicitly requested unmodified official width=240 og:image URL; no heavy local duplicate or
unrequested image conversion is added. This is direct image delivery, NOT browser Next optimizer QA.
Exactly one HTTPS `www.aosulife.com` `/cdn/shop/files/**` remotePatterns entry is added. Existing
Fanttik, Ottocast, Phomemo, CMY Cubes and ProtoArc patterns are preserved; no wildcard domain.

Hero: `/images/articles/how-to-choose-aosu-security-cameras/hero-aosu-composite.jpg`.
**Video Doorbell Pro, Floodlight Cam Pro and IndoorCam P1 Pro only**. Neither solar pick is shown.
Exact heroAlt: `aosu Video Doorbell Pro, Floodlight Cam Pro and IndoorCam P1 Pro on a warm paper background`.
Exact heroCredit: `Official aosu product photography; composite by Duyan Blog.`

1600×1000 JPEG, 89,445 bytes, FF D8 FF, warm paper #F6F3EC, soft deterministic grounded shadows,
official source alpha/cropped product pixels, no generated product imagery. SHA-256:
`15a847e7feab00fe8196d04bbf0b6a72b16422d000e56306cfcb2aba7420c00f`.
Source URLs: S3/S4/S5 og:image above at width=2048; exact downloads, hashes, crops and decode
metadata in `hero-sources.json`. D1 Max was downloaded as an unused option and is NOT in the
composite. Lead and image delegate both read final pixels; the three complete silhouettes have
no photo-box edges or badges. Centered 1600×900 crop also keeps all devices. The image is a
composite, not a product shoot, bundle or scale comparison, and is not repeated in body blocks.

## Internal prose links, architecture and deferred route QA

All five live internal links were GET-checked on 2026-11-26, each **HTTP 200, canonical parity=true,
notFound=false**, recorded in `asset-and-link-verification.json`:

| Prose destination | HTTP | Canonical parity |
|---|---:|---|
| /methodology | 200 | true |
| /affiliate-disclosure | 200 | true |
| /guides | 200 | true |
| /best/best-protoarc-ergonomic-gear | 200 | true |
| /guides/how-much-esim-data-do-i-need | 200 | true |

No `/guides/sonni24-bathroom-buying-guide` link. The guide route already renders TableOfContents
from headings and ArticleRenderer, but not separate TldrBox/SourcesList. The draft therefore
contains metadata tldr AND H2 The short version AND the final sources block. Schema is unchanged
Article/BreadcrumbList only; no Product/Review/aggregateRating/FAQPage added. No ItemList added
to a guide or five fake product destinations behind one shared store URL. Four tags exactly:
aosu / Security cameras / Local storage / Smart home. Title 56 characters; deck 141; heroAlt 91.
All 53 blocks validate with the actual schema; reading time uses the repository 200-wpm estimator.
SEO brief and applied audit method are in `tmp/task-aosu/seo-brief-and-audit.md`. No external SEO
SERP crawl, rankings, keyword-volume, AI-citation guarantee or made-up expert credentials.

One TCP preflight only: `node tmp/task-aosu/local-db-preflight.mjs` (exit 0), result:
`local_mysql_tcp_reachable=false`, `database_target_is_local_duyanblog_dev=false`,
`local_db_import_performed=false`, `dev_server_started=false`, `rendered_route_qa_performed=false`,
`production_db_accessed=false`, `secret_files_read=false`.
**SKIP local DB import/dev server: 127.0.0.1:3306 is not listening.** No SQL client initialized,
no inherited remote connection used, no database import, temp publication, restore or server.
Full guide-route rendering, responsive screenshot/overflow, console and Next optimizer checks
remain NOT PERFORMED. Offline schema/component gates and hero pixel inspection are not those checks.

Protected baseline SHA1 (must remain unchanged):
- `google97ca35a7332c4a50.html`: `10C0795E7CC426E46DA185699DBD2298B1B46CCD`
- `task50-final-review.patch`: `1050BBDD9977EAC570E515A15CD0B4BD889B6265`

Nothing committed, staged, pushed, merged, deployed, imported or published. No remote/production
database access. Temporary scripts, downloads, extracts and logs remain inside `tmp/task-aosu/`.
