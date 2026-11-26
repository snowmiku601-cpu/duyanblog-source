# ProtoArc ergonomic gear roundup — claim/evidence ledger

Checked **November 26, 2026 (2026-11-26)**. Local file draft only; not published.

## Evidence scope and limits

Stage 1 research is complete. This ledger audits the official evidence already saved under
`tmp/task-protoarc/`; no product or policy re-research was performed. `catalog-evidence.json`
records fourteen US storefront listings, exact selected SKU/variant IDs, Shopify USD amounts,
HTML displayed-price elements, In stock sections, og:image values and HTML/JSON SHA-256 hashes.
The selected five have agreement between the displayed USD amount and Shopify variant price.
Product `.txt` extracts and original HTML/Shopify JSON are retained in that folder and its
`downloads/` subfolder. These are dated storefront observations, not a live checkout guarantee.

`policy-chair-findings.md` supplies the primary-source registry, original HTML line anchors,
140 checked snippets and explicit notFound/conflict register for six official policy/support
pages and both chairs. Source IDs S1/S2/R/W/F/A and C200 below refer to that registry. No unseen
manual, uncached model FAQ or image-only dimensional number has been treated as verified.
`asset-and-link-verification.json` records the five official thumbnails and five public internal
routes with HTTP 200 and canonical parity. Final thumbnail HTTP/decode evidence is separately
saved as `final-thumbnail-verification.json`; this is asset delivery, not Next optimizer QA.

This is documented research by Duyan, not a hands-on test. No comfort, pain, fatigue, sensor,
click-noise, battery-runtime, hinge-life or chair-assembly test was performed. Recommendations
are five editorial jobs rather than a measured overall winner. Manufacturer ergonomic and
brand-history claims are not clinical evidence. No merchant rating/review count is reused as a
Duyan score, Review or aggregateRating.

## Affiliate, attribution and image authorization

- Exact owner-provided affiliate URL: `https://www.protoarc.com/?ref=bftbqwpp`.
- GoAffPro Store ID **7007740**, status **approved**, as supplied in the task; not independently
  audited. Exact lowercase referral value: `bftbqwpp`. No credential file was read.
- Product-level deep-link commission attribution is **unverified**. All five pick CTAs therefore
  use the storefront front door above and the existing generic merchant-store label. Readers
  search the exact model and US layout after landing. Sources use the same lowercase referral
  code, are disclosed as commercial and retain sponsored treatment. Image CDN requests are
  media, not referral navigation, and do not carry `ref`.
- IMAGE PERMISSION: **OWNER-REPORTED AUTHORIZATION** for using, cropping, editing and compositing
  official ProtoArc images for this affiliate editorial, supplied with the task. No written
  license, signer, contract or independently verified legal scope is asserted.
- Cover: `/images/articles/best-protoarc-ergonomic-gear/hero-protoarc-composite.jpg`, 1600×1000
  JPEG on flat warm paper `#F6F3EC`. Exact product set: **EM11 NL, EK01 Plus, EM01 NL and EC200
  only**; XK01 is not pictured. The composition is not to scale, a bundle or a Duyan product shoot.
  Note: the EC200 cutout in the composite depicts the Gray finish (CP016353, unavailable at check),
  while Pick 5 quotes the in-stock Black variant (CP016352, `$169.99 USD`); this distinction is
  stated in the cover-image provenance note.
- Exact heroAlt: `ProtoArc EM11 NL, EK01 Plus, EM01 NL and EC200 on a warm paper background`.
- Exact heroCredit: `ProtoArc (protoarc.com); composite arrangement by Duyan Blog`.
- Hero source records: `hero-sources.json`, `gallery-visual-sources.json` and `hero-src/`, with
  official URLs, download hashes, real decoded formats and dimensions. Only real product
  cutouts are used; no generative product pixels. Build metadata and the final hero are retained
  for pixel inspection; the cover is not repeated in body image blocks.
