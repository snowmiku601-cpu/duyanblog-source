# CMY Cubes roundup — claim/evidence ledger

Checked **November 26, 2026 (2026-11-26)**. Local draft only.

## Evidence scope and limits

Stage 1 is complete. This ledger uses the official-page evidence already saved under
`tmp/task-cmy-cubes/`; no new SERP research is needed. `product-evidence.json` records
product bodies, variant availability, Shopify prices and JSON-LD. `variant-display-evidence.json`
records the rendered USD variant prices, enabled Add to Cart controls and absence of a visible
pre-order notice. `metafields.json`, `extra-evidence.json`, `policy-evidence.json` and
`supplement-evidence.json` provide the remaining specifications and policies. Raw published-body
text and HTML remain in `downloads/`. Official www links redirected to the US storefront during
research. The draft quotes USD, not a visitor's inferred local currency.

This is documented research by Duyan, not a hands-on test. No handling, scratch, optical,
learning-outcome or medical-benefit testing was performed. Rank means editorial fit for a
specific buyer, not a measured performance score. Merchant ratings and review counts are not
reused as Duyan ratings or structured data.

## Affiliate / tracking / image rights

- Approved, owner-provided affiliate URL: `https://www.cmycubes.com/?ref=duyan`.
- GoAffPro Store ID **133964**, approved (owner-reported program status; not independently
  audited). Exact lowercase referral value: `duyan`. No credential file was read.
- Product-level referral attribution has not been verified. All five `pick.url` buttons use the
  exact storefront URL above and the generic merchant-store CTA. Sources retain the same
  lowercase referral parameter, disclose their commercial nature and render sponsored.
- IMAGE PERMISSION: **OWNER-REPORTED AUTHORIZATION** for using, cropping, editing and compositing
  official CMY Cubes product images for this affiliate editorial, as supplied in the task.
  No written license, signer, contract or independently verified legal scope is asserted.
- Shipped cover: `/images/articles/best-cmy-cubes/hero-cmy-cubes-composite.jpg`, a 1600×1000 JPEG
  on warm paper `#F6F3EC`. It contains **The Original Cube, The Aether and The Mundus only**.
  Arrangement is editorial, not a photograph taken by Duyan, not to scale, and not a bundle.
  Neither the Monochromatica puzzle nor the GyroStand appears in the cover.
- Exact heroAlt: `CMY Cubes Original Cube, The Aether and The Mundus on a warm paper background`.
- Hero credit: `CMY Cubes (cmycubes.com); composite arrangement by Duyan Blog`.
- Source photographs: official `/cdn/shop/products/RPS117307.jpg?v=1762482606`,
  `/cdn/shop/products/RPS110479.jpg?v=1613816571` and
  `/cdn/shop/products/RPS110450.jpg?v=1613816572`, requested at `width=1200`.
  Downloads/generation provenance is kept under `tmp/task-cmy-cubes/hero-src/` and the task folder.
  The Original Cube response was 1000×1000 despite the `width=1200` request; the other two
  were 1200×1200. The cover uses only the largest cube in the three-size source photograph,
  excluding both smaller cubes. This is not a promise that the pictured cube is the 50mm pick.
  Final asset: 142,668 bytes, JPEG magic `FF D8 FF`; visually inspected with all three silhouettes
  intact and no rectangular photo edges. The centered 16:9 cover crop also retains all three.
- Five pick thumbnails are separate official CDN images with `width=240`. Older assets really
  use `/cdn/shop/products/`, newer assets `/cdn/shop/files/`. Both paths are narrowly allowed
  for `https://www.cmycubes.com`; there is no wildcard host allowance.
  Asset-delivery verification decoded all five at 240×240 with HTTP 200: Original Cube
  9,320 bytes JPEG; Aether 11,019 JPEG; Mundus 10,415 JPEG; Monochromatica 11,687 JPEG;
  Original Pack 82,844 PNG. The CDN negotiates formats, so the Monochromatica `.png` URL
  returned valid JPEG content. Do not relabel or invent a local PNG from its URL extension.
  This confirms the selected images, not six-image browser/Next optimizer QA.

