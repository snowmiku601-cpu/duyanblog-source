# Ottocast roundup — claim/evidence ledger (checked October 29, 2026)

All claims below were verified on ottocast.com official pages, fetched directly (curl, browser UA)
on 2026-10-29. Screenshots of raw HTML cached locally during the research session; page fetches were
rate-limited, so the Ottoscreen AI product page itself was read from the homepage product card data
plus cross-page references (see conflict note below).

## Affiliate / tracking

- Exact affiliate URL: `https://www.ottocast.com/?ref=LAZYCORMORANT` (owner-provided, owner-confirmed
  as their registered affiliate referral link).
- Deep-link tracking NOT verified → all commercial CTAs point at the storefront homepage with the
  ref parameter, labelled "Visit merchant store" (same pattern as the Fanttik roundup).
- Owner confirmed in-session permission to use, crop, edit and composite Ottocast product images.
  Recorded as owner-reported marketing image permission; no written license, email, signer or
  contract is asserted.

## Pick 1 — Ottocast Mini NOVA Wireless CarPlay/Android Auto Adapter

- URL: https://www.ottocast.com/products/ottocast-mini-aura-wireless-carplay-android-auto-adapter
  (slug says "mini-aura"; the product's og:title and on-page H1 say "Mini NOVA" — naming
  inconsistency noted, we use the on-page product name).
- og:image: //www.ottocast.com/cdn/shop/files/ottocast-mini-aura-t3-adapter-main-square-01.jpg?v=1770970406 (200 OK)
- Displayed price: Sale $49.00, Regular $69.00 (on-page PRICE block; Shopify "price" meta 4900 cents).
- Requirements (page "BEFORE YOU BUY"): factory wired CarPlay OR factory wired Android Auto; 2016 or
  newer vehicles; iPhone iOS 10+ / Android 11+ (selected Samsung/Google phones Android 9).