- Five pick thumbnails use official `https://www.protoarc.com/cdn/shop/files/` URLs at
  `width=240`. `next.config.ts` allows that narrow HTTPS host/path only; no wildcard host added.
  Direct verification returned HTTP 200 and full JPEG decode for all five, each 240×300:
  EM11 NL 4,879 bytes; EK01 Plus 9,075; XK01 7,620; EM01 NL 6,153; EC200 6,059.
  The CDN may negotiate JPEG despite a `.webp` URL; decoded bytes, not extension, establish format.

## Selected prices, exact variants and stock

All amounts below are **displayed USD store prices**, checked 2026-11-26, not crossed-out
comparison amounts. Each selected variant has `available=true`, parent product `available=true`,
matching captured Sale price elements and an In stock purchase section. These facts establish
stock in the saved evidence, not current inventory or reserved stock. Prices, promotions,
currency, shipping and tax can change at checkout; no affiliate discount or unchanged-price
promise is made.

| Pick / selected variant | Displayed USD store price | Shopify USD amount | Variant / SKU | Availability evidence |
|---|---:|---:|---|---|
| EM11 NL — Black | $20.99 | $20.99 | 42318201716825 / CP014943 | available=true; mainInStock=true |
| EK01 Plus — Black, US QWERTY | $59.49 | $59.49 | 42968357699673 / CP015755 | available=true; mainInStock=true |
| XK01 — Black, US QWERTY | $35.99 | $35.99 | 40494322647129 / CP011803 | available=true; mainInStock=true |
| EM01 NL — Gray | $34.99 | $34.99 | 41547091574873 / CP014935 | available=true; mainInStock=true |
| EC200 — Black | $169.99 | $169.99 | 42701212450905 / CP016352 | available=true; mainInStock=true |

White XK01 (CP012684) and Gray EC200 (CP016353) are unavailable in the same cache; do not
extend another color's stock to every variant. **EM06 excluded: sold out**, parent and Black
variant `available=false`, `mainInStock=false`; its displayed $89.99 does not make it purchasable.
Regional UK, DE, FR, ES and IT keyboard layouts are separate listings, not the selected US
QWERTY SKUs. The checked US keyboard photographs and unsuffixed titles identify the picks;
an English manual, QWERTY lettering or USD price alone cannot establish US symbol placement.
Mice and chair have no keyboard layout; the US-QWERTY restriction applies to the two keyboards.

## Pick 1 — EM11 NL Ergonomic Vertical Mouse

- Product source: https://www.protoarc.com/products/em11-nl-vertical-mouse?ref=bftbqwpp
- Selected variant and price: Black, CP014943, **$20.99 USD**, in stock as above.
- Job: vertical-grip pointing for small-to-medium hands. Page recommends hand length **under
  7.5 inches**. EM11 Pro's separate **7.5–8.5-inch** palm-base-to-middle-finger-tip guidance
  must not become an NL specification; Pro numeric grip angle/features are not transferred.
- Dimensions: height **68.1 mm**, width **69.2 mm**, depth **138 mm**; **112 g**. Extract
  `em11-nl-vertical-mouse.txt` lines 390–396 retains axes, unlike an inferred generic W/D/H order.
- Connections: **Bluetooth 5.0**, two Bluetooth channels plus one **2.4GHz USB-A receiver**
  channel, three-device switching. USB-C cable is documented for charging, not a wired data mode.
- Receiver OS: Windows XP/7/8/10 or later, macOS 10.12+. Bluetooth Low Energy: Windows 8/10+,
  macOS 10.12+, Android 4.3+. Source spec panel: extract lines 397–418.
- Optical; **1000/1600/2400 DPI**; **500 mAh** rechargeable battery. No measured runtime claim.
- Forward/back side buttons are **not programmable and do not work on macOS** (extract line
  331). Mouse movement space is still needed. Numeric NL grip angle was not verified.
- Cached og:image (HTTP in metadata, normalized to HTTPS for delivery):
  `https://www.protoarc.com/cdn/shop/files/em11-nl-vertical-mouse.webp?v=1767583425&width=2048`.