## Price reconciliation and in-stock check

All amounts below are **USD** as checked on 2026-11-26. Shopify JSON and JSON-LD retain regular
variant amounts while the rendered storefront shows a discount on the separately checked
variants. The draft uses the **displayed store price** where observed, always dated and scoped
to the variant. It does not promise that the discount is permanent, calculate an unobserved
bundle discount, or equate JSON with the price a buyer must pay. Shipping, taxes, currency,
regional redirection and available promotions must be checked at checkout.

| Pick / variant | Rendered displayed USD store price | Underlying Shopify JSON / regular USD amount | Availability evidence |
|---|---:|---:|---|
| The Original Cube — Original 50mm | $27.96 | $34.95 | available=true; enabled Add To Cart / Add to cart; visiblePreorder=false |
| The Original Cube — Mini 30mm | $18.36 | $22.95 | same three checks passed |
| The Original Cube — Mega 95mm | $63.96 | $79.95 | same three checks passed |
| The Aether — Original | $35.96 | $44.95 | same three checks passed |
| The Aether — Mini | $27.96 | $34.95 | same three checks passed |
| The Mundus — Original | $35.96 | $44.95 | same three checks passed |
| The Mundus — Mini | $27.96 | $34.95 | same three checks passed |
| The Aeternus Aenigma - Series Monochromatica | $47.96 | $59.95 | same three checks passed |
| The Original Pack | Not captured: rendered price array is empty | $57.95 | available=true; enabled Add to cart; visiblePreorder=false |

**Important exception:** `variant-display-evidence.json` contains `price: []` for The Original
Pack. Its $57.95 is verified Shopify JSON and Product offer data, NOT an independently observed
rendered discounted amount. The draft makes that distinction in its pick and table and tells
the reader to confirm checkout. It does not infer $46.36 from the other products' promotion.
All five selected products are in stock in the saved evidence; that is a dated observation,
not a guarantee of current inventory. Old pack metafields containing `from Mid October` do not
override the enabled purchase control/no-visible-preorder evidence.

## Pick 1 — The Original Cube

- Source: https://www.cmycubes.com/products/the-original-cube?ref=duyan
- Official title: The Original Cube. Six square faces; cyan, magenta and yellow subtractive
  filters. Product details say the filters are sealed on each face. Stand sold separately.
- Exact cube dimensions from `metafields.json` and visually read `downloads/cube-guide.jpg`:
  **Mini 30mm × 30mm × 30mm; Original 50mm × 50mm × 50mm; Mega 95mm × 95mm × 95mm**.
  An 80mm Mega is unsupported and must not appear in the article.
- Positioning: first color-mixing object; default recommendation is the 50mm version, not an
  unqualified best overall or the cheapest possible CMY product.
- Thumbnail: https://www.cmycubes.com/cdn/shop/products/RPS117307.jpg?v=1762482606&width=240

## Pick 2 — The Aether

- Source: https://www.cmycubes.com/products/the-aether?ref=duyan
- Octahedron, eight triangular faces, two square-based pyramids joined at their bases; one of
  the five Platonic solids. Do not copy the merchant's subjective almost-weightless claim.
- `downloads/aether-guide.png`, visually inspected: Mini 40mm tip-to-tip and 29mm edge;
  Original 65mm tip-to-tip and 47mm edge. These are not 30mm/50mm cube edge dimensions.
- Positioning: geometry gift or classroom comparison with the cube. This is an editorial
  reason based on the published shape, not a tested learning benefit.
- Thumbnail: https://www.cmycubes.com/cdn/shop/products/RPS110479.jpg?v=1613816571&width=240

## Pick 3 — The Mundus

- Source: https://www.cmycubes.com/products/the-mundus?ref=duyan
- Dodecahedron with twelve pentagonal faces; one of the five Platonic solids.
- `downloads/mundus-guide.png`, visually inspected: Mini 30mm high / 33mm across / 13mm edge;
  Original 50mm high / 58mm across / 23mm edge. Keep the measured axis attached to the figure.
