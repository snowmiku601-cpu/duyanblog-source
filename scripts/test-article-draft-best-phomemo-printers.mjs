/**
 * Structural integrity gate for the Phomemo printers roundup draft.
 *
 * Same pattern as scripts/test-article-draft-best-ottocast-carplay-upgrades.mjs:
 * reads the draft JSON, asserts content-integrity rules, exits non-zero on any FAIL.
 *
 *   node scripts/test-article-draft-best-phomemo-printers.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRAFT = path.join(ROOT, "content", "drafts", "best-phomemo-printers.json");
const CHECK_DATE = "2026-10-29";
const REF = "ref=yrqzcctj";

if (!existsSync(DRAFT)) {
  console.log(`FAIL draft file missing — ${path.relative(ROOT, DRAFT)}`);
  process.exit(1);
}

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
};

const draft = JSON.parse(readFileSync(DRAFT, "utf8"));
const blocks = draft.blocks ?? [];
const blockText = JSON.stringify(blocks);
const supported = new Set([
  "paragraph", "heading", "list", "quote", "callout", "prosCons", "stats",
  "table", "image", "pick", "comparisonEmbed", "offerEmbed", "faq", "sources", "divider",
]);

// 1 — article meta shape
check("article meta: roundup/slug/isDemo false", draft.type === "roundup" && draft.slug === "best-phomemo-printers" && draft.isDemo === false);
check("title ≤ 70 chars", typeof draft.title === "string" && draft.title.length <= 70, `${draft.title?.length}`);
check("deck present", typeof draft.deck === "string" && draft.deck.length > 20);
check("tldr present", typeof draft.tldr === "string" && draft.tldr.length > 40);

// 2 — supported block types only
const badTypes = blocks.filter((b) => !supported.has(b.type));
check("supported block types only", badTypes.length === 0, badTypes.map((b) => b.type).join(", "));

// 3 — every Phomemo outbound URL carries the referral parameter, exactly (case-sensitive, lowercase)
const urls = [];
const collect = (b) => {
  if (b.type === "pick" && b.url) urls.push({ src: `pick#${b.rank}`, url: b.url });
  if (b.type === "sources") for (const s of b.items ?? []) urls.push({ src: "sources", url: s.url ?? "" });
};
blocks.forEach(collect);
const phomemo = urls.filter((u) => u.url.includes("phomemo.com"));
check("Phomemo URLs present in picks and sources", phomemo.length >= 10, `${phomemo.length} phomemo URLs`);
check(
  "every Phomemo URL carries ref=yrqzcctj (exact case)",
  phomemo.every((u) => u.url.includes(REF)),
  phomemo.filter((u) => !u.url.includes(REF)).map((u) => u.src).join(", ") || "all",
);
const wrongRef = phomemo.filter((u) => /ref=(?!yrqzcctj)/.test(u.url) || !/(\?|&)ref=yrqzcctj/.test(u.url));
check("no Phomemo URL with wrong-case or missing ref (control)", wrongRef.length === 0, wrongRef.map((u) => u.url).join(", "));

// 4 — no raw phomemo.com links inside prose (buy path is the pick CTA only)
const prose = blocks.filter((b) => b.type === "paragraph").map((b) => b.text).join("\n");
check(
  "zero phomemo.com LINKS inside prose",
  (prose.match(/\]\((?:https?:\/\/)?(?:www\.)?phomemo\.com/g) ?? []).length === 0,
);

// 5 — picks: 5, ranked 1..5, all with thumbnail + CTA url, five DISTINCT purposes
const picks = blocks.filter((b) => b.type === "pick");
check("exactly 5 picks ranked 1..5", picks.length === 5 && picks.map((p) => p.rank).join(",") === "1,2,3,4,5");
check(
  "every pick has imageUrl + url with ref",
  picks.every((p) => typeof p.imageUrl === "string" && p.imageUrl.includes("phomemo.com/cdn/") && p.url?.includes(REF)),
  picks.map((p) => `${p.rank}:${p.imageUrl ? "img" : "NOIMG"}/${p.url ? "url" : "NOURL"}`).join(" "),
);
const badges = picks.map((p) => p.badge);
check("five distinct purposes (badges differ)", new Set(badges).size === 5, badges.join(" | "));

// 6 — media specificity: each pick names its media/widths (model-specific paper claims)
check(
  "D30 names 6-15mm widths + phone-only",
  /6, 12, 14 or 15mm/.test(blockText) && /D30[^"]{0,600}PC support ✗|PC support ✗[^"]{0,600}D30/.test(blockText),
);
check(
  "M110 names 20-50mm widths + USB",
  /20–50mm/.test(blockText) && /M110[^"]{0,800}USB to a computer|USB to a computer[^"]{0,800}M110/.test(blockText),
);
check(
  "PM241-BT names 1-4.6 inch spec width + 4x6 + platforms",
  /1\\"–4\.6\\"|25\.4–117mm/.test(blockText) && /4×6/.test(blockText) && /Amazon, eBay, Shopify/.test(blockText),
);
check(
  "T02 names 53mm + phone-only",
  /53mm/.test(blockText) && /T02[^"]{0,900}PC support ✗/.test(blockText),
);
check(
  "M08F: thermal sheets NOT copy paper, stated",
  /M08F[^"]{0,900}thermal sheets|Letter\/A4 Thermal Printer Paper/.test(blockText) &&
    /not.*ordinary copy paper|does not print on ordinary copy paper/i.test(blockText),
);
check(
  "no cross-model paper universality claim",
  !/all Phomemo (printers|devices) use the same (?!app and paper)/i.test(blockText) &&
    /paper is equally model-specific|do not interchange/.test(blockText),
);
check(
  "app differences stated (phone-only vs PC-capable, official app names)",
  /phone-only|phone app only|PC support ✗/.test(blockText) && /Print Master/.test(blockText) && !/Pinter Master/.test(blockText),
);

// 7 — no fake first-hand language
const firstHand = [/we tested/i, /in our tests/i, /we experienced/i, /our benchmark/i, /we bought/i, /we measured/i];
const fhHits = firstHand.filter((r) => r.test(blockText));
check("no first-hand testing language", fhHits.length === 0, fhHits.map(String).join(", "));
check(
  "bounded methodology wording present",
  /did not test/i.test(blockText) && /documented research/i.test(blockText),
);

// 8 — no universal-best phrasing in tldr
check("no overall-winner phrasing", !/overall winner|wins overall|best overall/i.test(draft.tldr ?? ""));

// 9 — table: one, dated caption, media columns present
const tables = blocks.filter((b) => b.type === "table");
check("one comparison table", tables.length === 1, `${tables.length}`);
check(
  "table head carries media + connectivity + price columns (≤5 cols for mobile)",
  tables.every((t) => {
    const head = (t.head ?? []).join(" ");
    return /Media it takes/.test(head) && /Connectivity/.test(head) && /price/i.test(head) && t.head.length <= 5;
  }),
);
check("table caption carries the checked date", tables.every((t) => (t.caption ?? "").includes(CHECK_DATE) || (t.caption ?? "").includes("October 29, 2026")));

// 10 — sources: all external labels carry the checked date
const sources = blocks.find((b) => b.type === "sources");
check("sources block exists with ≥9 items", !!sources && sources.items.length >= 9, `${sources?.items.length ?? 0} items`);
const external = (sources?.items ?? []).filter((s) => !(s.url ?? "").includes("pexels.com"));
check(
  "every external source label carries the checked date",
  external.every((s) => s.label.includes("October 29, 2026")),
  `${external.length} external items`,
);

// 11 — disclosure callout + price-change caveat
check(
  "affiliate/referral disclosure callout present",
  blocks.some((b) => b.type === "callout" && /referral code|affiliate/i.test(b.text ?? "")),
);
check("price-change caveat stated", /can change/i.test(blockText));

// 12 — vendor claims attributed inline
const claimSentences = (prose.match(/[^.!?]*\d+(?:[.,]\d+)?\s*(?:mm\/s|mAh|DPI|hours?|labels?|pages?|meters?|rolls?|grams?|g\b)[^.!?]*[.!?]/gi) ?? []);
const unattributed = claimSentences.filter((s) =>
  /\d+(?:[.,]\d+)?\s*(?:mm\/s|mAh|labels per|pages of|meters of)/i.test(s) &&
  !/per (its|phomemo'?s?|the maker'?s?|each)/i.test(s) &&
  !/(published|product page|spec|policy|phomemo|claimed|the page)/i.test(s)
);
check(
  "numeric spec sentences carry attribution",
  unattributed.length === 0,
  unattributed.slice(0, 2).map((s) => s.slice(0, 90)).join(" | "),
);

// 13 — hero metadata points at the local Git-managed composite (owner-approved for Phomemo 2026-10-29)
const HERO = "/images/articles/best-phomemo-printers/hero-phomemo-composite.jpg";
check(
  "hero metadata present and the file exists",
  draft.heroImage === HERO && existsSync(path.join(ROOT, "public", draft.heroImage ?? "")) &&
    typeof draft.heroAlt === "string" && draft.heroAlt.length > 10 &&
    typeof draft.heroCredit === "string" && draft.heroCredit.length > 3 &&
    /Phomemo/.test(draft.heroCredit ?? ""),
  `${draft.heroImage} | alt ${draft.heroAlt?.length ?? 0}ch | credit ${draft.heroCredit ?? "none"}`,
);
const bodyImages = blocks.filter((b) => b.type === "image");
check("hero not duplicated in body (control)", bodyImages.every((b) => b.src !== HERO), `${bodyImages.length} body image block(s)`);

// 14 — pick thumbnails are real Phomemo CDN URLs
check(
  "pick thumbnails are Phomemo CDN URLs",
  picks.every((p) => /^https:\/\/phomemo\.com\/cdn\/shop\/files\/.+\.(jpg|png|webp)/.test(p.imageUrl) && p.imageUrl.includes("width=")),
);

// 15 — thermal-fading honesty: paper-dependent longevity stated, no "permanent" claims
check(
  "thermal fading trade-off stated with paper-dependent longevity",
  /fade/.test(blockText) && /2-year, 10-year and 20-year/.test(blockText),
);
check(
  "no permanent-print or ink-savings invention (negated statements allowed)",
  !/(?<!guaranteed )(?<!states a guaranteed )(?<!no guaranteed )permanent print life(?! is|,)/.test(blockText) &&
    !/(?<!not )never fades/.test(blockText) &&
    !/lasts forever/i.test(blockText),
);

// 16 — no invented ratings/battery/speed numbers beyond published ones: every battery/speed claim attributed
check(
  "no invented battery runtime phrasing (all claimed/attributed)",
  !/battery lasts \d+ hours? on (our|real)/i.test(blockText),
);

// 17 — price terminology
check(
  'no "list price" wording anywhere',
  !/list price/i.test(blockText),
  (blockText.match(/list price/gi) ?? []).length + " hits",
);
check(
  "displayed-store-price terminology present",
  /displayed (Phomemo )?store price/i.test(blockText),
);
check(
  "no discount/sale-vs-regular assertions",
  !/(were on sale|regular prices were higher|discounted from|below regular|sale price of)/i.test(blockText),
  (blockText.match(/regular price/gi) ?? []).length + " regular-price mentions",
);
check(
  "prices-vary-by-listing caveat present",
  /vary between listings|can vary between listings/i.test(blockText),
);
check(
  "variant pricing context present (D30/T02/PM241/M08F)",
  /printer-only|with test roll|US plug|A4 or Letter version/.test(blockText),
);

// 18 — source links: referral URLs marked sponsored by the renderers (pinned against regression)
check(
  "sources renderer marks referral URLs sponsored",
  /isReferralUrl\(s\.url\) \? "sponsored noopener" : "noopener nofollow"/.test(
    readFileSync(path.join(ROOT, "src", "components", "editorial", "article-renderer.tsx"), "utf8"),
  ),
);
check(
  "inline-text renderer marks referral URLs sponsored",
  /isReferralUrl\(href\)/.test(readFileSync(path.join(ROOT, "src", "components", "editorial", "inline-text.tsx"), "utf8")),
);

// 19 — JSON-LD duplicate-destination guard pinned (all five picks share one storefront URL)
const renderer2 = readFileSync(path.join(ROOT, "src", "app", "best", "[slug]", "page.tsx"), "utf8");
check(
  "best page ItemList skips duplicate destinations",
  /distinct\.size === items\.length/.test(renderer2),
);

// 20 — remotePatterns carries a narrow phomemo.com /cdn/shop/files entry
const nextConfig = readFileSync(path.join(ROOT, "next.config.ts"), "utf8");
check(
  "next.config remotePatterns has narrow phomemo.com /cdn/shop/files entry",
  /hostname:\s*"phomemo\.com"/.test(nextConfig) && /\/cdn\/shop\/files\/\*\*/.test(nextConfig),
);