- Not compatible: Sony aftermarket head units; Mitsubishi vehicles need a note at checkout or email.
- Factory wireless CarPlay vehicles (e.g. some BMW): page recommends OttoAibox i3 instead.
- Features: wireless CarPlay + wireless Android Auto, auto-reconnection, works with car's controls,
  FOTA updates, aluminum body, RGB light ring (og:description), built-in battery ("Select what's on
  screen Built-in battery No wires to run").
- Plug into USB data port; installation "plug it in and it works".

## Pick 2 — Play2Video Ultra Wireless CarPlay/Android Auto All-in-1 Adapter

- URL: https://www.ottocast.com/products/play2video-ultra
- og:image: //www.ottocast.com/cdn/shop/files/play2video-ultra-wireless-carplay-android-auto-all-in-1-adapter-main-square-01.jpg?v=1767083058 (200 OK)
- Displayed price: Sale $89.00, Regular $109.00 (page shows "18% OFF Price Drop Limited Time" —
  we do NOT assert discount framing; just displayed price).
- Requirements (page): **factory wired Apple CarPlay required** ("Requires Factory Wired Apple
  CarPlay For 2016 or newer vehicles"). "❌ Wired Android Auto-only vehicles are not supported."
  "Not supported: Android Auto-only or wireless-only CarPlay vehicles." Sony aftermarket head units
  not compatible; Mitsubishi note; non-touchscreen car screens need optional remote controller.
- Phones: iPhone iOS 10+, Android 11+ (selected Samsung/Google Android 9).
- Apps: Netflix, YouTube, IPTV, Prime Video preinstalled; App Hub lets you add up to 5 more
  (examples given: U-NEXT, DAZN, Torne Mobile, LINE MUSIC). Closed Android system (page's own
  stability/security pitch). No split-screen mode ("Does this product support split-screen mode? No.").
- Compare table: 4GB RAM + 32GB ROM, Bluetooth 5.4, dual-band Wi-Fi 6, IML carbon fiber finish,
  79 × 39 × 15 mm (vs Play2Video X: 2GB/16GB, BT 4.2, Wi-Fi 5, 85.22 × ...).
- FOTA updates via OttoPilot app. Must be plugged into a USB data port (not charge-only).
- Upgraded version of CA400-S2.
- SAFETY: page contains NO parking-brake/video-lock language; it markets watching videos ("Just
  plug it in and enjoy big-screen videos"). We write our own safety-conscious framing: viewing
  video on the car screen while driving is illegal in many jurisdictions and restricted by the
  device/car; treat it as a passenger/parked feature. This framing is ours, not Ottocast's claim.

## Pick 3 — OttoAibox P3 Pro CarPlay AI Box

- URL: https://www.ottocast.com/products/ottoaibox-p3-pro-carplay-ai-box
- og:image: //www.ottocast.com/cdn/shop/files/20260924-104650.png?v=1790218043 (200 OK, PNG)
- Displayed price: Sale $219.00 (no regular price shown on page PRICE block; homepage card also
  $219.00; 34 reviews shown on page).
- Requirements (page): "Your vehicle must support factory wired CarPlay or factory wired Android
  Auto"; 2016 or newer; connects through the car's USB port. Same phone OS requirements; Sony
  aftermarket heads out; Mitsubishi note. Factory-wireless-CarPlay BMW vehicles → i3 recommended.
- Specs: Snapdragon 6225 chip, 8GB RAM + 128GB ROM, Android 13 + OttoDrive 3.0 (og:description and
  compare table vs P3: Snapdragon 6125, 4GB/64GB). CloudSIM 3.0, dual Wi-Fi, dual-screen support,
  HDMI output, FOTA. Download "any app you like" (page's words — we do NOT promise every Android
  app runs correctly; we state Ottocast's claim as the maker's claim).
- AI Voice: free allowance 3 months / 1,000 conversation rounds, then $7.90/1,000 queries,
  $14.90/2,000, $29.90/4,000 (page FAQ). Netflix NOT supported in split-screen mode (page FAQ).
- Connectivity: CloudSIM, phone hotspot, vehicle Wi-Fi, portable Wi-Fi, or a SIM card (FAQ); APN
  may need setting. AI Voice Service Pack sold separately for smart voice.
- Region variants: "For North America" and "For Europe/Asia/Australia/Middle East/South America"
  variant selector on page.
- After-sale (page): 30-Day Returns, 1-Year Warranty, Dedicated Support. OTTOCARE +1yr extended
  warranty $20.99 (AI Box version).
- A customer review excerpt on the page: "Doesn't Work With Wireless Android Auto Vehicles" (Mike W.)
  — consistent with the wired requirement; not used as editorial evidence, just consistency check.

## Pick 4 — OttoAibox i3 BMW CarPlay AI Box

- URL: https://www.ottocast.com/products/ottoaibox-i3
- og:image: //www.ottocast.com/cdn/shop/files/ottoaibox-i3-bmw-carplay-ai-box-main-square-01.jpg?v=1767083167 (200 OK)
- Displayed price: Sale $229.00, Regular $325.00 (39 reviews on page).
- Compatibility (page): "Exclusively for BMW iDrive 6/7/8/9" (og:description) BUT variant selector
  has TWO model options: "BMW" (iDrive 6/7/8/9) and "Ford/Hyundai & more" (Ford, Audi, Hyundai and
  other vehicles with factory wireless CarPlay). Detailed per-brand compatibility is shown in a
  compatibility IMAGE on the page (not machine-readable).
- Compatible models list (BMW option): BMW 2018–2024: 3/4/5/7/8 Series, X1, X3, X4, X5, X6, X7,
  "X21" [sic — page text; likely X2], i3 2018–2023, i8 2019–2020, Z4 2019–2024. Also listed: BYD
  Seal/Sealion/Denza 2023–2025, Audi A6 2024, Ford Sync 4 2024, Porsche Panamera 2024/Cayenne 2023/
  Macan 2024 [page spells "Prosche"], Hyundai Elantra 2024/Ix35, Changan Deepal 2025, MG4, Rolls-Royce
  Cullinan 2024, Volvo EX30 2024, Lexus NX 2024, MINI Cooper/Countryman 2024+ only.
- Specs: Qualcomm Snapdragon 6125, Android 13, 8GB RAM + 128GB ROM (now standard across regions per
  FAQ), Bluetooth 5.0, dual-band Wi-Fi, TF card up to 256GB, USB 5V~1A, OttoDrive OS open Android.
- Full-screen display depends on the car's factory wired CarPlay system (FAQ).
- Uses: unlocks Android 13 on the iDrive screen, streaming apps, wireless CarPlay/AA conversion.
  Region variants as P3 Pro.

## Pick 5 — Ottoscreen AI (portable display)

- URL: https://www.ottocast.com/products/ottoscreen-ai (product page fetched successfully on
  retry — browser-UA curl was rate-limited; default-UA curl succeeded).
- og:title: "Ottoscreen AI". Thumbnail (homepage card):
  //www.ottocast.com/cdn/shop/files/ottoscreen-ai-square-01-2.jpg?v=1770618450 (200 OK).
- Displayed price: Sale $169.00, Regular $260.00 (page PRICE block).
- Specs (page): 11.4-inch widescreen HD display; Android 15; 8-core CPU; 4GB RAM + 32GB ROM;
  AI assistant; wireless CarPlay & Android Auto; stream video & install apps.
- Audio outputs (page, four paths): Bluetooth audio, wired AUX, FM transmitter, screen's own
  speakers (described as backup sound).
- Standalone: FAQ says it can work independently without staying connected to a phone, and can
  move between cars (re-mount bracket, reconnect power, re-pair phone).
- Category context (site-wide): "Plug and play screen for all cars ... built in front and rear
  cameras and GPS tracking for car and motorcycles."
- Compare table on page (Ottoscreen AI vs ScreenFlow): AI assistant YES vs NO; 8-core vs 4-core
  CPU; 4GB/32GB vs 2GB/32GB; "All apps allowed" vs "Download Limited" app store; split-screen
  "anything you want" vs "CarPlay & App"; Android 15 vs 13.
- Compatibility-widget cross-reference: when a visitor's car "does not have factory CarPlay",
  Ottocast's own widget recommends Ottoscreen AI as the solution for those cars.

## Policies

- Shipping policy page (https://www.ottocast.com/pages/shipping-policy): processing 1-2 business
  days; free shipping worldwide (estimate 10-15 days, varies by country); express $40 (DHL/FedEx/
  UPS, 1-2 days faster); 10% restock/handling charge if an item is unclaimed and returned; customs/
  import duties are the buyer's responsibility.
- Refund & Return policy page (/pages/refund-return-policy) could not be fetched (404 at that URL
  during session); product pages state "30-Day Returns, 1-Year Warranty, Dedicated Support" in their
  after-sale strip — quoted as product-page wording.
- FAQ page (/pages/faqs) could not be fetched (rate limit); FAQ content used comes from individual
  product pages' own FAQ sections.

## Prices summary (displayed, checked 2026-10-29)

| Product | Displayed price | Regular price shown |
|---|---|---|
| Mini NOVA | $49.00 | $69.00 |
| Play2Video Ultra | $89.00 | $109.00 |
| OttoAibox P3 Pro | $219.00 | (none shown) |
| OttoAibox i3 | $229.00 | $325.00 |
| Ottoscreen AI | $169.00 | $260.00 |

House rule (from Task 53.2/53.3): we call these "displayed Ottocast store prices," never assert
discount status, and include the prices-vary caveat.
