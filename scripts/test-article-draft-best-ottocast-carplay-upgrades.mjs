/**
 * Structural integrity gate for the Ottocast CarPlay upgrades roundup draft.
 *
 * Same pattern as scripts/test-article-draft-best-fanttik-tools.mjs: reads the
 * draft JSON, asserts content-integrity rules, exits non-zero on any FAIL.
 *
 *   node scripts/test-article-draft-best-ottocast-carplay-upgrades.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRAFT = path.join(ROOT, "content", "drafts", "best-ottocast-carplay-upgrades.json");
const CHECK_DATE = "2026-10-29";
const REF = "ref=LAZYCORMORANT";

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
check("article meta: roundup/slug/isDemo false", draft.type === "roundup" && draft.slug === "best-ottocast-carplay-upgrades" && draft.isDemo === false);
check("title ≤ 70 chars", typeof draft.title === "string" && draft.title.length <= 70, `${draft.title?.length}`);
check("deck present", typeof draft.deck === "string" && draft.deck.length > 20);
check("tldr present", typeof draft.tldr === "string" && draft.tldr.length > 40);

// 2 — supported block types only
const badTypes = blocks.filter((b) => !supported.has(b.type));
check("supported block types only", badTypes.length === 0, badTypes.map((b) => b.type).join(", "));

// 3 — every Ottocast outbound URL carries the referral parameter, exactly (case-sensitive)
const urls = [];
const collect = (b) => {
  if (b.type === "pick" && b.url) urls.push({ src: `pick#${b.rank}`, url: b.url });
  if (b.type === "sources") for (const s of b.items ?? []) urls.push({ src: "sources", url: s.url ?? "" });
};
blocks.forEach(collect);
const otto = urls.filter((u) => u.url.includes("ottocast.com"));
check("Ottocast URLs present in picks and sources", otto.length >= 10, `${otto.length} ottocast URLs`);
check(
  "every Ottocast URL carries ref=LAZYCORMORANT (exact case)",
  otto.every((u) => u.url.includes(REF)),
  otto.filter((u) => !u.url.includes(REF)).map((u) => u.src).join(", ") || "all",
);
// control: a URL with wrong-case or missing ref must NOT exist
const wrongRef = otto.filter((u) => /ref=(?!LAZYCORMORANT)/.test(u.url) || !/(\?|&)ref=LAZYCORMORANT/.test(u.url));
check("no Ottocast URL with wrong-case or missing ref (control)", wrongRef.length === 0, wrongRef.map((u) => u.url).join(", "));

// 4 — no raw ottocast.com links inside prose text fields (buy path is the pick CTA only)
const prose = blocks.filter((b) => b.type === "paragraph").map((b) => b.text).join("\n");
check(
  "zero ottocast.com LINKS inside prose",
  (prose.match(/\]\((?:https?:\/\/)?(?:www\.)?ottocast\.com/g) ?? []).length === 0,
);

// 5 — picks: 5, ranked 1..5, all with thumbnail + CTA url
const picks = blocks.filter((b) => b.type === "pick");
check("exactly 5 picks ranked 1..5", picks.length === 5 && picks.map((p) => p.rank).join(",") === "1,2,3,4,5");
check(
  "every pick has imageUrl + url with ref",
  picks.every((p) => typeof p.imageUrl === "string" && p.imageUrl.includes("ottocast.com/cdn/") && p.url?.includes(REF)),
  picks.map((p) => `${p.rank}:${p.imageUrl ? "img" : "NOIMG"}/${p.url ? "url" : "NOURL"}`).join(" "),
);

// 6 — no fake first-hand language
const firstHand = [/we tested/i, /in our tests/i, /we experienced/i, /our benchmark/i, /we bought/i, /we measured/i];
const fhHits = firstHand.filter((r) => r.test(blockText));
check("no first-hand testing language", fhHits.length === 0, fhHits.map(String).join(", "));
check(
  "bounded methodology wording present",
  /did not test/i.test(blockText) && /documented research/i.test(blockText),
);

// 7 — no universal-best phrasing in tldr
check("no overall-winner phrasing", !/overall winner|wins overall|best overall/i.test(draft.tldr ?? ""));

// 8 — table: one, with required-infotainment column and dated caption
const tables = blocks.filter((b) => b.type === "table");
check("one comparison table", tables.length === 1, `${tables.length}`);
check(
  "table head names the required factory infotainment column",
  tables.every((t) => (t.head ?? []).some((h) => /required factory infotainment/i.test(h))),
);
check("table caption carries the checked date", tables.every((t) => (t.caption ?? "").includes(CHECK_DATE) || (t.caption ?? "").includes("October 29, 2026")));

// 9 — sources: all external labels carry the checked date
const sources = blocks.find((b) => b.type === "sources");
check("sources block exists with ≥8 items", !!sources && sources.items.length >= 8, `${sources?.items.length ?? 0} items`);
const external = (sources?.items ?? []).filter((s) => !(s.url ?? "").includes("pexels.com"));
check(
  "every external source label carries the checked date",
  external.every((s) => s.label.includes("October 29, 2026")),
  `${external.length} external items`,
);

// 10 — disclosure: a callout about the links + referral code exists, price-change caveat stated
check(
  "affiliate/referral disclosure callout present",
  blocks.some((b) => b.type === "callout" && /referral code|affiliate/i.test(b.text ?? "")),
);
check("price-change caveat stated", /can change/i.test(blockText));

// 11 — vendor claims attributed inline ("per Ottocast's ..." / "Ottocast publishes ...")
const claimSentences = (prose.match(/[^.!?]*\d+(?:[.,]\d+)?\s*(?:GB|RAM|PSI|Pa|mAh|mm|apps?|months?|days?|queries)[^.!?]*[.!?]/gi) ?? []);
const unattributed = claimSentences.filter((s) =>
  /\d+(?:[.,]\d+)?\s*(?:GB|months?|queries|business days)/i.test(s) &&
  !/per (its|ottocast'?s?|the maker'?s?|each)/i.test(s) &&
  !/(published|product page|spec|policy|ottocast)/i.test(s)
);
check(
  "numeric spec sentences carry attribution",
  unattributed.length === 0,
  unattributed.slice(0, 2).map((s) => s.slice(0, 90)).join(" | "),
);

// 12 — hero metadata points at the local Git-managed composite
const HERO = "/images/articles/best-ottocast-carplay-upgrades/hero-ottocast-composite.jpg";
check(
  "hero metadata present and the file exists",
  draft.heroImage === HERO && existsSync(path.join(ROOT, "public", draft.heroImage ?? "")) &&
    typeof draft.heroAlt === "string" && draft.heroAlt.length > 10 &&
    typeof draft.heroCredit === "string" && draft.heroCredit.length > 3 &&
    /Ottocast/.test(draft.heroCredit ?? ""),
  `${draft.heroImage} | alt ${draft.heroAlt?.length ?? 0}ch | credit ${draft.heroCredit ?? "none"}`,
);
const bodyImages = blocks.filter((b) => b.type === "image");
check("hero not duplicated in body (control)", bodyImages.every((b) => b.src !== HERO), `${bodyImages.length} body image block(s)`);

// 13 — pick thumbnails are real Ottocast CDN URLs (owner rule: no placeholder images)
check(
  "pick thumbnails are Ottocast CDN URLs",
  picks.every((p) => /^https:\/\/www\.ottocast\.com\/cdn\/shop\/files\/.+\.(jpg|png|webp)/.test(p.imageUrl) && p.imageUrl.includes("width=")),
);

// 14 — Task 56 compatibility-first rules: Play2Video Ultra's wired-Apple-CarPlay-only
// requirement and the Android Auto-only exclusion must be stated, never softened.
check(
  "Play2Video Ultra wired Apple CarPlay requirement stated",
  /Requires Factory Wired Apple CarPlay/i.test(blockText) || /requires? .{0,40}wired Apple CarPlay/i.test(blockText),
);
check(
  "Android Auto-only exclusion for Play2Video Ultra stated",
  /Android Auto-only vehicles are not supported|does not support Android Auto-only/i.test(blockText),
);
check(
  "no every-vehicle compatibility claim",
  !/works with (any|every) (car|vehicle)|compatible with (any|every) (car|vehicle)/i.test(blockText),
);
check(
  "i3 factory wireless CarPlay positioning stated",
  /factory wireless/i.test(blockText) && /iDrive/i.test(blockText),
);
check(
  "Ottoscreen AI positioned for no-CarPlay cars (not confused with adapters)",
  /no (factory )?(CarPlay or Android Auto|factory CarPlay)/i.test(blockText) || /no CarPlay at all/i.test(blockText),
);
// Play2Video Ultra video framing must stay safety-conscious
check(
  "video playback framed as passenger/parked feature",
  /passenger and parked-car feature|illegal|restricted/i.test(blockText),
);
// "any app" must stay the maker's claim, never ours
check(
  "'any app' wording is attributed to Ottocast, not asserted",
  !/(you can|lets you|allows you to) download any app/i.test(blockText) && /any app you like/i.test(blockText),
);

// 15 — price terminology: no "list price"; "displayed ... store price" used; prices-vary caveat
check(
  'no "list price" wording anywhere',
  !/list price/i.test(blockText),
  (blockText.match(/list price/gi) ?? []).length + " hits",
);
check(
  "displayed-store-price terminology present",
  /displayed (Ottocast )?store price/i.test(blockText),
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

// 19 — Task 56.1 audit regressions. Each pins a fact the independent audit verified.
check(
  "P3 Pro AI Voice costs: allowance, paid plans, service pack, per-query billing",
  /3 months or 1,000 conversation rounds/.test(blockText) &&
    /\$7\.90 per 1,000 queries/.test(blockText) &&
    /AI Voice Service Pack sold separately/.test(blockText) &&
    /billed per query/.test(blockText),
);
check(
  "no 'AI Voice is free' claim",
  !/AI voice is free|voice assistant is free|permanently free/i.test(blockText),
);
check(
  "i3 variant confirmation + page-typo caveat present",
  /variants are configured separately at checkout/.test(blockText) &&
    /apparent typos/.test(blockText),
);
check(
  "no X1-X7 range or flat 2018-2024 model claim",
  !/X1–X7|X1-X7|from 2018–2024|from 2018-2024/.test(blockText),
);
check(
  "Ottoscreen standalone: no factory CarPlay requirement imposed",
  !/Ottoscreen[^"]{0,200}requires? factory/i.test(blockText) &&
    /works independently|work independently|no factory CarPlay or Android Auto/i.test(blockText),
);
check(
  "video safety framing on P3 Pro and Ottoscreen picks too",
  /video belongs to passengers and parked cars/i.test(blockText) &&
    /Video on its screen is a passenger and parked-car feature/i.test(blockText),
);

// 21 — Task 57 micro-fix regressions: no broad compatibility claims.
check(
  "no broad 'across its product pages' exclusion claims (Task 57-A)",
  !/exclusions Ottocast publishes across its product pages/i.test(blockText) &&
    !/every product page carries a brand\/model\/year lookup/i.test(blockText) &&
    /on its wired-adapter and AI Box pages/.test(blockText),
);
check(
  "no unqualified 'still apply' compatibility rule in FAQ (Task 57-B)",
  !/exclusions still apply/i.test(blockText) &&
    /each apply to the specific product you select/.test(blockText),
);

// 20 — Task 56.2 audit regressions (i3 memory attribution, price-ranking brittleness, exclusion scope).
check(
  "i3 8GB/128GB attributed to Ottocast's FAQ, not asserted universally",
  /FAQ states the i3 comes standard with 8GB RAM and 128GB storage across all regions/.test(blockText) &&
    /confirm the configuration listed for yours/.test(blockText),
);
check(
  "no brittle absolute P3-Pro-vs-i3 price ranking",
  !/\$10 under the i3/i.test(blockText),
);
check(
  "Sony/Mitsubishi exclusions scoped to wired-adapter/AI-Box pages, not Ottoscreen",
  /wired-adapter and AI Box pages/.test(blockText) &&
    !/excluded across Ottocast's pages/i.test(blockText),
);
check(
  "Ottoscreen carries no wired-system exclusions (checklist carve-out)",
  /carries none of the wired-system exclusions/.test(blockText) ||
    /its page carries none of the wired-system exclusions/.test(blockText),
);

// 16 — source links: referral URLs marked sponsored by the renderers (pinned against regression)
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

// 17 — JSON-LD duplicate-destination guard pinned (all five picks share one storefront URL)
const renderer2 = readFileSync(path.join(ROOT, "src", "app", "best", "[slug]", "page.tsx"), "utf8");
check(
  "best page ItemList skips duplicate destinations",
  /distinct\.size === items\.length/.test(renderer2),
);

// 18 — remotePatterns carries an ottocast.com entry, narrowly scoped to the product-file CDN path
const nextConfig = readFileSync(path.join(ROOT, "next.config.ts"), "utf8");
check(
  "next.config remotePatterns has narrow ottocast.com /cdn/shop/files entry",
  /hostname:\s*"www\.ottocast\.com"/.test(nextConfig) && /\/cdn\/shop\/files\/\*\*/.test(nextConfig),
);

console.log(failures === 0 ? `\nAll draft integrity checks passed.` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