// 21 — no fabricated Product/Review/aggregateRating JSON-LD in the best page
check(
  "no Product/Review schema emitted by the best page",
  !/aggregateRating/.test(renderer2),
);

// 22 — Task 58.1 audit regressions: official app names + driver routes.
check(
  "M110/D30 app is Print Master (official App Store name), never 'Pinter Master'",
  /Print Master/.test(blockText) && !/Pinter Master/.test(blockText),
);
check(
  "PM241-BT desktop path names the Labelife driver",
  /Labelife/.test(blockText),
);
check(
  "M08F Bluetooth-to-laptops framed as the maker's claim; USB as the desktop path",
  /page advertises Bluetooth/.test(blockText) && /USB route is the one to count on/.test(blockText),
);
check(
  "thermal fading physics caveat present (heat/sunlight/humidity, not Phomemo-attributed)",
  /direct sunlight|humidity/.test(blockText) && /not a Phomemo-specific claim/.test(blockText),
);
check(
  "no guaranteed longevity numbers (paper ratings only, dated catalog evidence)",
  !/guaranteed .{0,20}(?:2|10|20)-year|prints last (?:2|10|20) years/i.test(blockText),
);

// 23 — Task 58.2 regressions: ledger freshness, shipping figures, affiliate FAQ.
const ledger = readFileSync(path.join(ROOT, "content", "drafts", "phomemo-claim-ledger.md"), "utf8");
check(
  "ledger uses Print Master, never Pinter Master",
  /Print Master/.test(ledger) && !/Pinter Master/.test(ledger),
);
check(
  "ledger records owner-reported image authorization matching shipped assets",
  /OWNER-REPORTED AUTHORIZATION/.test(ledger) && /hero-v3/.test(ledger),
);
check(
  "ledger marks the main-store shipping policy and the 3-15 figure as re-fetched",
  /re-fetched 2026-10-29/.test(ledger) && /3–15 business days/.test(ledger) && /eu\.phomemo\.com/.test(ledger),
);
check(
  "affiliate FAQ makes no unconditional price guarantee",
  !/referral code does not change the store's listed price/i.test(blockText) &&
    /Phomemo sets the prices shown at checkout/.test(blockText) &&
    /we do not control them/.test(blockText),
);
check(
  "heroAlt names only the devices present in hero-v3 (D30, M110, PM241-BT, T02 — no M08F)",
  /D30, M110, PM241-BT and T02/.test(draft.heroAlt ?? "") && !/M08F/.test(draft.heroAlt ?? ""),
);

console.log(failures === 0 ? `\nAll draft integrity checks passed.` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