- Thumbnail: `https://www.protoarc.com/cdn/shop/files/em11-nl-vertical-mouse.webp?v=1767583425&width=240`.

## Pick 2 — EK01 Plus Backlit Ergonomic Keyboard

- Product source: https://www.protoarc.com/products/ek01-plus-ergonomic-split-keyboard?ref=bftbqwpp
- Selected variant and price: Black, **US QWERTY**, CP015755, **$59.49 USD**, in stock.
- Job: full-size curved split typing at a fixed desk. **117 keys**, cushioned wrist rest,
  three white-backlight brightness levels, four tilt feet with three angle settings. One chassis,
  not detachable independent halves. Numeric split/tilt degrees and keyboard weight are notFound.
- Size panel lists **500 × 265 × 40 mm**, with merchant axis labels height/width/depth respectively
  (`ek01-plus-ergonomic-split-keyboard.txt` lines 390–393). Do not relabel these as measured axes.
- Two Bluetooth channels plus **2.4GHz USB receiver**, three-device switching; **2000 mAh** Li-Po;
  included USB-C cable for recharging. Standby marketing is not a measured working runtime.
- Detailed receiver and Bluetooth spec panels list **Windows Vista/7/8/10+; macOS 10.15+**.
  Bluetooth is recommended for Mac; some multimedia keys/shortcuts are limited through receiver.
  Descriptive copy elsewhere says macOS 10.12 and mobile systems; draft uses stricter 10.15 panel
  and does not promise all shortcuts or mobile functions. Extract lines 394–417.
- DPI is not applicable to a keyboard. A charge port is not evidence of USB wired typing.
- og:image: `https://www.protoarc.com/cdn/shop/files/3_73991b88-a596-4009-ba01-b1e05595f8ae.jpg?v=1767779771&width=2048`.
- Thumbnail: `https://www.protoarc.com/cdn/shop/files/3_73991b88-a596-4009-ba01-b1e05595f8ae.jpg?v=1767779771&width=240`.

## Pick 3 — XK01 Foldable Keyboard

- Product source: https://www.protoarc.com/products/xk01-tri-fold-bluetooth-keyboard?ref=bftbqwpp
- Selected variant and price: Black, **US QWERTY**, CP011803, **$35.99 USD**, in stock.
- Job: folding travel typing with number pad. Ordinary **105-key** XK01, not XK01 TP touchpad,
  XK01 Plus backlit keyboard, or XKM01 combo. Three **Bluetooth 5.1** channels, no 2.4GHz receiver.
- Folded **215.50 × 119.70 × 20.95 mm**; expanded **386.39 × 119.70 × 12.35 mm**; **297.72 g**.
  Extract `xk01-tri-fold-bluetooth-keyboard.txt` lines 386–398 supplies those axis-ordered sizes.
- **210 mAh** Li-Po; USB-C charging. Bluetooth Low Energy host requirement, **Windows
  Vista/7/8/10+**, **macOS 10.15+**, **iOS and Android** (minimum mobile OS not stated).
- Package: keyboard, USB-C recharge cable, guide. No travel case named; absence from checked
  package list is not a claim that no bundle can include one. DPI not applicable.
- Unresolved marketing conflicts: main copy says 100,000 folds / over 13 years; other sections
  use different hinge-life wording. Standby sections disagree. No years-of-durability or
  real-work runtime promise is carried into the draft.
- og:image: `https://www.protoarc.com/cdn/shop/files/xk01-keyboard-black.webp?v=1767585717&width=2048`.
- Thumbnail: `https://www.protoarc.com/cdn/shop/files/xk01-keyboard-black.webp?v=1767585717&width=240`.

## Pick 4 — EM01 NL Trackball Ergonomic Mouse

- Product source: https://www.protoarc.com/products/em01-nl-trackball-mouse?ref=bftbqwpp
- Selected variant and price: Gray, CP014935, **$34.99 USD**, in stock.
- Job: stationary thumb-controlled pointing. Adjustable **0–20° hinge**, not the EM05 NL's
  separate fixed **62°** design. Ball/socket cleaning is instructed. Adaptation is a practical
  trade-off, not a timed health treatment. No verified ball diameter or hand-length fit range.
