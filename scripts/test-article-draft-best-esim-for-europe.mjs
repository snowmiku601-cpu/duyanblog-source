/**
 * Structural integrity gate for the "Best eSIM for Europe" roundup draft.
 * Same pattern as the other draft gates: reads draft JSON, asserts
 * content-integrity rules, exits non-zero on any FAIL.
 *
 *   node scripts/test-article-draft-best-esim-for-europe.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRAFT = path.join(ROOT, "content", "drafts", "best-esim-for-europe.json");
const CHECK_DATE = /2026-\d{2}-\d{2}/;

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
const allText = [blockText, draft.tldr ?? "", draft.deck ?? "", draft.title ?? ""].join("\n");
const supported = new Set([
  "paragraph", "heading", "list", "quote", "callout", "prosCons", "stats",
  "table", "image", "pick", "comparisonEmbed", "offerEmbed", "faq", "sources", "divider",
]);

// 1 — META
check("meta: roundup / slug / isDemo false",
  draft.type === "roundup" && draft.slug === "best-esim-for-europe" && draft.isDemo === false);
check("category travel", draft.categoryId === "travel");
check("author duyan / Duy An Tran", draft.authorSlug === "duyan" && draft.authorByline === "Duy An Tran");
check("title ≤ 70 chars", typeof draft.title === "string" && draft.title.length <= 70, `${draft.title?.length}`);
check("deck present", typeof draft.deck === "string" && draft.deck.length > 20);
check("tldr present", typeof draft.tldr === "string" && draft.tldr.length > 40);
const badTypes = blocks.filter((b) => !supported.has(b.type));
check("supported block types only", badTypes.length === 0, badTypes.map((b) => b.type).join(", "));

// 2 — ROUNDUP / PICK SEMANTICS
const picks = blocks.filter((b) => b.type === "pick");
check("pick blocks exist", picks.length >= 3, `${picks.length} picks`);
const ranks = picks.map((p) => p.rank);
check("ranks consecutive unique", ranks.length === new Set(ranks).size && ranks.every((r) => r >= 1 && r <= picks.length), JSON.stringify(ranks));
check("no pick offerId", picks.every((p) => !p.offerId));
check("no pick commodity url (buy/af)", picks.every((p) => !(p.url ?? "").match(/go:|shop|buy|\/af\/|amazon|referral/i)), picks.filter((p) => (p.url ?? "").match(/go:|buy|af|amazon|referral/i)).map((p) => p.url).join(", "));
const shortlist = ["airalo", "saily", "nomad", "holafly", "ubigi"];
const str = (s) => s.toLowerCase();
const coveredPicks = picks.map((p) => str(p.name));
check("shortlist providers represented among picks", shortlist.filter((s2) => coveredPicks.some((n) => n.includes(s2))).length >= 4,
  `picks: ${coveredPicks.join(" | ")}`);
check("each pick states a trade-off / limitation",
  picks.every((p) => /(trade-?off|cost|limit|downside|caveat|but |however|throttl|not |varies|depends|unlike)/i.test(p.blurb)),
  picks.filter((p) => !/(trade-?off|cost|limit|downside|caveat|but |however|throttl|not |varies|depends|unlike)/i.test(p.blurb)).map((p) => p.name).join(", "));

// 3 — COMMERCE ZERO
check("no go: links", !blockText.includes("go:"), `${(blockText.match(/go:/g) ?? []).length} hits`);
check("no offerEmbed/comparisonEmbed/offerId", !blocks.some((b) => ["offerEmbed", "comparisonEmbed"].includes(b.type)) && !blockText.includes("offerId"));
check("no buy CTA language", !/(buy now|shop now|view deal|purchase here|go to checkout|order now\b)/i.test(allText));

// 4 — EVIDENCE
check("methodology/checked-date present", /checked|check date|2026-\d{2}-\d{2}/i.test(blockText) &&
  /documented|derived|editorial/i.test(blockText));
const sources = blocks.find((b) => b.type === "sources");
check("sources block exists ≥10", !!sources && sources.items.length >= 10, `${sources?.items.length ?? 0}`);
const external = (sources?.items ?? []).filter((s) => !(s.url ?? "").includes("duyanblog.com") && !(s.url ?? "").startsWith("/"));
check("external source labels carry a checked date", external.every((s) => CHECK_DATE.test(s.label)), `${external.length} external`);
const srcBlockText = JSON.stringify(sources?.items ?? []);
const usedProviders = shortlist.filter((p) => str(blockText).includes(p));
check("each used provider has an official source",
  usedProviders.every((p) => new RegExp(p, "i").test(srcBlockText) && /https:\/\//i.test(srcBlockText)),
  `used: ${usedProviders.join(", ")}`);
// PR #10 review: refund claims must each point at an official first-party refund source.
const sailyRefundClaim = /Saily documents a full refund within 30 days/i.test(blockText);
const airaloRefundClaim = /Airalo processes refunds through its app/i.test(blockText);
const holaflyRefundClaim = /Holafly publishes a refund-policy page/i.test(blockText);
const srcUrls = (sources?.items ?? []).map((s) => String(s.url ?? "")).join(" ");
const refundSrcHits = [];
if (sailyRefundClaim && !/support\.saily\.com\/hc\/en-us\/articles/.test(srcUrls)) refundSrcHits.push("Saily refund claim lacks official Saily help-center article URL");
if (airaloRefundClaim && !/airalo\.com\/help\//.test(srcUrls)) refundSrcHits.push("Airalo refund claim lacks official Airalo help URL");
if (holaflyRefundClaim && !/holafly\.com\/refund-policy/.test(srcUrls)) refundSrcHits.push("Holafly refund claim lacks official refund-policy URL");
check("refund claims source-backed (Saily/Airalo/Holafly official URLs)", refundSrcHits.length === 0, refundSrcHits.join("; "));

// 5 — GEOGRAPHY
check("Europe-definition caveat present", /what .?we mean|not directly comparable|different definitions|countries and networks|destinations|coverage.*unit/i.test(blockText));
// The draft's own "never ranked against each other" disclaimer is allowed; the danger is claiming a
// coverage-count winner. Check claims, not the word "ranked".
check("no raw coverage-count ranking", !/\d+\s*(?:countries|destinations).{0,90}(?:wins|beats|is the best|best coverage)|(?:beats|wins).{0,60}\d+\s*(?:countries|destinations)|most (?:countries|destinations).{0,60}(wins|best)|better (?:coverage|cover).{0,40}\d+\s*(?:countries|destinations)/i.test(blockText));
const geoMentions = /United Kingdom|Switzerland|Türkiye|Turkey/i.test(blockText);
check("UK/Switzerland/Türkiye handled evidence-bound", !geoMentions || /unresolved|not itemized|not on.{0,30}page|varies by provider|documented|includes/i.test(blockText),
  geoMentions ? "geo context present" : "no geo mentions (ok)");

// 6 — PRICE (derived-math is checked structurally, not hardcoded)
const tables = blocks.filter((b) => b.type === "table");
check("tables within schema limits (≤40 rows, ≤8 cols)", tables.every((t) => t.rows.length <= 40 && t.head.length <= 8 && t.rows.every((r) => r.length <= 8)));

// Locate the fixed-data 10GB/30d comparison table structurally (head names "Plan" + "List price" + "Price / GB").
const priceTable = tables.find((t) =>
  Array.isArray(t.head) &&
  t.head.some((h) => /list price/i.test(h)) &&
  t.head.some((h) => /price\s*\/\s*GB/i.test(h)) &&
  t.head.some((h) => /^plan$/i.test(h))
);
const parseUSD = (s) => {
  const m = String(s).match(/^\$?(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : NaN;
};
const priceMathFailures = [];
if (!priceTable) {
  priceMathFailures.push("no fixed-data $/GB table found");
} else {
  const gold = { Ubigi: { gb: 10, price: 15 }, Nomad: { gb: 10, price: 23 }, Airalo: { gb: 10, price: 31 }, Saily: { gb: 10, price: 35.99 } };
  // Sanity: the table must not contain providers outside the four fixed-data row, and must not omit one.
  const rows = priceTable.rows ?? [];
  const provs = rows.map((r) => String(r[0] ?? "").toLowerCase());
  for (const name of Object.keys(gold)) {
    const i = provs.indexOf(name.toLowerCase());
    if (i === -1) { priceMathFailures.push(`${name} missing from $/GB table`); continue; }
    const row = rows[i];
    const plan = String(row[1] ?? "");
    const gbM = plan.match(/(\d+)GB/);
    const price = parseUSD(row[2]);
    const shown = parseUSD(row[3]);
    if (!gbM || (gold[name].gb !== -1 && Number(gbM[1]) !== gold[name].gb)) { priceMathFailures.push(`${name}: plan GB mismatch ('${plan}')`); continue; }
    if (gold[name].price !== -1 && Math.round(price * 100) !== Math.round(gold[name].price * 100)) { priceMathFailures.push(`${name}: list price ${price} != expected ${gold[name].price}`); continue; }
    const recomputed = Math.round((price / Number(gbM[1])) * 100) / 100;
    if (recomputed !== shown) { priceMathFailures.push(`${name}: shown $${shown}/GB != recomputed $${recomputed}/GB from $${price}/${gbM[1]}GB`); continue; }
  }
  // No unexpected fixed-data providers in this row.
  for (const r of rows) {
    const name = String(r[0] ?? "").toLowerCase();
    const isGold = Object.keys(gold).some((k) => k.toLowerCase() === name);
    if (!isGold) priceMathFailures.push(`unexpected provider '${r[0]}' in $/GB table`);
  }
}
check("price/GB rows recompute exactly: round(listPrice ÷ GB, 2) === displayed", priceMathFailures.length === 0, priceMathFailures.join("; "));
check("no unlimited price/GB", !/(unlimited[^\n]{0,30}\$\d+(?:\.\d+)?\/|\$\d+(?:\.\d+)?\/\s*GB[^\n]{0,30}unlimited)/i.test(blockText));
// Currency invariant: every row in the $/GB table is USD-fixed data (no €/EUR); Holafly (EUR) is absent from that row,
// and Holafly's euro price exists only in prose that explicitly keeps it outside the USD $/GB comparison.
const currency_failures = [];
const fixedTables = tables.filter((t) =>
  Array.isArray(t.head) &&
  t.head.some((h) => /price\s*\/\s*GB/i.test(h)) &&
  t.head.some((h) => /list price/i.test(h)));
for (const t of fixedTables) {
  for (const r of t.rows ?? []) {
    const cells = r.map((c) => String(c));
    const joined = cells.join(" ");
    if (/€|EUR/i.test(joined)) currency_failures.push(`mixed-currency row in $/GB table: ${cells[0]}`);
    const isHolafly = /holafly/i.test(cells[0] ?? "");
    if (isHolafly) currency_failures.push("Holafly (EUR-only) present in the USD $/GB table");
  }
}
if (!/€\s*\d|EUR/i.test(blockText)) currency_failures.push("Holafly's EUR pricing is not marked with €/EUR anywhere");
if (!/flat-fee unlimited|\beuro(?:s)?\b|EUR/i.test(blockText)) currency_failures.push("Holafly's EUR pricing lacks an explicit currency/position disclaimer");
check("currency: $/GB rows are USD-only fixed data; Holafly EUR excluded, not mixed", currency_failures.length === 0, currency_failures.join("; "));
check("promo/list not silently mixed", !/on sale|promo|limited time/i.test(blockText) || /per (provider|its own|the page).*checked|list price|on sale|sale price/i.test(blockText));

// 7 — FUP
check("no unlimited = unlimited full-speed", /unlimited (data )?(doesn'?t|does not|is not|≠|not|\bnever\b)/i.test(blockText) ||
  /fair usage|full-speed allowance|full speed data|then .*Mbps|reduced speed/i.test(blockText));
const ubigiSeg = blockText.match(/[^\"]*ubigi[^\"]{0,600}/i)?.[0] ?? blockText.toLowerCase();
check("Ubigi FUP duration-specific (25/30/60 GB)", /25\s?GB[\s\S]{0,120}2 Mbps|30\s?GB[\s\S]{0,120}2 Mbps|60\s?GB[\s\S]{0,120}2 Mbps/i.test(blockText),
  "duration-specific full-speed caps present");
check("Airalo FUP plan-specific attribution", /3[ -]?GB(?: per day)?(?: at 20 Mbps)?/i.test(blockText) && /resets?|daily|per Airalo|per its|Airalo/i.test(blockText));
check("Saily FUP plan-specific attribution", /5[ -]?GB(?: per day|[- ]+per day)?/i.test(blockText) && /Mbps|Saily/i.test(blockText));
check("Holafly hotspot/FUP product-specific", /share 1 ?GB|1 ?GB(?:[- ]per day| of data per day)|operator.{0,40}Fair Usage|local network operator/i.test(blockText));
check("Nomad FUP stays UNRESOLVED", !/nomad[\s\S]{0,200}(?:25 ?GB|2 ?Mbps|daily cap)/i.test(blockText),
  "no invented Nomad FUP numbers");

// 8 — LINKS (exact Markdown-link occurrence counts across prose, not paragraph presence)
const proseText = blocks
  .filter((b) => ["paragraph", "callout", "list", "quote", "pick"].includes(b.type))
  .map((b) => (Array.isArray(b.items) ? b.items.join("\n") : b.text ?? ""))
  .join("\n");
const countMkLinks = (haystack, w) => {
  const re = new RegExp(`\\[[^\\]]+\\]\\(${w}\\)`, "g");
  return [...haystack.matchAll(re)].length;
};
const guideLinkCount = countMkLinks(proseText, "/guides/how-much-esim-data-do-i-need");
const vsLinkCount = countMkLinks(proseText, "/compare/saily-vs-airalo");
check("exactly one guide link (occurrence count)", guideLinkCount === 1, `${guideLinkCount}`);
check("exactly one saily-vs-airalo link (occurrence count)", vsLinkCount === 1, `${vsLinkCount}`);

// 9 — CLAIMS
const firstHand = [/we tested/i, /in our tests/i, /our speed tests/i, /we experienced/i, /we measured/i, /tested across/i, /we bought/i];
const fhHits = firstHand.filter((r) => r.test(allText));
check("no first-hand testing language", fhHits.length === 0, fhHits.map(String).join(", "));
const perfClaims = [/fastest/i, /most reliable/i, /best network/i, /works everywhere/i];
const perfHits = perfClaims.filter((r) => r.test(allText));
check("no unsupported speed/reliability claims", perfHits.length === 0, perfHits.map(String).join(", "));
check("no fabricated scores", !/\b\d(?:\.\d)?\s*\/\s*10\b/i.test(allText));
check("no market-share/popularity claims", !/\d+ ?million (?:users|people)|most (?:popular|used) (?:eSIM|travel)/i.test(allText));
check("no testimonial/award as evidence", !/(testimonial|5 star|excellent rating|award-r?winning|trustpilot)/i.test(allText));
check("no 'average traveler needs X GB'", !/average (traveler|traveller|user) (needs|uses)/i.test(allText));

// 9b — REGRESSION GUARDS (PR #10 review findings — do not let these reappear)
// Unsupported popularity: the 10GB/30d row must be a comparison anchor for the four fixed-data sellers, never "most travellers buy".
check("no unsupported popularity claim for the 10GB shape", !/most travellers? (buy|need)|most thoughtful|what most people (buy|need)|the (popular|common).{0,15}(shape|size).{0,15}(buy|choose)/i.test(allText));
// Sizing recommendation must not ship; the guide owns "how much to buy".
check("no draft-level sizing recommendation ('safer start' / 'covers a trip')", !/safer start|rows? (are|is) the safer|(10GB\/30d|the 10GB shape).{0,80}(covers|is enough for|suits? a)/i.test(allText));
// Activation: never a universal "all five activate on arrival" / "clock starts when you land".
check("no blanket 'all five activate on arrival'", !/all five activate|all providers activate|every (provider|plan).{0,30}arrival/i.test(allText));
check("no blanket 'clock starts when you land'", !/clock starts? (when|as soon as|once) .{0,30}(land|arriv)/i.test(allText));
// Regional-vs-country: no universal winner, no invented causal explanation.
check("no 'regional plan wins' universal claim", !/regional plan wins|the (regional|Europe) plan (is better|wins).{0,40}(border|multi-country)/i.test(allText));
check("no invented country-cheaper causal wording", !/(country[- ]?specific|single[- ]?country).{0,60}cheaper.{0,40}because.{0,40}(breadth|regional|reach)/i.test(allText));

// 10 — MEDIA
const images = blocks.filter((b) => b.type === "image");
check("image blocks reference existing local files", images.every((b) => existsSync(path.join(ROOT, "public", b.src))), images.map((b) => b.src).join(", "));
check("hero metadata present + file exists",
  typeof draft.heroImage === "string" && existsSync(path.join(ROOT, "public", draft.heroImage ?? "")) &&
  typeof draft.heroAlt === "string" && draft.heroAlt.length > 20 &&
  typeof draft.heroCredit === "string" && draft.heroCredit.length > 3,
  `${draft.heroImage}`);
check("heroCredit plain text", typeof draft.heroCredit === "string" && !/\]\(/.test(draft.heroCredit) && !draft.heroCredit.includes("go:"));
const pexParas = blocks.filter((b) => b.type === "paragraph" && /\[[^\]]+\]\(https:\/\/www\.pexels\.com\/photo\/\d+\/\)/.test(b.text));
check("reader-visible Pexels attribution link exists", pexParas.length >= 1, `${pexParas.length}`);
check("no duplicate body hero", images.every((b) => b.src !== draft.heroImage));
check("no fake telecom/infra imagery implication", !/tower|antenna|signal bars|network infrastructure/i.test(draft.heroAlt));

// 11 — FAQ
const faq = blocks.find((b) => b.type === "faq");
check("faq block exists", !!faq && faq.items.length >= 4, `${faq?.items?.length ?? 0}`);

console.log(failures === 0 ? `\nAll draft integrity checks passed.` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);