- Positioning: display collector who wants pentagonal faces rather than another cube. No
  measured brightness, superior color count or optical-quality advantage is asserted.
- Thumbnail: https://www.cmycubes.com/cdn/shop/products/RPS110450.jpg?v=1613816572&width=240

## Pick 4 — The Aeternus Aenigma - Series Monochromatica

- Source: https://www.cmycubes.com/products/the-aeternus-aenigma-series-monochromatica?ref=duyan
- Exact title and 500 lenticular monochrome pieces, each with four visual states, from
  `extra-evidence.json`. Circular puzzle, not a solid acrylic color-filter cube.
- Original color Aeternus Aenigma has a pre-order metafield. The chosen Monochromatica is a
  separate handle with enabled Add to Cart, available=true and visiblePreorder=false.
- Do not borrow the color edition's 58cm/23-inch diameter: the checked Monochromatica
  metafields do not give an equivalent dimension. No piece-material or finish claim is made.
- Positioning: puzzle buyer who wants changing monochrome patterns, not a pocket desk object.
- Thumbnail: https://www.cmycubes.com/cdn/shop/files/Untitleddesign-2026-01-14T183925.391.png?v=1768889106&width=240

## Pick 5 — The Original Pack (Cube + GyroStand)

- Source: https://www.cmycubes.com/products/the-original-cube-gyrostand?ref=duyan
- Official title: The Original Pack. Parenthetical in the draft identifies the contents.
- Body and `metafields.json`: one Original CMY Cube, one GyroStand and one CMY Klean microfiber
  cloth. The separate GyroStand page specifies **Original 50mm cube**, opposite-corner cradle,
  free rotation through 360 degrees. Do not claim motorized or perpetual spinning.
- JSON amount $57.95 only; rendered price not captured. Do not assert bundle savings.
- Positioning: one gift with the compatible rotating stand and cloth already included.
- Thumbnail: https://www.cmycubes.com/cdn/shop/files/6RPS10082_cb4b2c4b-939e-4fc9-9c13-6b1e3a12da8e.png?v=1695779816&width=240

## Cross-cutting science, material, care, sizing and age guidance

- Sources: https://www.cmycubes.com/pages/the-science?ref=duyan and
  https://www.cmycubes.com/blogs/cmycubes/what-are-cmy-cubes-made-of-a-peek-inside-the-colorful-creation?ref=duyan
- Official materials article identifies the CMY Cube as **solid acrylic**, a plastic, sometimes
  described as acrylic glass. Do not describe it as ordinary glass, liquid-filled, squishy or
  unbreakable. This evidence does not establish the material of every puzzle, stand or SKU.
- Science page: cyan absorbs red, magenta absorbs green, yellow absorbs blue. Cyan+yellow
  gives green, magenta+yellow red, cyan+magenta blue. This is subtractive filtering, unlike
  additive RGB light on a screen. No powered display is needed for this explanation.
- Construction contradiction: materials article describes coatings inside the cube and
  moisture-protected layers; current product/FAQ say filters on faces and warn water can lift
  the film at its edges. The draft uses the product/FAQ description, does not resolve the
  manufacturing method, and makes **no waterproof or moisture-proof claim**.
- Care source: https://www.cmycubes.com/pages/faq?ref=duyan . Use a **dry microfiber** cloth
  (official spelling microfibre). Avoid water, sprays, glass cleaner and other chemical
  cleaners. The FAQ explicitly says water can lift the color film at the edges. Washing a
  reusable cloth is not permission to wash a cube. Avoid permanent direct sun over weeks or
  months; brief viewing in light and indefinite windowsill storage are different uses.
- Stand sources: https://www.cmycubes.com/products/the-gyrostand?ref=duyan and
  https://www.cmycubes.com/products/cube-stand?ref=duyan . GyroStand specifies the Original
  50mm cube. Mini Stand supports Mini only, not the Original or Mega size/weight. Do not infer
  Mega or polyhedron compatibility from a photograph or the shared word Original.