- Merchant size panel: **height 125 mm, width 63.4 mm, depth 39.3 mm; 181 g**. The unusual axes
  are preserved as seller labels, not corrected or claimed as Duyan measurements. Receiver
  dimensions/weight are separate and not substituted for the mouse.
- Two Bluetooth channels plus **2.4GHz receiver**, three-device switching. Receiver: Windows
  XP/7/8/10+, Linux, macOS 10.10+; Bluetooth: Windows 8/10+, Linux, macOS 10.10+, Android 4.3+.
  Summary names iPad without minimum iPadOS; confirm tablet workflow. Extract lines 391–427.
- **200/400/800/1200/1600 DPI**; **900 mAh** Li-Po; USB-C recharging. Ninety-day maker battery
  marketing is not a tested runtime. DPI presets are sensitivity settings, not an accuracy score.
- og:image: `https://www.protoarc.com/cdn/shop/files/em01-nl-trackball-mouse-01.webp?v=1767583350&width=2048`.
- Thumbnail: `https://www.protoarc.com/cdn/shop/files/em01-nl-trackball-mouse-01.webp?v=1767583350&width=240`.

## Pick 5 — EC200 Ergonomic Office Chair

- Product source: https://www.protoarc.com/products/ec200-ergonomic-mesh-office-chair?ref=bftbqwpp
- Selected variant and price: Black, CP016352, **$169.99 USD**, in stock; Gray unavailable.
- Job: adjustable seating within published fit limits, not universal fit. Recommended user
  **5'4\"–6'0\"**, **90–220 lb**, maximum **220 lb** (C200:L5530–5531,L5804).
- Mesh back and **55D foam seat**, plastic frame, Class 4 gas lift, 2.36-inch casters. It is not
  the EC200 Pro all-mesh seat / 4D-armrest model in the middle comparison column.
- Nominal **20-inch seat depth**, slide **1.97 inches / five positions**; cannot derive minimum
  or maximum seat-depth endpoints. Independent lumbar **2.36-inch height / 0.8-inch depth**.
- Merchant labels headrest **3D** (height, depth, rotation, pivot) and armrests **2D
  height-adjustable**; no numeric headrest/armrest travel established. Recline locks **90/105/
  120/130°**, adjustable rotary tension (C200:L5534–5545).
- Listed overall **20D × 20W × 46.75H inches** conflicts with separately listed total-height
  adjustment **42.52–45.67 inches**. Neither is seat height. **Numeric floor-to-seat-height
  interval not verified**; do not invent or infer it from overall height (C200:L5514,L5538,L5869).
- Explicit net chair weight **16.5 kg (582 oz)**; raw Shopify `weight=25515` is not an authenticated
  net-weight label and is not substituted (C200:L5515). Electronics/connectivity/OS/battery/DPI
  are not applicable to this chair.
- Manufacturer assembly estimate approximately 20 minutes (comparison 10–20); not tested and
  not used as a Duyan result. Warranty scope and bulky-freight costs need clarification below.
- og:image: `https://www.protoarc.com/cdn/shop/files/3_88939ad0-c32d-4fcf-bacf-12934e327277.jpg?v=1770956719&width=2048`.
- Thumbnail: `https://www.protoarc.com/cdn/shop/files/3_88939ad0-c32d-4fcf-bacf-12934e327277.jpg?v=1770956719&width=240`.

## Connection, layout and interpretation boundaries

Charging is not established as a wired data fallback. Three-device switching does not establish
simultaneous multi-computer control, file transfer or a universal shared receiver. USB-A receivers
need a suitable adapter/hub on USB-C-only computers; Bluetooth avoids that receiver-port need,
not every compatibility limitation. US QWERTY selections do not validate regional symbol keys.
Change one workflow at a time if useful; no adaptation interval, pain reduction, cure or medical
outcome was established. Persistent discomfort merits appropriate professional advice rather
than a peripheral's marketing promise.

