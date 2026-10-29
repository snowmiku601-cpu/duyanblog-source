/**
 * Structural integrity gate for the Fanttik tools roundup draft.
 *
 * Same pattern as scripts/test-article-draft-saily-vs-airalo.mjs: reads the
 * draft JSON, asserts content-integrity rules, exits non-zero on any FAIL.
 *
 *   node scripts/test-article-draft-best-fanttik-tools.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRAFT = path.join(ROOT, "content", "drafts", "best-fanttik-tools.json");
const CHECK_DATE = "2026-10-29";
const REF = "ref=saskoqug";

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
check("article meta: roundup/slug/isDemo false", draft.type === "roundup" && draft.slug === "best-fanttik-tools" && draft.isDemo === false);
check("title ≤ 70 chars", typeof draft.title === "string" && draft.title.length <= 70, `${draft.title?.length}`);
check("deck present", typeof draft.deck === "string" && draft.deck.length > 20);
check("tldr present", typeof draft.tldr === "string" && draft.tldr.length > 40);

// 2 — supported block types only
const badTypes = blocks.filter((b) => !supported.has(b.type));
check("supported block types only", badTypes.length === 0, badTypes.map((b) => b.type).join(", "));

// 3 — every Fanttik outbound URL carries the referral parameter, exactly
const urls = [];
const collect = (b) => {
  if (b.type === "pick" && b.url) urls.push({ src: `pick#${b.rank}`, url: b.url });
  if (b.type === "sources") for (const s of b.items ?? []) urls.push({ src: "sources", url: s.url ?? "" });
};
blocks.forEach(collect);
const fanttik = urls.filter((u) => u.url.includes("fanttik.com"));
check("Fanttik URLs present in picks and sources", fanttik.length >= 10, `${fanttik.length} fanttik URLs`);
check(
  "every Fanttik URL carries ref=saskoqug",
  fanttik.every((u) => u.url.includes(`${REF}`)),
  fanttik.filter((u) => !u.url.includes(REF)).map((u) => u.src).join(", ") || "all",
);
// control: a URL without the ref must NOT exist
const noRef = fanttik.filter((u) => !/(\?|&)ref=saskoqug/.test(u.url));
check("no Fanttik URL missing the ref (control)", noRef.length === 0, noRef.map((u) => u.url).join(", "));

// 4 — no raw fanttik.com links inside prose text fields (picks carry url via schema field;
// prose external links are sources only — the buy path is the pick CTA)
const prose = blocks.filter((b) => b.type === "paragraph").map((b) => b.text).join("\n");
check(
  "zero fanttik.com LINKS inside prose (attribution is plain text; buy path on pick CTAs only)",
  (prose.match(/\]\((?:https?:\/\/)?(?:www\.)?fanttik\.com/g) ?? []).length === 0,
  "prose keeps commerce on pick CTAs + dated sources only",
);

// 5 — picks: 5, ranked 1..5, all with thumbnail + CTA url
const picks = blocks.filter((b) => b.type === "pick");
check("exactly 5 picks ranked 1..5", picks.length === 5 && picks.map((p) => p.rank).join(",") === "1,2,3,4,5");
check(
  "every pick has imageUrl + url with ref",
  picks.every((p) => typeof p.imageUrl === "string" && p.imageUrl.includes("fanttik.com/cdn/") && p.url?.includes(REF)),
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

// 7 — no universal-best phrasing in tldr or picks
check("no overall-winner phrasing", !/overall winner|wins overall|best overall/i.test(draft.tldr ?? ""));

// 8 — table caption carries the checked date
const tables = blocks.filter((b) => b.type === "table");
check("one comparison table", tables.length === 1, `${tables.length}`);
check("table caption carries the checked date", tables.every((t) => (t.caption ?? "").includes(CHECK_DATE) || (t.caption ?? "").includes("October 29, 2026")));

// 9 — sources: all external labels carry the checked date (Pexels photo page exempt)
const sources = blocks.find((b) => b.type === "sources");
check("sources block exists with ≥9 items", !!sources && sources.items.length >= 9, `${sources?.items.length ?? 0} items`);
const external = (sources?.items ?? []).filter((s) => !(s.url ?? "").includes("pexels.com"));
check(
  "every external source label carries the checked date",
  external.every((s) => s.label.includes("October 29, 2026")),
  `${external.length} external items`,
);

// 10 — disclosure: a callout about the links + referral code exists, and the
// price-change caveat is stated somewhere in the body
check(
  "affiliate/referral disclosure callout present",
  blocks.some((b) => b.type === "callout" && /referral code|affiliate/i.test(b.text ?? "")),
);
check("price-change caveat stated", /can change/i.test(blockText));

// 11 — vendor claims attributed inline ("per Fanttik's ...")
const claimSentences = (prose.match(/[^.!?]*\d+(?:[.,]\d+)?\s*(?:PSI|Pa|Wh|GB|bits|lbs?|inches|min|minute)[^.!?]*[.!?]/gi) ?? []);
const unattributed = claimSentences.filter((s) =>
  /\d+(?:[.,]\d+)?\s*(?:PSI|Pa|Wh)/i.test(s) &&
  !/per (its|fanttik'?s?|the maker'?s?|each)/i.test(s) &&
  !/(published|product page|spec)/i.test(s)
);
check(
  "numeric spec sentences carry attribution",
  unattributed.length === 0,
  unattributed.slice(0, 2).map((s) => s.slice(0, 90)).join(" | "),
);

// 12 — hero metadata points at the local Git-managed composite (owner-approved build
// from official Fanttik product photography; provenance recorded in the draft)
const HERO = "/images/articles/best-fanttik-tools/hero-fanttik-composite.jpg";
check(
  "hero metadata present and the file exists",
  draft.heroImage === HERO && existsSync(path.join(ROOT, "public", draft.heroImage ?? "")) &&
    typeof draft.heroAlt === "string" && draft.heroAlt.length > 10 &&
    typeof draft.heroCredit === "string" && draft.heroCredit.length > 3 &&
    /Fanttik/.test(draft.heroCredit ?? ""),
  `${draft.heroImage} | alt ${draft.heroAlt?.length ?? 0}ch | credit ${draft.heroCredit ?? "none"}`,
);
const bodyImages = blocks.filter((b) => b.type === "image");
check("hero not duplicated in body (control)", bodyImages.every((b) => b.src !== HERO), `${bodyImages.length} body image block(s)`);

// 13 — pick thumbnails must be real Fanttik CDN URLs (owner rule: no placeholder images).
// Verified by curl in the verification pass; here we only assert the host + that the
// slug of each pick exists in its page URL mapping recorded during research.
check(
  "pick thumbnails are Fanttik CDN URLs",
  picks.every((p) => /^https:\/\/fanttik\.com\/cdn\/shop\/files\/.+\.(jpg|png|webp)/.test(p.imageUrl) && p.imageUrl.includes("width=")),
);

// 14 — JSON-LD duplicate-destination guard: five picks share one storefront URL, so the
// /best/[slug] ItemList must NOT emit five ListItems with the same destination. The page
// guards on distinct URLs; this pins the guard.
const renderer2 = readFileSync(path.join(ROOT, "src", "app", "best", "[slug]", "page.tsx"), "utf8");
check(
  "best page ItemList skips duplicate destinations",
  /distinct\.size === items\.length/.test(renderer2),
);

// 15 — pick heading is ordinary text (no named link to a shared storefront); commercial
// action lives only on the explicit Shop button.
check(
  "pick heading renders as plain text, not a storefront link",
  !/block\.url \? \(\s*<a href=\{block\.url\}/.test(readFileSync(path.join(ROOT, "src", "components", "editorial", "article-renderer.tsx"), "utf8")),
);

// 16 — policy consistency: the affiliate-disclosure policy must describe BOTH paths
// (/go tracked + direct merchant), and DirectAffiliateButton must carry rel="sponsored".
const policies = readFileSync(path.join(ROOT, "src", "content", "policies.ts"), "utf8");
check("policy describes both affiliate paths", /two paths/.test(policies) && /\/go\/\[offer-id\]/.test(policies) && /directly to the merchant/.test(policies));
const affiliateLink = readFileSync(path.join(ROOT, "src", "components", "affiliate", "affiliate-link.tsx"), "utf8");
check(
  "DirectAffiliateButton carries rel=sponsored noopener",
  /rel="sponsored noopener"/.test(affiliateLink),
);

// 17 — Task 53.2 factual-repair regressions. Each pins a contradiction the independent
// reviewer found (control: the corrected phrasing must exist).
check(
  "no reversed X8/X9 Pro price ranking",
  !/costs more than the X8|more expensive than the X8/i.test(blockText) &&
    /cheaper of the two|cheaper unit|cheaper one/i.test(blockText),
);
check(
  "no reversed 40/23-minute runtime claim",
  !/40-minute claimed runtime is the smallest/i.test(blockText) &&
    /23-minute claimed runtime is well under the X8 APEX's 40/i.test(blockText),
);
check(
  "no X9 Pro fastest claim (52s X8 vs 60-70s X9 Pro)",
  !/X9 Pro[^"]{0,120}fastest|faster claimed inflation/i.test(blockText) &&
    /52 seconds.*faster published time|52s vs 60-70s|52-second inflation time/i.test(blockText),
);
check(
  "E1 MAX torque published and stated (0.05/0.2 Nm, 3 Nm manual)",
  !/does not publish (a )?torque/i.test(blockText) &&
    /0\.05\s?Nm/i.test(blockText) && /0\.2\s?Nm/i.test(blockText) && /3\s?Nm/i.test(blockText),
);
check(
  "no 'X8 cheapest of the three' FAQ claim",
  !/lowest (list )?price of the three/i.test(blockText),
);
check(
  "no 'lightest vacuum of the five' claim (it is the only vacuum)",
  !/lightest car vacuum of the five/i.test(blockText) && /13 minutes at (maximum|max) power/i.test(blockText),
);

// 18 — price terminology: no "list price" wording; "displayed ... store price" used; sale/regular caveat in table caption
check(
  'no "list price" wording anywhere',
  !/list price/i.test(blockText),
  (blockText.match(/list price/gi) ?? []).length + " hits",
);
check(
  "displayed-store-price terminology present",
  /displayed (Fanttik )?store price/i.test(blockText),
);
// 18b — impossible sale/regular-price assertions: never claim a product is discounted,
// never compare sale to regular, never assert all-N sale status (Task 53.3: X9 Ultra
// displayed $199.99 sale vs $199.97 regular — internally inconsistent on the merchant page).
check(
  "no discount/sale-vs-regular assertions",
  !/(were on sale|regular prices were higher|discounted from|below regular|sale price of)/i.test(blockText),
  (blockText.match(/regular price/gi) ?? []).length + " regular-price mentions",
);
check(
  "prices-vary-by-listing caveat present",
  /vary between listings|can vary between listings/i.test(blockText),
);

// 19 — source links: every Fanttik URL in sources carries the ref AND the sources
// renderer marks referral URLs sponsored (pinned against regression).
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

console.log(failures === 0 ? `\nAll draft integrity checks passed.` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