- Age: `policy-evidence.json` notFound explicitly records no verified minimum safe age for
  ordinary cubes in the checked scope. All-ages brand copy is not a safety grade. Do not
  transfer Plato's Cubes or PolySquish age 3+ guidance, laboratory claims or choking text to
  these five products. Draft advises checking the selected product's current age guidance and
  supervision needs with the seller before buying for a child; no numeric safe-age claim.
- Health: no independent evidence of treating anxiety, ADHD or improving concentration was
  reviewed. Desk interest, geometry and color demonstrations are editorial use cases, not
  medical or measured educational outcomes.

## Shipping, returns and refunds — checked 2026-11-26

Sources: https://www.cmycubes.com/policies/shipping-policy?ref=duyan ,
https://www.cmycubes.com/pages/shipping-policy?ref=duyan ,
https://www.cmycubes.com/policies/refund-policy?ref=duyan and
https://www.cmycubes.com/pages/faq?ref=duyan .

- Policy says based in Sydney, Australia; ships worldwide. Dispatch is **typically 1–3 business
  days**, possibly longer during sales/holidays. This is not a guaranteed arrival date.
- US Easy Shipping: **$10 USD**, free on orders **over $85 USD**, estimated transit **4–7 business
  days**. US Fast Shipping: **$19 USD**, estimated transit **2–4 business days** in the policy.
- **Mandatory discrepancy:** `/policies/shipping-policy` and the FAQ say US free Fast Shipping
  on orders **over $150 USD**; `/pages/shipping-policy` says **over $300 USD**. Do not silently
  choose one as the universal promise. FAQ calls the `/policies/` version binding. Draft names
  both, advises checkout/seller confirmation and discourages adding an item to hit an uncertain
  threshold. The Original Cube accordion also caps the displayed free-shipping offer at
  US$649.99 while the policy rate table does not state that cap.
- Another unresolved conflict: FAQ Fast-vs-Express answer says Fast changes dispatch priority,
  not courier/transit, while its rate table and policy show different transit estimates.
  The draft attributes estimates and says not to assume a guaranteed upgrade or event date.
- Other destinations: rates/currencies differ. Policy says EU/UK duties paid, other destinations'
  import charges are the buyer's responsibility. Generic FAQ wording is broader. Do not apply
  US dollar thresholds or US timing to all countries.
- Missing parcels: policy claim window **30 days from expected delivery**; carrier investigation
  may take **up to 8 weeks** before loss/return resolution. Carrier-confirmed delivery to the
  correct address is outside Shipping Protection. Optional protection is not blanket theft
  insurance. $10 reship fee is not a restocking fee. These details are not a reason to promise
  a refund by a fixed day.
- Refund policy explicitly excludes change of mind and finding the same product cheaper.
  FAQ also excludes change-of-mind exchanges. **No general 30-day trial/return window** exists
  in the checked material.
- Delivery damage: contact as soon as possible and **within 30 days of receipt**, retain the
  product/packaging and provide order proof/photos. Policy offers repair, equivalent replacement
  or refund as applicable. Request-processing aim **3–5 days** is not refund settlement timing.
- Australian Consumer Law rights are expressly preserved; a no-change-of-mind policy does not
  erase applicable rights for faults. No fixed general cube warranty term was found. PolySquish
  replacement/warranty terms are product-specific and must not be transferred to acrylic cubes.

## Internal links and schema contract

`internal-links.json` already verifies HTTP 200 for `/methodology`, `/affiliate-disclosure`,
`/tech`, `/best` and `/best/best-phomemo-printers`. All five appear as descriptive prose links.
The rendered page must keep the author byline and Article + BreadcrumbList metadata. Five
shared storefront destinations intentionally suppress ItemList via the existing duplicate-URL
guard. No Product, Review, aggregateRating or invented stock/price schema is added.