## Official shipping facts and conflicts

Sources: https://www.protoarc.com/policies/shipping-policy?ref=bftbqwpp and
https://www.protoarc.com/pages/shipping?ref=bftbqwpp . S1 and S2 agree in the cache.

- Typically processed/verified within **12 hours**; shipping confirmation with tracking usually
  within **24 hours of processing**. Neither is guaranteed dispatch/arrival. In-stock orders
  cannot be cancelled/modified once shipping starts; preorders only if not prepared for shipment.
  Address/shipping-method changes cannot be assumed after order submission.
- Continental US: **free on eligible orders over $19.99**, estimated delivery **3–5 business
  days**. Exactly $19.99 is not expressly eligible. Product popups instead say US **2–3 business
  days**; this discrepancy is unresolved. Do not promise either or call it pure post-dispatch
  transit when the general table only says estimated delivery.
- Canada: **5–7 business days**, shipping at checkout. UK, Germany, select EU countries:
  shipping at checkout, timing varies. Hawaii, Alaska, APO/FPO and outlying territories have
  restricted service; not an absolute no-shipping statement. Offices/locale menus do not prove
  delivery eligibility. Remote, international and **oversized products may incur extra fees**.
- No EC200-specific freight tariff, guaranteed fee exemption, delivery appointment, stairs/room
  placement, pickup or return-freight amount was verified. Do not promise free chair freight.
- Listed carriers: USPS/FedEx/UPS/DHL/GOFO; Amazon MCF can fulfill. Buy with Prime applies only
  to members and eligible products; selected-chair eligibility unverified. Split shipments do
  not themselves increase shipping cost. Amazon Logistics tracking can take 24–48 hours to update.
- Delivered-but-missing: check address/property/others, wait 24 hours, then contact support for
  trace. Wrong-address refund depends on parcel return; no refund if delivered to the supplied
  wrong address and not returned. No guaranteed next-day service, public warehouse pickup or COD.
- Tax exemption approval before ordering, review usually 1–3 business days; no retroactive
  sales-tax refund. International VAT/GST/customs may apply. Confirm final destination total.

## Official returns and refunds

Source: https://www.protoarc.com/policies/refund-policy?ref=bftbqwpp . R applies to direct-store
trial returns, not a universal marketplace rule or a fully specified assembled-chair freight policy.

- Window closes **30 days after delivery**. Within-window eligible full refund includes original
  shipping/handling where applicable, subject to conditions. After the window, warranty is not
  a general extension of the trial. Authorized marketplaces apply their own return/exchange rules.
- Request through support/email/form with order ID or dealer receipt, reason and photos/video
  for quality claims; gift without order ID may use SN. **Approval and RMA required** before
  return; unauthorized returns may be declined. Merchant may decline damaged/missing/allergy
  issues reported **more than seven days** after delivery: inspect promptly.
- **Verified quality issues/picking errors: prepaid label. Change of mind/accidental order:
  buyer-paid return shipping.** No exact bulky-chair cost, disassembly condition, pickup or
  restocking-fee schedule found; no inference that a missing fee statement means zero fees.
- Original packaging, all accessories (receivers/cables/manuals) and promotional gifts required
  for full refund. Visible RMA, matching SN, complete parts. Missing accessories, customer-caused
  damage or gifts can reduce refund; missing gifts valued at official retail price.
- **Inspection: 2–3 business days after return arrival. Refund appearance: typically 1–3
  business days after initiation**, bank-dependent. Separate clocks, not a fixed combined promise.
- Ordinary refunds go to original payment method; alternative accounts/private transfer/payment
  apps not offered. Closed accounts require bank/PayPal handling; after original-route gateway
  timeout (typically 180 days), compliant manual handling may be discussed, not a new trial window.
- Tension: W mentions PayPal for special post-window warranty refunds while R says original
  route. Ask support; neither all-original-method nor guaranteed PayPal is asserted universally.

## Official warranty, FAQ and About Us

