/**
 * Structural integrity gate for the Saily vs Airalo article draft.
 *
 * Same pattern as scripts/test-cta-readiness.mjs: reads the draft JSON,
 * asserts content-integrity rules, exits non-zero on any FAIL. Each check
 * carries a control that must NOT match where meaningful.
 *
 *   node scripts/test-article-draft-saily-vs-airalo.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRAFT = path.join(ROOT, "content", "drafts", "saily-vs-airalo.json");
const CHECK_DATE = "2026-10-06";

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

// 1 — zero affiliate go: links anywhere (control: the string must not appear even in labels)
check("no go: affiliate links", !blockText.includes("go:"), `${(blockText.match(/go:/g) ?? []).length} hits`);

// 2 — no fake first-hand language
const firstHand = [/we tested/i, /in our tests/i, /we experienced/i, /our benchmark/i, /we bought/i, /we measured/i];
const fhHits = firstHand.filter((r) => r.test(blockText));
check("no first-hand testing language", fhHits.length === 0, fhHits.map(String).join(", "));

// 3 — owner-mandated bounded scope wording, not absolutes
check(
  "no absolute nobody-has-used scope wording",
  !/nobody (on our team )?has (ever )?used/i.test(blockText),
);
check(
  "bounded methodology wording present",
  /did not conduct first-hand performance testing/i.test(blockText),
);

// 4 — table shape within schema hard limits (tableBlock: ≤40 rows, ≤8 cells/row)
const tables = blocks.filter((b) => b.type === "table");
check(
  "tables within schema limits",
  tables.every((t) => t.rows.length <= 40 && t.rows.every((r) => r.length <= 8) && t.head.length <= 8),
  `${tables.length} tables, max rows ${Math.max(0, ...tables.map((t) => t.rows.length))}`,
);
check("table captions carry the checked date", tables.every((t) => (t.caption ?? "").includes(CHECK_DATE)));

// 5 — supported block types only
const badTypes = blocks.filter((b) => !supported.has(b.type));
check("supported block types only", badTypes.length === 0, badTypes.map((b) => b.type).join(", "));

// 6 — no commerce surfaces at all (content first, no affiliate)
check(
  "no commerce surfaces (offerId/offerEmbed/comparisonEmbed/pick)",
  !blocks.some((b) => ["offerEmbed", "comparisonEmbed", "pick"].includes(b.type)) && !blockText.includes("offerId"),
);

// 7 — sources: exists, enough items, external ones carry checked dates
// (the internal methodology page is our own static content — no check date applies)
const sources = blocks.find((b) => b.type === "sources");
check("sources block exists with ≥12 items", !!sources && sources.items.length >= 12, `${sources?.items.length ?? 0} items`);
const external = (sources?.items ?? []).filter((s) => !(s.url ?? "").includes("duyanblog.com"));
check(
  "every external source label carries the checked date",
  external.every((s) => s.label.includes(CHECK_DATE)),
  `${external.length} external items`,
);

// 8 — TL;DR present, scenario-based, no overall-winner phrasing
check("tldr present", typeof draft.tldr === "string" && draft.tldr.length > 40);
check(
  "no overall-winner phrasing in tldr",
  !/overall winner|wins overall|best overall/i.test(draft.tldr ?? ""),
);

// 9 — Airalo Japan 1GB conflict qualifier wherever the pairing is mentioned
const japanMentions = blockText.match(/[^"]*1GB[^"]{0,200}/g) ?? [];
const bad1gb = japanMentions.filter((s) => /airalo/i.test(s) && /only valid/i.test(s));
check("Airalo 1GB never stated as 'only valid' fact", bad1gb.length === 0, bad1gb.length ? bad1gb[0].slice(0, 90) : "");
check(
  "conflict-cautious 1GB wording present",
  /listed under the 3-day group/i.test(blockText),
);

// 10 — vendor claims attributed inline
const vendorClaims = [/30 ?million/i, /creators of nordvpn/i];
const unattributed = vendorClaims.filter((r) => {
  const m = blockText.match(new RegExp(`.{0,120}${r.source}`));
  return m && !/per (Saily|Airalo|its|their|the provider)'?s?( own)? (site|page|terms|docs|faq)/i.test(m[0]);
});
check("vendor claims carry per-provider attribution", unattributed.length === 0, unattributed.map(String).join(", "));

// 11 — hero lives in Article.heroImage (deduped from the body); any remaining image
// blocks must point at real local files, and the body must NOT duplicate the hero.
const images = blocks.filter((b) => b.type === "image");
const missing = images.filter((b) => !existsSync(path.join(ROOT, "public", b.src)));
check("image blocks reference existing local files", missing.length === 0, missing.map((b) => b.src).join(", "));
const HERO = "/images/articles/saily-vs-airalo/hero-airport-phone.jpg";
check(
  "hero metadata present and matches the deployed asset",
  draft.heroImage === HERO && existsSync(path.join(ROOT, "public", draft.heroImage ?? "")) &&
    typeof draft.heroAlt === "string" && draft.heroAlt.length > 20 &&
    typeof draft.heroCredit === "string" && draft.heroCredit.length > 3,
  `${draft.heroImage} | alt ${draft.heroAlt?.length ?? 0}ch | credit ${draft.heroCredit ?? "none"}`,
);
check(
  "hero image not duplicated in body blocks",
  images.every((b) => b.src !== HERO),
  `${images.length} body image block(s)`,
);

// 12 — article meta shape Task 4 imports
check("article meta: versus/slug/isDemo false", draft.type === "versus" && draft.slug === "saily-vs-airalo" && draft.isDemo === false);
check("title ≤ 70 chars", typeof draft.title === "string" && draft.title.length <= 70, `${draft.title?.length}`);
check("deck present", typeof draft.deck === "string" && draft.deck.length > 20);

// 12b — final-state counts and approved tags (must match the production row exactly)
check("final block count = 34", blocks.length === 34, `${blocks.length}`);
check("readingMinutes = 14", draft.readingMinutes === 14, `${draft.readingMinutes}`);
const APPROVED_TAGS = ["eSIM", "Travel connectivity", "Saily", "Airalo"];
check(
  "tags exactly the four approved values",
  Array.isArray(draft.tags) && draft.tags.length === APPROVED_TAGS.length &&
    APPROVED_TAGS.every((t, i) => draft.tags[i] === t),
  JSON.stringify(draft.tags),
);

// 13 — every price/validity pair the prose or FAQ compares directly must exist as a table row.
// Regression: prose once compared "Airalo 10GB/30d $18.00" while the table only had 10GB/7d $17.00.
// Extract "$X.XX" amounts near a "<N> GB/<N> days"-style validity token from paragraph/faq text,
// then require the (provider-agnostic) pair to appear in some table.
const proseFields = [
  ...blocks.filter((b) => b.type === "paragraph").map((b) => b.text),
  ...(blocks.find((b) => b.type === "faq")?.items ?? []).map((i) => i.a),
  draft.tldr ?? "",
].join("\n");

const tablePairs = new Set();
for (const t of tables) {
  for (const r of t.rows) {
    const gb = (r[1] ?? "").match(/(\d+)\s*GB/i)?.[1];
    const days = (r[2] ?? "").match(/(\d+)\s*days?/i)?.[1];
    const price = (r[3] ?? "").match(/\$(\d+(?:\.\d{2})?)/)?.[1];
    if (gb && days && price) tablePairs.add(`${gb}GB|${days}d|${price}`);
  }
}

const compared = new Set();
// Split prose into sentences; pin a pair only when one sentence names a GB amount
// and a day window AND contains both prices — a much tighter context than raw proximity.
for (const sentence of proseFields.split(/(?<=[.!?])\s+/)) {
  const prices = [...sentence.matchAll(/\$(\d+(?:\.\d{2})?)/g)].map((x) => x[1]);
  if (prices.length < 2) continue;
  const gbs = [...sentence.matchAll(/(\d+)\s*GB\b/gi)].map((x) => x[1]);
  const days = [...sentence.matchAll(/(\d+)[- ]days?|\bover (\d+) days\b|(\d+)\s*days?\s+(?:of validity|minimum|window)/gi)]
    .map((x) => x[1] ?? x[2] ?? x[3])
    .filter(Boolean);
  if (gbs.length !== 1 || days.length !== 1) continue;
  for (const price of prices) compared.add(`${gbs[0]}GB|${days[0]}d|${price}`);
}
const uncovered = [...compared].filter((p) => !tablePairs.has(p));
check(
  "every prose/FAQ price pair exists as a table row",
  uncovered.length === 0,
  uncovered.length ? `missing from tables: ${uncovered.join("; ")}` : `${compared.size} compared pairs all covered`,
);

// 14 — Pexels attribution: a reader-visible link to the photo page must exist in article
// content (paragraph), while image.credit stays PLAIN TEXT — it must never carry Markdown
// links or go: targets (renderer renders credit as plain text; a link there would be a
// semantics change and go: would create an undisclosed affiliate surface).
const imgsWithCredit = images.filter((b) => b.credit);
check(
  "image credits are plain text (no Markdown links)",
  imgsWithCredit.every((b) => !/\]\(/.test(b.credit)),
  imgsWithCredit.map((b) => b.credit?.slice(0, 50)).join(" | "),
);
check(
  "image credits contain no go: targets",
  imgsWithCredit.every((b) => !b.credit.includes("go:")),
);
const pexelsLinkBlocks = blocks.filter(
  (b) => b.type === "paragraph" && /\[[^\]]+\]\(https:\/\/www\.pexels\.com\/photo\/\d+\/\)/.test(b.text),
);
check(
  "a paragraph renders the Pexels photo-page link",
  pexelsLinkBlocks.length >= 1,
  `${pexelsLinkBlocks.length} attribution paragraph(s)`,
);
const photoPageIds = pexelsLinkBlocks
  .map((b) => b.text.match(/pexels\.com\/photo\/(\d+)/)?.[1])
  .filter(Boolean);
check(
  "the Pexels link uses the real photo ID",
  photoPageIds.length >= 1 && photoPageIds.every((id) => /^\d+$/.test(id)),
  photoPageIds.join(", "),
);

// 15 — reader-facing source completeness: homepage-derived claim families must have
// their official homepage in the Sources block with the checked date.
// Regression: "200+ locations"/"30 million"/"creators of NordVPN"/"$1.99 phone add-on"
// appeared in prose with no homepage source a reader could check.
const homepageClaimFamilies = [
  { provider: "airalo", patterns: [/200\+\s*locations/i, /over 30\s*million/i, /53\s*languages/i, /multiple currencies/i], homepage: "https://www.airalo.com" },
  { provider: "saily", patterns: [/creators of nordvpn/i, /\$1\.99\/month/i, /\$1\.99\s*(?:\/|per)\s*mo/i], homepage: "https://saily.com" },
];
const srcUrls = new Set((sources?.items ?? []).map((s) => s.url.replace(/\/$/, "")));
const staleClaims = [];
for (const family of homepageClaimFamilies) {
  const claimsUsed = family.patterns.some((r) => r.test(blockText));
  const homepageSrc = [...srcUrls].find((u) => u === family.homepage);
  if (claimsUsed && !homepageSrc) staleClaims.push(`${family.provider}: claims used but homepage missing from sources`);
  if (claimsUsed && homepageSrc) {
    const item = (sources?.items ?? []).find((s) => s.url.replace(/\/$/, "") === family.homepage);
    if (item && !item.label.includes(CHECK_DATE)) staleClaims.push(`${family.provider}: homepage source lacks the checked date`);
  }
}
check(
  "homepage-derived claims have their homepage source with the checked date",
  staleClaims.length === 0,
  staleClaims.join("; ") || "both homepage families covered",
);

// 16 — exactly one contextual internal link to the data-estimation guide
// (two-way cluster link). Count actual Markdown-link OCCURRENCES across article
// prose, not paragraphs containing it — two links inside one paragraph must fail.
const guideLinkOccurrences = blocks
  .filter((b) => b.type === "paragraph")
  .flatMap((b) => [...b.text.matchAll(/\[[^\]]+\]\(\/guides\/how-much-esim-data-do-i-need\)/g)]);
check(
  "exactly one contextual link to /guides/how-much-esim-data-do-i-need",
  guideLinkOccurrences.length === 1,
  `${guideLinkOccurrences.length} occurrence(s)`,
);
const guideSrcRow = (sources?.items ?? []).some((s) => (s.url ?? "").includes("how-much-esim-data-do-i-need"));
check("guide link lives in prose, not in the sources block", !guideSrcRow);

console.log(failures === 0 ? `\nAll draft integrity checks passed.` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
