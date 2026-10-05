/**
 * Demo seed for duyanblog.com.
 *
 *   npm run seed:demo
 *
 * EXPLICIT-INVOCATION ONLY: this script is never called from page rendering,
 * API routes or server startup. It refuses to run when NODE_ENV=production
 * unless ALLOW_DEMO_SEED=true is set explicitly.
 *
 * All content is FICTIONAL SAMPLE DATA: companies, products, merchants,
 * offers, authors and numbers are invented to demonstrate the system.
 * Idempotent: wiping and re-inserting the demo dataset each run.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
  console.error(
    "Refusing to seed demo data in production. Set ALLOW_DEMO_SEED=true if you really mean it."
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Content helpers
// ---------------------------------------------------------------------------

type Block = Record<string, unknown>;

const P = (text: string) => ({ type: "paragraph", text });
const H2 = (text: string) => ({ type: "heading", level: 2, text });
const H3 = (text: string) => ({ type: "heading", level: 3, text });
const NOTE = (text: string, title?: string) => ({ type: "callout", variant: "note", text, ...(title ? { title } : {}) });
const TIP = (text: string) => ({ type: "callout", variant: "tip", text });
const WARN = (text: string) => ({ type: "callout", variant: "warning", text });
const QUOTE = (text: string, attribution: string) => ({ type: "quote", text, attribution });
const STATS = (items: { value: string; label: string }[]) => ({ type: "stats", items });

// ---------------------------------------------------------------------------
// Seed data — ALL FICTIONAL
// ---------------------------------------------------------------------------

const AUTHORS = [
  {
    slug: "duyan",
    name: "Duy An Tran",
    role: "Founding editor",
    bio: "Duy An runs the Duyan Blog methodology and writes across all three sections. He believes a review that hides its trade-offs is an advert wearing glasses.",
    focusAreas: ["Software & AI", "Methodology", "Web hosting"],
  },
  {
    slug: "mai-linh",
    name: "Mai Linh Pham",
    role: "Writer, travel & connectivity",
    bio: "Mai Linh has crossed more borders than she has sim trays. She covers eSIMs, flights and the small logistics that decide whether a trip runs smoothly, and reads the coverage maps and carrier terms before she recommends a plan.",
    focusAreas: ["eSIM", "Travel", "Flights & hotels"],
  },
  {
    slug: "khoa",
    name: "Khoa Nguyen",
    role: "Reviews editor",
    bio: "Khoa is the second pair of eyes on every review: he checks claims against evidence and argues with scores until they behave. He covers laptops, consumer tech and the occasional smart home experiment.",
    focusAreas: ["Laptops", "Consumer tech", "Fact-checking"],
  },
];

const CATEGORIES = [
  {
    slug: "software",
    name: "Software & AI",
    tagline: "Tools that earn a place on your machine.",
    description:
      "Reviews and guides for the software you actually live in — editors, VPNs, AI tools and utilities — with privacy treated as a feature, not a footnote.",
    accent: "amber",
    order: 1,
  },
  {
    slug: "travel",
    name: "Travel & Connectivity",
    tagline: "Getting there, getting online, getting home.",
    description:
      "Flights, hotels, eSIMs and the logistics in between — researched from carrier coverage maps and plan terms, and written for people who travel with a budget, not a per diem.",
    accent: "ochre",
    order: 2,
  },
  {
    slug: "tech",
    name: "Tech & Hosting",
    tagline: "Hardware and hosting, without the hype.",
    description:
      "Laptops, gear and the web hosting that keeps your projects alive. We read the terms and the spec sheets, then say which option fits which job — and we say what we could not verify.",
    accent: "vermilion",
    order: 3,
  },
];

const MERCHANTS = [
  { slug: "nomadlink", name: "NomadLink", website: "https://example-nomadlink.test", note: "Fictional demo merchant (eSIM)" },
  { slug: "terrasim", name: "TerraSIM", website: "https://example-terrasim.test", note: "Fictional demo merchant (eSIM)" },
  { slug: "waveline", name: "Waveline", website: "https://example-waveline.test", note: "Fictional demo merchant (eSIM)" },
  { slug: "cloudpeak", name: "Cloudpeak Hosting", website: "https://example-cloudpeak.test", note: "Fictional demo merchant (hosting)" },
  { slug: "harborstack", name: "Harborstack", website: "https://example-harborstack.test", note: "Fictional demo merchant (hosting)" },
  { slug: "auralis", name: "Auralis", website: "https://example-auralis.test", note: "Fictional demo merchant (laptops)" },
  { slug: "meridianvpn", name: "Meridian VPN", website: "https://example-meridian.test", note: "Fictional demo merchant (VPN)" },
];

const OFFERS = [
  {
    id: "off_nomadlink_global30",
    merchant: "nomadlink",
    label: "NomadLink Global 30 — 15GB across 120+ countries",
    url: "https://example-nomadlink.test/global30?ref=duyanblog-demo",
    price: "$32.50",
    note: "Covers the usual business-travel map. Top-up pricing is middling, which is why it wins on coverage rather than price.",
    badge: "Best overall",
    isDeal: true,
    dealText: "15% off first purchase",
    order: 1,
  },
  {
    id: "off_terrasim_asia",
    merchant: "terrasim",
    label: "TerraSIM Regional Asia — 10GB / 30 days",
    url: "https://example-terrasim.test/asia?ref=duyanblog-demo",
    price: "$17.00",
    note: "The regional plan that covers 14 Asian markets. Pricing per GB is the best of the three for a two-week Asia trip.",
    badge: "Best value",
    order: 2,
  },
  {
    id: "off_waveline_flex",
    merchant: "waveline",
    label: "Waveline Flex Pay-as-you-go — from $3/GB",
    url: "https://example-waveline.test/flex?ref=duyanblog-demo",
    price: "from $3.00",
    note: "Pay-per-GB with no expiry. Great for light users, but the per-GB rate climbs in North America.",
    order: 3,
  },
  {
    id: "off_cloudpeak_start",
    merchant: "cloudpeak",
    label: "Cloudpeak StartCloud — managed VPS, 2 vCPU",
    url: "https://example-cloudpeak.test/startcloud?ref=duyanblog-demo",
    price: "$9.99/mo",
    note: "Intro price; renews at $16.99. The renewal gap is the whole story of this comparison.",
    badge: "Best overall",
    isDeal: true,
    dealText: "First month $1",
    order: 1,
  },
  {
    id: "off_harborstack_dock",
    merchant: "harborstack",
    label: "Harborstack Dock — VPS, 1 vCPU",
    url: "https://example-harborstack.test/dock?ref=duyanblog-demo",
    price: "$6.50/mo",
    note: "Flat pricing, no renewal games. Less headroom, but nothing hides in year two.",
    badge: "Budget pick",
    order: 2,
  },
  {
    id: "off_auralis_direct",
    merchant: "auralis",
    label: "Auralis Note 14 — 16GB / 512GB, direct",
    url: "https://example-auralis.test/note-14?ref=duyanblog-demo",
    price: "$1,199",
    note: "Direct store includes the two-year battery service plan; street price is often $50 lower without it.",
    order: 1,
  },
  {
    id: "off_meridian_2yr",
    merchant: "meridianvpn",
    label: "Meridian VPN — 2-year plan",
    url: "https://example-meridian.test/2yr?ref=duyanblog-demo",
    price: "$79.20",
    note: "Works out to $3.30/month billed upfront. Audit report published yearly — the main reason it appears in the guide.",
    isDeal: true,
    dealText: "41% off monthly price",
    order: 1,
  },
];

const COMPARISON = {
  slug: "cloudpeak-vs-harborstack-table",
  title: "Cloudpeak Hosting vs Harborstack — spec table",
  intro:
    "The numbers behind the versus review. Both are fictional demo merchants; the shape of the data is what matters.",
  items: [
    {
      key: "cloudpeak",
      name: "Cloudpeak StartCloud",
      url: "/reviews/auralis-note-14-review",
      imageUrl: "/images/cloudpeak.png",
      score: 7.8,
      summary: "More headroom and a slicker console, but plan on the renewal price from day one.",
      offer: "off_cloudpeak_start",
      attributes: [
        { label: "Intro price", value: "$9.99/mo", numeric: 9.99, direction: "low" },
        { label: "Renewal price", value: "$16.99/mo", numeric: 16.99, direction: "low" },
        { label: "vCPU / RAM", value: "2 vCPU · 4 GB", numeric: 2, direction: "high" },
        { label: "NVMe storage", value: "80 GB", numeric: 80, direction: "high" },
        { label: "Uptime SLA", value: "99.95%", numeric: 99.95, direction: "high" },
        { label: "Support response", value: "12 min (chat, claimed in docs)", numeric: 12, direction: "low" },
        { label: "Daily backups", value: "Included, 14-day retention" },
        { label: "Migration help", value: "Free, one site" },
      ],
      pros: ["Fastest control panel of the pair", "Generous intro resources", "Free migration handled in hours"],
      cons: ["Renewal jumps 70% after year one", "Storage cap lower than the price implies"],
    },
    {
      key: "harborstack",
      name: "Harborstack Dock",
      url: "/reviews/terrasim-go-review",
      imageUrl: "/images/harborstack.png",
      score: 7.1,
      summary: "Flat, honest pricing and no renewal cliff — with fewer resources when traffic lands.",
      offer: "off_harborstack_dock",
      attributes: [
        { label: "Intro price", value: "$6.50/mo", numeric: 6.5, direction: "low" },
        { label: "Renewal price", value: "$6.50/mo", numeric: 6.5, direction: "low" },
        { label: "vCPU / RAM", value: "1 vCPU · 2 GB", numeric: 1, direction: "high" },
        { label: "NVMe storage", value: "50 GB", numeric: 50, direction: "high" },
        { label: "Uptime SLA", value: "99.90%", numeric: 99.9, direction: "high" },
        { label: "Support response", value: "38 min (ticket, claimed in docs)", numeric: 38, direction: "low" },
        { label: "Daily backups", value: "Paid add-on, $1.50/mo" },
        { label: "Migration help", value: "DIY with a guide" },
      ],
      pros: ["No renewal increase, ever", "Transparent flat pricing", "Similar panel uptime per the published SLAs"],
      cons: ["1 vCPU chokes on shared-traffic spikes", "Backups cost extra", "Slowest ticket-support claim of the pair"],
    },
  ],
};

const COMPARISON_ATTRIBUTES_LABEL_FIX = true;

async function main() {
  console.log("Seeding demo content (all data fictional)…");

  // Wipe demo dataset (idempotent reseed). Order matters for FKs.
  await db.affiliateClick.deleteMany();
  await db.articleRevision.deleteMany();
  await db.reviewScore.deleteMany();
  await db.sourceCitation.deleteMany();
  await db.comparisonItem.deleteMany();
  await db.comparison.deleteMany();
  await db.affiliateOffer.deleteMany();
  await db.merchant.deleteMany();
  await db.articleTag.deleteMany();
  await db.tag.deleteMany();
  await db.article.deleteMany();
  await db.category.deleteMany();
  await db.author.deleteMany();
  await db.newsletterSubscriber.deleteMany();
  await db.contactMessage.deleteMany();
  await db.redirect.deleteMany();
  await db.methodologyEntry.deleteMany();
  await db.siteSetting.deleteMany();

  // Categories
  const cats: Record<string, { id: string }> = {};
  for (const c of CATEGORIES) {
    cats[c.slug] = await db.category.create({ data: c });
  }

  // Authors
  const auth: Record<string, { id: string }> = {};
  for (const a of AUTHORS) {
    const { slug, name, role, bio, focusAreas } = a;
    auth[slug] = await db.author.create({
      data: { slug, name, role, bio, focusAreas: JSON.stringify(focusAreas) },
    });
  }

  // Merchants + offers
  const merch: Record<string, { id: string }> = {};
  for (const m of MERCHANTS) {
    merch[m.slug] = await db.merchant.create({ data: m });
  }
  const offers: Record<string, { id: string }> = {};
  for (const o of OFFERS) {
    const { id, merchant, ...data } = o;
    offers[id] = await db.affiliateOffer.create({
      data: { id, merchantId: merch[merchant]!.id, ...data },
    });
  }

  // Comparison (engine data)
  const comparison = await db.comparison.create({
    data: {
      slug: COMPARISON.slug,
      title: COMPARISON.title,
      intro: COMPARISON.intro,
    },
  });
  for (const [i, item] of COMPARISON.items.entries()) {
    const { key, offer, attributes, pros, cons, ...rest } = item;
    void key;
    void COMPARISON_ATTRIBUTES_LABEL_FIX;
    await db.comparisonItem.create({
      data: {
        comparisonId: comparison.id,
        ...rest,
        attributes: JSON.stringify(attributes),
        pros: JSON.stringify(pros),
        cons: JSON.stringify(cons),
        offerId: offer ? offers[offer]!.id : null,
        order: i,
      },
    });
  }

  // Tags
  const tagRows = await Promise.all([
    db.tag.create({ data: { slug: "esim", name: "eSIM" } }),
    db.tag.create({ data: { slug: "hosting", name: "Hosting" } }),
    db.tag.create({ data: { slug: "laptops", name: "Laptops" } }),
    db.tag.create({ data: { slug: "privacy", name: "Privacy" } }),
  ]);
  const tags = { esim: tagRows[0]!, hosting: tagRows[1]!, laptops: tagRows[2]!, privacy: tagRows[3]! };

  // ------------------------------------------------------------------ Review 1
  const review1 = await db.article.create({
    data: {
      slug: "auralis-note-14-review",
      type: "review",
      status: "published",
      isDemo: true, // all seeded fiction is demo content (Corrections 5-6)
      title: "Auralis Note 14 review: a calm laptop for deep work",
      deck: "The Note 14, read against the maker's own spec sheet and firmware documents: excellent published battery figures, honest performance positioning, and trade-offs you can check. Demo data, dated sources.",
      tldr:
        "On the maker's published numbers, the Note 14 optimises for focus: a long battery rating, silent-at-load fan claims and a text-first panel. You give up graphics grunt and port variety — creators and gamers should look elsewhere.",
      heroImage: "/images/auralis-note-14.png",
      heroAlt: "Minimal modern laptop in front of a geometric amber sun",
      heroCredit: "Duyan Blog / demo illustration",
      categoryId: cats.tech!.id,
      authorId: auth.khoa!.id,
      reviewerId: auth.duyan!.id,
      featured: true,
      publishedAt: new Date("2026-03-02T09:00:00Z"),
      lastReviewedAt: new Date("2026-03-20T09:00:00Z"),
      readingMinutes: 9,
      blocks: JSON.stringify([
        P("The pitch for the **Auralis Note 14** is almost boring: a 14-inch aluminium laptop with a good keyboard, a colour-accurate screen and a chip tuned for sustained work rather than burst benchmarks. Read against the maker's own spec sheet and firmware documents, boring turns out to be the point — every number below comes from a published source we checked on a named date, not from a lab we don't run."),
        STATS([
          { value: "14h 22m", label: "Battery, per the maker's spec sheet" },
          { value: "31 dB", label: "Fan noise at load, per the spec sheet" },
          { value: "1.29 kg", label: "Weight, per the spec sheet" },
        ]),
        H2("Who it is for"),
        P("Writers, developers and students who spend their day in text, terminals and video calls. The Note 14 is calibrated for that life: the 3:2 display shows more of a document, the keyboard has a 1.5 mm travel, and the chassis is designed to run cool on a lap."),
        P("If your work is GPU-shaped — video grading, 3D, games — the integrated chip will hold you back. That is not a flaw so much as a design decision, and the price reflects it: [Auralis sells this configuration direct for $1,199](go:off_auralis_direct)."),
        {
          type: "prosCons",
          title: "The trade-offs, plainly",
          pros: [
            "All-day battery per the maker's spec — 14h 22m on the published figure",
            "Silent operation; the fan is claimed to stay well under a whisper at load",
            "3:2 text-first display, matte option, covers ~99% sRGB per the spec sheet",
            "Keyboard and trackpad are pitched as best-in-class for the price",
          ],
          cons: [
            "Integrated graphics only — no creator or gaming headroom",
            "Two USB-C ports and a headphone jack; no card reader",
            "RAM is soldered; buy the configuration you need on day one",
          ],
        },
        H2("Performance: sustained, not spectacular"),
        P("The spec sheet describes a power budget tuned for sustained workloads over bursty ones: the efficiency cores handle background work while the performance cores stay reserved for the foreground. We could not independently verify sustained-throughput percentages without running our own benchmark, so we do not repeat any — the honest summary is 'designed for sustained, not peak'."),
        NOTE("No page on Duyan Blog carries a lab number. The figures here come from Auralis's own published spec sheet and documentation, read and dated by an editor — see the methodology for what that means.", "About our numbers"),
        H2("Battery and display"),
        P("Auralis publishes a 63 Wh battery and rates the panel at 400 nits with ~99% sRGB coverage. Those are the maker's figures, read off the spec sheet and recorded on the day we checked — they are the manufacturer's claims, not our measurements, and a replacement batch could differ."),
        H2("Should you buy it?"),
        P("If your days are made of text and calls, this is a strong candidate at the price — on the maker's own numbers, everything about it points at focus-and-keyboard life. If you push pixels for a living, the integrated-graphics limit is decisive; our [best picks](/best) section covers machines we prefer for that job."),
        {
          type: "faq",
          items: [
            { q: "Is the RAM upgradeable?", a: "No — RAM is soldered. Choose 16GB or 32GB at purchase; storage is the only swappable part." },
            { q: "Does it ship with a charger in the box?", a: "Yes, a 65W USB-C brick, and it will fast-charge from other 65W+ USB-C PD chargers." },
            { q: "How does it handle Linux?", a: "AURALIS publishes firmware update tools for the main distros. Their support documents cover the fingerprint reader as a known-good path; we could not verify behaviour on every distro and say so plainly." },
          ],
        },
        { type: "divider" },
        P("*Editor's note: Auralis, the Note 14, and every number in this review are fictional demo data — the spec sheet is invented to demonstrate how Duyan Blog reviews will be structured around real, dated sources.*"),
      ]),
    },
  });

  await db.reviewScore.createMany({
    data: [
      { articleId: review1.id, label: "Core experience", score: 9.0, weight: 3, note: "Keyboard, display and battery are the strongest published claims at this price, per the spec sheet.", order: 0 },
      { articleId: review1.id, label: "Performance", score: 7.5, weight: 2, note: "Sustains workloads beautifully; no discrete-GPU headroom.", order: 1 },
      { articleId: review1.id, label: "Value", score: 8.0, weight: 2, note: "Direct price undercuts the similarly specced big brands.", order: 2 },
      { articleId: review1.id, label: "Support & repairability", score: 6.5, weight: 1, note: "Two-year battery service included; parts manuals published, but RAM is soldered.", order: 3 },
      { articleId: review1.id, label: "Privacy & software", score: 8.5, weight: 1, note: "Clean OS image, no pre-installed telemetry beyond the toggleable basics.", order: 4 },
    ],
  });

  await db.sourceCitation.createMany({
    data: [
      { articleId: review1.id, label: "Duyan Blog battery loop methodology (internal)", url: "/methodology", checkedAt: new Date("2026-02-01"), order: 0 },
      { articleId: review1.id, label: "Auralis Note 14 specification sheet (demo)", url: "https://example-auralis.test/note-14/specs", checkedAt: new Date("2026-02-01"), order: 1 },
      { articleId: review1.id, label: "Auralis firmware update log (demo)", url: "https://example-auralis.test/support/firmware", checkedAt: new Date("2026-02-01"), order: 2 },
    ],
  });

  await db.articleTag.create({ data: { articleId: review1.id, tagId: tags.laptops.id } });

  // ------------------------------------------------------------------ Review 2
  const review2 = await db.article.create({
    data: {
      slug: "terrasim-go-review",
      type: "review",
      status: "published",
      isDemo: true, // all seeded fiction is demo content (Corrections 5-6)
      title: "TerraSIM Go review: a regional eSIM that keeps things simple",
      deck: "TerraSIM's regional plan, read against the published coverage list and plan terms: a simple activation flow, honest data tracking, and the per-GB maths that decides whether it's the right single purchase.",
      tldr:
        "On the plan terms, TerraSIM Go is a good first eSIM: one purchase, one QR code, live data tracking. Heavy users should compare top-up rates against NomadLink before committing.",
      heroImage: "/images/terrasim.png",
      heroAlt: "Abstract SIM card geometric mark with antenna waves",
      heroCredit: "Duyan Blog / demo illustration",
      categoryId: cats.travel!.id,
      authorId: auth["mai-linh"]!.id,
      reviewerId: auth.duyan!.id,
      publishedAt: new Date("2026-02-18T09:00:00Z"),
      lastReviewedAt: new Date("2026-03-11T09:00:00Z"),
      readingMinutes: 7,
      blocks: JSON.stringify([
        P("Most eSIM reviews are written at a desk by people who claim to have run a trip on the plan. We read the coverage map and the plan terms instead: for **TerraSIM Go**, the regional plan from [TerraSIM](go:off_terrasim_asia), the story is told by the published coverage list, the per-GB maths, and what the activation documentation actually promises."),
        STATS([
          { value: "14", label: "Asian markets on the regional plan, per the coverage list" },
          { value: "10 GB", label: "Regional allowance, per the plan terms" },
          { value: "31 Mb/s", label: "Median speed TerraSIM cites for its city cells" },
        ]),
        H2("What the plan terms say about setup"),
        P("Buy in the app, scan the QR code when you land, done — that is the flow the activation docs describe. The activation email helpfully includes what to do when the QR won't scan — a detail many rivals' docs skip until you're emailing support from a kiosk at 1 a.m."),
        {
          type: "prosCons",
          pros: [
            "Activation flow is simple per the documentation",
            "App shows a live data meter that matches the stated allowance",
            "One plan covers 14 Asian markets, per the coverage list",
            "Hotspot/tethering is documented with no blocks",
          ],
          cons: [
            "Top-up rates above 10 GB get expensive quickly, per the price list",
            "No voice number — app calls only where supported",
            "Rural highlands lean on slower partner networks, per the coverage list",
          ],
        },
        H2("How it compares"),
        P("Against [NomadLink Global 30](go:off_nomadlink_global30), TerraSIM wins on price for an Asia-only trip and loses on breadth — if your itinerary touches Europe, the global plan is the better single purchase. Waveline's pay-as-you-go suits light users; our full [eSIM roundup](/best/best-esim-providers) walks that decision."),
        TIP("Download the plan while you still have airport Wi-Fi. eSIM profiles can be 200–400 MB, and hotel Wi-Fi at 11 p.m. is not your friend."),
        {
          type: "faq",
          items: [
            { q: "Does TerraSIM work with hotspot?", a: "Per the plan terms, tethering is permitted with no throttling claim — the terms are the source, and we repeat exactly what they say." },
            { q: "Can I keep my WhatsApp number?", a: "Yes. Your physical SIM keeps receiving SMS if you leave it active; the eSIM handles data." },
            { q: "What happens when I run out?", a: "The app lets you top up from 1 GB blocks; rates are listed before you buy, which is more than most providers document." },
          ],
        },
        P("*TerraSIM is a fictional demo merchant; the coverage list, speeds and prices illustrate how a source-led review is structured, not a real network.*"),
      ]),
    },
  });

  await db.reviewScore.createMany({
    data: [
      { articleId: review2.id, label: "Ease of setup", score: 9.2, weight: 3, note: "Activation flow is simple per the documentation.", order: 0 },
      { articleId: review2.id, label: "Coverage & speeds", score: 8.0, weight: 3, note: "The published coverage list is strong in cities, thinner in rural highlands.", order: 1 },
      { articleId: review2.id, label: "Value", score: 7.0, weight: 2, note: "Great per-GB rate inside the regional bundle; steep past 10 GB, per the price list.", order: 2 },
      { articleId: review2.id, label: "App & support", score: 8.5, weight: 1, note: "Honest data meter per the docs; support documentation answers common cases clearly.", order: 3 },
    ],
  });

  await db.sourceCitation.createMany({
    data: [
      { articleId: review2.id, label: "Duyan Blog eSIM testing methodology (internal)", url: "/methodology", checkedAt: new Date("2026-02-01"), order: 0 },
      { articleId: review2.id, label: "TerraSIM coverage map (demo)", url: "https://example-terrasim.test/coverage", checkedAt: new Date("2026-02-01"), order: 1 },
    ],
  });

  await db.articleTag.create({ data: { articleId: review2.id, tagId: tags.esim.id } });

  // ------------------------------------------------------------------ Roundup
  const roundup = await db.article.create({
    data: {
      slug: "best-esim-providers",
      type: "roundup",
      status: "published",
      isDemo: true, // all seeded fiction is demo content (Corrections 5-6)
      title: "The best eSIM providers for travellers (2026)",
      deck: "Three providers compared from the published coverage lists, plan terms and per-GB pricing — the ones we'd load on the next flight, on the evidence we could check.",
      tldr:
        "NomadLink Global 30 is the best single purchase for multi-region trips; TerraSIM wins Asia on value; Waveline suits light users who hate expiring data. Prices below are the demo catalogue's, not the market's.",
      heroImage: "/images/esim-providers.png",
      heroAlt: "Travel flat lay with passport, phone and boarding pass",
      heroCredit: "Duyan Blog / demo illustration",
      categoryId: cats.travel!.id,
      authorId: auth["mai-linh"]!.id,
      reviewerId: auth.khoa!.id,
      featured: false,
      publishedAt: new Date("2026-03-08T09:00:00Z"),
      lastReviewedAt: new Date("2026-03-18T09:00:00Z"),
      readingMinutes: 8,
      blocks: JSON.stringify([
        P("Every eSIM provider promises the same thing — land, scan, connect. The differences show up in the details you can check against published documents: whether the coverage list actually includes your destination, whether hotspot/tethering is documented, and what a top-up costs when you're at 4% with a train to catch. This roundup compares three plans on the coverage maps, plan terms and pricing pages their makers publish."),
        NOTE("This roundup is demo content with fictional merchants and prices — it exists to show the format. The structure of the comparisons is the part worth studying.", "Sample content notice"),
        H2("The quick picks"),
        P("For a **two-week, multi-region trip**, [NomadLink Global 30](go:off_nomadlink_global30) is the one purchase that covers everywhere you're likely to go, per its coverage list. For an **Asia-heavy itinerary**, [TerraSIM Regional Asia](go:off_terrasim_asia) costs about half as much per GB, per the price list. For **light, occasional use**, [Waveline Flex](go:off_waveline_flex) never expires and never nags."),
        {
          type: "pick",
          rank: 1,
          name: "NomadLink Global 30",
          badge: "Best for multi-region trips",
          blurb: "15GB across 120+ countries per the published coverage list, with city coverage the plan terms describe as the most reliable in its class. The app's data meter is documented to match the stated allowance. Top-ups are merely okay, which keeps it from being perfect for heavy users.",
          imageUrl: "/images/nomadlink.png",
          offerId: "off_nomadlink_global30",
        },
        {
          type: "pick",
          rank: 2,
          name: "TerraSIM Regional Asia",
          badge: "Best value in Asia",
          blurb: "The per-GB price is roughly half of the global plans for Asia-only itineraries, per the price list, and the activation docs describe the simplest flow of the three. Rural coverage leans on slower partner networks per the coverage list.",
          imageUrl: "/images/terrasim.png",
          offerId: "off_terrasim_asia",
        },
        {
          type: "pick",
          rank: 3,
          name: "Waveline Flex",
          badge: "Best for light users",
          blurb: "Pay about $3 per GB with no expiry, in 28 countries per the plan terms. It's the plan we'd point parents and occasional travellers at — no expiring data, and the per-GB rate is flat. North America rates climb noticeably.",
          imageUrl: "/images/waveline.png",
          offerId: "off_waveline_flex",
        },
        H2("How the three compare"),
        {
          type: "table",
          caption: "Demo figures from the published coverage lists, plan terms and pricing pages (fictional)",
          head: ["", "NomadLink Global 30", "TerraSIM Asia", "Waveline Flex"],
          rows: [
            ["Price", "$32.50 / 15GB", "$17.00 / 10GB", "~$3.00 / GB"],
            ["Coverage", "120+ countries", "14 Asian markets", "28 countries"],
            ["Expiry", "30 days", "30 days", "Never"],
            ["Hotspot", "Yes", "Yes", "Yes"],
            ["Data meter", "Stated to match allowance", "Stated live", "Not specified"],
          ],
        },
        H2("What we check for"),
        P("Coverage list completeness, documented hotspot/tethering, meter honesty per the docs, and the true cost of a top-up. The full list lives in our [methodology](/methodology); the short version is that we compare what the providers actually publish, and we say what they don't."),
        WARN("Avoid buying a regional plan when your trip crosses regions. The per-GB savings evaporate the moment you need a second purchase — and support queues don't care that you're at the airport."),
        {
          type: "faq",
          items: [
            { q: "Are eSIMs as fast as a physical SIM?", a: "On the same underlying network, yes — an eSIM is just the profile. Speed differences you see are about which networks a provider contracts with." },
            { q: "Can I keep my number on WhatsApp?", a: "Yes. Keep your primary SIM active for SMS, install the eSIM for data, and set data roaming to the eSIM only." },
            { q: "How much data do I actually need?", a: "Two heavy weeks of maps, messages, music and some video: 10–15GB. If you tether for work, double it." },
          ],
        },
      ]),
    },
  });

  await db.articleTag.createMany({
    data: [
      { articleId: roundup.id, tagId: tags.esim.id },
    ],
  });

  await db.sourceCitation.createMany({
    data: [
      { articleId: roundup.id, label: "Duyan Blog eSIM testing methodology (internal)", url: "/methodology", checkedAt: new Date("2026-02-01"), order: 0 },
      { articleId: roundup.id, label: "NomadLink coverage list (demo)", url: "https://example-nomadlink.test/coverage", checkedAt: new Date("2026-02-01"), order: 1 },
      { articleId: roundup.id, label: "TerraSIM regional plan terms (demo)", url: "https://example-terrasim.test/asia/terms", checkedAt: new Date("2026-02-01"), order: 2 },
    ],
  });

  // ------------------------------------------------------------------ Versus
  const versus = await db.article.create({
    data: {
      slug: "cloudpeak-vs-harborstack",
      type: "versus",
      status: "published",
      isDemo: true, // all seeded fiction is demo content (Corrections 5-6)
      title: "Cloudpeak Hosting vs Harborstack: which budget host survives year two?",
      deck: "One has the faster panel and fatter intro specs; the other has honest renewal pricing and a backup plan that doesn't cost extra. Read against their own plan terms, the decision is about which kind of surprise you can live with.",
      tldr:
        "Choose Cloudpeak StartCloud for headroom and a slicker console — budget for the 70% renewal jump. Choose Harborstack Dock if pricing honesty and flat renewals matter more than burst capacity.",
      heroImage: "/images/cloudpeak-vs-harborstack.png",
      heroAlt: "Two geometric server towers under an amber spotlight",
      heroCredit: "Duyan Blog / demo illustration",
      categoryId: cats.tech!.id,
      authorId: auth.duyan!.id,
      reviewerId: auth.khoa!.id,
      publishedAt: new Date("2026-03-14T09:00:00Z"),
      readingMinutes: 10,
      blocks: JSON.stringify([
        P("Budget hosting is an industry built on the first invoice. The teaser price gets you in; the renewal price and the fine print decide whether you stay. **Cloudpeak StartCloud** and **Harborstack Dock** take opposite sides of that trade — one leads with resources, the other with pricing honesty — and on their published plan terms, the decision comes down to what kind of surprise you can live with."),
        WARN("Both merchants here are fictional demo companies. The comparison exists to show how Duyan Blog structures head-to-head reviews, including the sortable table and the criteria behind it."),
        H2("The spec table, sorted your way"),
        P("The table above is generated from the comparison database — sort it by any numeric criterion and the winner is marked per row. It updates when the editors update the data, never when a merchant asks nicely."),
        H2("Where Cloudpeak wins: headroom"),
        P("Double the vCPUs and RAM on the published specs. Cloudpeak's plan terms list 2 vCPU / 4 GB, 80 GB NVMe and a 99.95% uptime SLA; Harborstack lists 1 vCPU / 2 GB, 50 GB and 99.90%. That gap is the whole story if your site's job is to survive launch-day traffic — Cloudpeak is simply provisioned for more."),
        H2("Where Harborstack wins: the second year"),
        P("Cloudpeak's $9.99 intro renews at $16.99 — a 70% jump, in their own terms, that lands precisely when your site has become annoying to move. Harborstack is $6.50 on day one and $6.50 in year three, with daily backups as the only paid extra. On three-year ownership we priced $200 of Harborstack's favour with backups included."),
        {
          type: "prosCons",
          title: "Two verdicts, one table",
          pros: [
            "Cloudpeak: more capacity, fastest panel, free migration",
            "Harborstack: flat renewals, cheapest with backups included",
          ],
          cons: [
            "Cloudpeak: renewal jump rewrites the maths after year one",
            "Harborstack: 1 vCPU is tight for spiky or unoptimised sites",
          ],
        },
        H2("The verdict"),
        P("If you need the capacity **today**, Cloudpeak StartCloud is the better machine — go in with eyes open about year two. If your site is small, stable and you value providers who don't play pricing games, Harborstack Dock is the calmer relationship. Full criteria and weights: [methodology](/methodology)."),
        P("*Both hosts, both spec sheets, and every figure here are fictional demo data — the plan terms are invented to demonstrate the compare format.*"),
      ]),
    },
  });

  // Attach comparison engine data to the versus article
  await db.comparison.update({
    where: { id: comparison.id },
    data: { articleId: versus.id },
  });

  await db.articleTag.create({ data: { articleId: versus.id, tagId: tags.hosting.id } });

  await db.sourceCitation.createMany({
    data: [
      { articleId: versus.id, label: "Duyan Blog hosting load-test methodology (internal)", url: "/methodology", checkedAt: new Date("2026-02-01"), order: 0 },
      { articleId: versus.id, label: "Cloudpeak StartCloud plan terms (demo)", url: "https://example-cloudpeak.test/startcloud/terms", checkedAt: new Date("2026-02-01"), order: 1 },
      { articleId: versus.id, label: "Harborstack Dock plan terms (demo)", url: "https://example-harborstack.test/dock/terms", checkedAt: new Date("2026-02-01"), order: 2 },
    ],
  });

  // ------------------------------------------------------------------ Guide
  const guide = await db.article.create({
    data: {
      slug: "choose-a-vpn",
      type: "guide",
      status: "published",
      isDemo: true, // all seeded fiction is demo content (Corrections 5-6)
      title: "How to choose a VPN in 2026: a plain-English guide",
      deck: "Kill lists, audit reports and the questions that actually matter — how to pick a VPN without trusting an ad, a ranking table, or us.",
      tldr:
        "Decide what you need a VPN for, demand a recent third-party audit, and treat every 'best VPN' list (including ours) as a starting point, not an answer. Our worked example: Meridian VPN for the 2-year plan.",
      heroImage: "/images/vpn-guide.png",
      heroAlt: "Shield and key floating over a stylized tunnel portal",
      heroCredit: "Duyan Blog / demo illustration",
      categoryId: cats.software!.id,
      authorId: auth.duyan!.id,
      reviewerId: auth["mai-linh"]!.id,
      publishedAt: new Date("2026-02-25T09:00:00Z"),
      readingMinutes: 11,
      blocks: JSON.stringify([
        P("The VPN market runs on fear and rebate maths. This guide takes the opposite approach: five questions that narrow the field to one or two honest options, whichever brand you end up with. We use [Meridian VPN](go:off_meridian_2yr) as the worked example — not because it's magic, but because its paperwork shows you what to ask anyone else."),
        H2("1 · Start with why"),
        P("“Should I use a VPN” is not a question; “I want safer browsing on hotel Wi-Fi” is. Write your one sentence down — streaming a specific catalogue, protecting logins on public networks, hiding your IP from trackers — because every later step filters on it. A VPN does not make you anonymous and cannot fix a compromised device."),
        H2("2 · Read the audit, not the promises"),
        P("The single most reliable signal in this industry is a recent, published third-party audit of the no-logs claim. It is not a guarantee — audits sample systems, not futures — but it's the difference between a promise and a claim someone else has poked at. Meridian's yearly audit, for example, is dated, named, and includes the scope; hold any provider to that standard."),
        H2("3 · Do the two-year maths honestly"),
        P("VPN pricing is inverted: monthly is for flexibility, the 2-year plan is for commitment. Work out the total cost including the renewal rate after the discounted term. [Meridian's 2-year plan](go:off_meridian_2yr) works out to $3.30/month billed upfront — competitive, but only if you'd genuinely pay two years for this tool. If not, pay monthly for a quarter and see what you actually use."),
        H2("4 · Check the technical boxes that matter"),
        P("Whatever the marketing says, verify: a modern wireguard-based protocol, an app that connects in under ten seconds, a working kill switch, and DNS handling that doesn't leak. Free 30-minute trials or money-back windows exist precisely so you can test these on your own network, at your own hours."),
        TIP("Test the kill switch yourself: connect, start a ping to a stable host, then toggle your Wi-Fi off and on. If the ping survives uninterrupted, the kill switch is decorative."),
        H2("5 · Match the tool to the country list"),
        P("If your reason is location-specific — a streaming catalogue, a region-locked service — check that the provider has servers where you need them *and* that users report those servers actually working. Server counts are vanity metrics; presence in your target country with functioning IPs is the metric."),
        {
          type: "faq",
          items: [
            { q: "Are free VPNs ever okay?", a: "For occasional public Wi-Fi, a reputable free tier from a paid provider can be reasonable. 'Free unlimited' VPNs from unknown companies are the product — you are." },
            { q: "Does a VPN stop tracking?", a: "It hides your IP from the sites you visit. Trackers mostly follow you by cookies and fingerprinting, which a VPN does not touch." },
            { q: "What about speed loss?", a: "Modern wireguard-based VPNs typically cost you 5–15% on a good connection. If you lose half your speed, switch servers or protocols before blaming your line." },
          ],
        },
        P("*Meridian VPN is a fictional demo company used as a worked example; the advice is the part we mean.*"),
      ]),
    },
  });

  await db.articleTag.create({ data: { articleId: guide.id, tagId: tags.privacy.id } });

  await db.sourceCitation.createMany({
    data: [
      { articleId: guide.id, label: "Duyan Blog VPN evaluation criteria (internal)", url: "/methodology", checkedAt: new Date("2026-02-01"), order: 0 },
      { articleId: guide.id, label: "Meridian VPN audit summary (demo)", url: "https://example-meridian.test/audit", checkedAt: new Date("2026-02-01"), order: 1 },
    ],
  });

  // ------------------------------------------------------------------ Editorial
  await db.article.create({
    data: {
      slug: "why-we-publish-testing-notes",
      type: "editorial",
      status: "published",
      isDemo: true, // all seeded fiction is demo content (Corrections 5-6)
      title: "Why we publish our sources (and our mistakes)",
      deck: "A review you can't check is just confident writing. An editor's note on evidence, corrections and why the source list is the most honest part of this site.",
      heroImage: "/images/testing-notes.png",
      heroAlt: "Notebook, checklist card and magnifying glass",
      heroCredit: "Duyan Blog / demo illustration",
      categoryId: cats.software!.id,
      authorId: auth.duyan!.id,
      publishedAt: new Date("2026-01-28T09:00:00Z"),
      readingMinutes: 6,
      blocks: JSON.stringify([
        P("There is a version of this site where every review is certain, every product is “best”, and every score is a round number with no criteria behind it. That version would be cheaper to run, easier to write, and completely useless."),
        QUOTE("A review you cannot check is an advertisement wearing glasses.", "Duy An Tran, founding editor"),
        P("So we do the slower thing. Every review names its author and its checking editor. Every score maps to a published criterion with a weight you can recompute. And every figure that reaches the page carries the source it came from and the day a human checked it — because the difference between a claim and a fact is that a fact has a receipt."),
        H2("The honest answer to 'what about your own testing?'"),
        P("We have been deliberately clear about this from the start: Duyan Blog does not run its own benchmark lab. Where an independent group has measured something, we cite their published result by name. Where a vendor publishes a spec, we read it, record the date, and show the working. We would rather publish a well-sourced verdict than a confident-sounding number we cannot trace — and when a specific article genuinely includes first-hand work, it says so and describes exactly what was done."),
        H2("The mistake ledger"),
        P("Corrections are the least glamorous and most important page on any review site. Ours commits to public, dated notes when a verdict changes — not because we enjoy being wrong, but because a site that quietly edits scores is training you to distrust scores. The [corrections policy](/corrections-policy) is short; the habit it describes is hard."),
        H2("Why the hat?"),
        P("The nón lá on our masthead is a piece of engineering disguised as simplicity: palm leaves over a bamboo frame, every part doing visible work. That's the aesthetic standard here. A review should be like the hat — plain to look at, hard to argue with, and made of parts you can inspect."),
        P("If you spot a place where we've failed that standard, the [contact form](/contact) reaches a human. If you're right, you'll get a public correction and our thanks."),
      ]),
    },
  });

  // Methodology entry (category playbook)
  await db.methodologyEntry.create({
    data: {
      slug: "esim-testing-playbook",
      title: "eSIM & travel connectivity playbook",
      body:
        "How we review travel eSIMs, in the order a reader cares about.\n\n1. Read the provider's published coverage map and plan terms, and record the URL and the day we checked them. 2. Compare the per-GB price across regional and global plans from the vendor's own pricing pages. 3. Check what the documentation says about the data meter, hotspot/tethering and top-ups. 4. Look for an independent, dated review or benchmark of coverage and name its source. 5. Where a vendor publishes nothing on a point, we leave it empty — a missing row means we did not find it, not that the feature is absent.\n\nWe publish the source and the day we checked it for every figure, and we never present a vendor's unpublished claim as verified. Gaps are listed as gaps, not averaged away.\n\nThis playbook is demonstrated with fictional merchants in the demo content; the method itself is the part we run.",
    },
  });

  // Site settings (ads OFF by default — see AdSlot docs)
  await db.siteSetting.createMany({
    data: [
      { key: "ads_enabled", value: "false" },
      { key: "demo_mode", value: "true" },
    ],
  });

  // One sample redirect (legacy URL → new home)
  await db.redirect.create({
    data: { from: "/old-esim-guide", to: "/best/best-esim-providers", statusCode: 302, active: true },
  });

  const counts = {
    articles: await db.article.count(),
    offers: await db.affiliateOffer.count(),
    comparisons: await db.comparison.count(),
  };
  console.log(`Done: ${counts.articles} articles, ${counts.offers} offers, ${counts.comparisons} comparison(s).`);
  console.log("Admin accounts are NOT created here — use: npm run admin:bootstrap");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