Warranty source: https://www.protoarc.com/pages/warranty-policy?ref=bftbqwpp .

- Computer/office accessories: **two years from delivery**. Complete chairs currently sold
  through official US website: **five years from delivery**. Other furniture: three years,
  select premium items 5–10 subject to specific guidance. Do not apply every term to every SKU.
- EC200 comparison table says **five-year structural warranty**, while W says complete-chair
  and popups mention product/parts issues. Component, labor, freight, wear and included-cushion
  coverage are unresolved. Complete-chair exclusions name desks, seat cushions and separately
  sold replacement parts; do not decide whether included seat foam is excluded.
- Original purchaser only, **non-transferable**. Separately purchased replacement parts are
  **Final Sale without standard warranty**. Promotional gifts generally not covered; damage
  reported within seven days may receive discretionary handling. Personal gifts are distinct.
- Authorized marketplace brand service can continue after platform returns; keyboards/mice
  typically two years, furniture typically 3–5 subject to manual. Local dealers are primary
  contact for dealer purchases; unauthorized channels do not receive complimentary replacement.
- Claim: order/invoice proof, fault description, photos/video; support subject Warranty Claim
  + Order ID. Technical reply **within one business day**; troubleshooting then covered-fault
  repair/replacement/refund may follow. Replacement can be a product or specific parts, not
  an unconditional cash refund. Gift proof fallback uses SN manufacture date plus three months.
- Extended-warranty subsection covers functional defects, excluding third-party logistics
  damage, used purchases and unauthorized resellers. Do not broaden those subsection exclusions
  into an invented complete policy. Third-party protection plans are separate insurer products.
- DOA/missing issues: report within **one week/seven days**; later claims may not be accepted.
  No comprehensive wear/abuse/commercial-use, labor or freight table was found in the supplied scope.

FAQ source: https://www.protoarc.com/pages/faq?ref=bftbqwpp . Model-support hub for mice,
keyboards, combos, chairs and accessories, not a substitute for model-specific compatibility.
Links to EC200/EC300 model FAQs exist but those destinations were not cached/read. General
support reply estimate **usually 1–3 business days**, distinct from warranty's one-business-day
reply and shipping clocks (F:L3539,L3882–3905,L3995).

About Us source: https://www.protoarc.com/pages/about-us?ref=bftbqwpp . Merchant says founder
**Joey He**, brand established/launched **2021**, US range launch **2022**, furniture expansion
**2024**, offices in Texas, Shenzhen, Hong Kong and Hamburg (A:L4161–4194,L4244). Self-reported
history and office locations are not medical evidence or a delivery-country list. Claims of
less discomfort/productivity in the story are not adopted as measured outcomes.

## Internal links, schema and deferred route QA

All five descriptive prose destinations already have HTTP 200 and matching canonical in
`asset-and-link-verification.json`: `/methodology`, `/affiliate-disclosure`,
`/best/best-phomemo-printers`, `/best/best-fanttik-tools`,
`/guides/how-much-esim-data-do-i-need`. No `/best/best-cmy-cubes` link is shipped while it remains
a local unpublished draft. Future bidirectional CMY Cubes/ProtoArc links require both to publish.

Existing `isReferralUrl`/sponsored direct-CTA/source behavior is preserved. Shared storefront
URLs intentionally suppress ItemList under the existing duplicate-destination guard. Preserve
Article and BreadcrumbList; no Product, Review, aggregateRating, invented Offer stock or rating
schema is added. Offline component tests do not claim a full article route was rendered.

Saved `local-db-preflight.json` already reports `local_mysql_tcp_reachable=false` and
`database_target_is_local_duyanblog_dev=false`; it is cited, not re-run. Therefore no DB probe,
SQL client/import/temp-publish/restore, development server or production DB access was performed.
Full local route HTTP/canonical/Article+BreadcrumbList/optimizer/console/mobile overflow QA is
**not performed**, not passed. Direct thumbnail decoding and final hero pixel inspection are
separate, completed asset checks. Publication remains outside Task 61.
