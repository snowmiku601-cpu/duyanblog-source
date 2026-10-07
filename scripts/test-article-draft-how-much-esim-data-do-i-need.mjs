/**
 * Structural integrity gate for the "How much eSIM data do I need?" draft.
 *
 * Same pattern as scripts/test-article-draft-saily-vs-airalo.mjs: reads the draft
 * JSON, asserts content-integrity rules, exits non-zero on any FAIL. Each check
 * carries a control that must NOT match where meaningful.
 *
 *   node scripts/test-article-draft-how-much-esim-data-do-i-need.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRAFT = path.join(ROOT, "content", "drafts", "how-much-esim-data-do-i-need.json");
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
const allText = [blockText, draft.tldr ?? "", draft.deck ?? "", draft.title ?? ""].join("\n");
const supported = new Set([
  "paragraph", "heading", "list", "quote", "callout", "prosCons", "stats",
  "table", "image", "pick", "comparisonEmbed", "offerEmbed", "faq", "sources", "divider",
]);

// 1 — article meta: guide / exact slug / real content
check("meta: guide / slug / isDemo false", draft.type === "guide" && draft.slug === "how-much-esim-data-do-i-need" && draft.isDemo === false);
check("category travel", draft.categoryId === "travel");
check("title ≤ 70 chars", typeof draft.title === "string" && draft.title.length <= 70, `${draft.title?.length}`);
check("deck present", typeof draft.deck === "string" && draft.deck.length > 20);
check("tldr present", typeof draft.tldr === "string" && draft.tldr.length > 40);

// 2 — zero affiliate / commerce surfaces (content first, no affiliate rows exist)
check("no go: affiliate links", !blockText.includes("go:"), `${(blockText.match(/go:/g) ?? []).length} hits`);
check(
  "no commerce surfaces (offerId/offerEmbed/comparisonEmbed/pick)",
  !blocks.some((b) => ["offerEmbed", "comparisonEmbed", "pick"].includes(b.type)) && !blockText.includes("offerId"),
);

// 3 — no fake first-hand language; bounded methodology wording present
const firstHand = [/we tested/i, /in our tests/i, /we experienced/i, /our benchmark/i, /we bought/i, /we measured/i, /we conducted a/i];
const fhHits = firstHand.filter((r) => r.test(allText));
check("no first-hand testing language", fhHits.length === 0, fhHits.map(String).join(", "));
check(
  "bounded methodology wording present",
  /did not conduct first-hand/i.test(blockText),
);

// 4 — no fabricated-precision claims; "average traveler" claims barred
check("no 'average traveler uses' claim", !/average (traveler|traveller|user) (uses|consumes|needs)/i.test(allText));
// Convention per-app point numbers must not appear as facts (controls: labelled forms are fine)
const pointClaims = [
  /google maps uses \d+\s?mb per hour/i,
  /whatsapp uses (?:about |around )?\d+\s?mb per (?:hour|minute)/i,
  /instagram uses exactly/i,
];
const pcHits = pointClaims.filter((r) => r.test(allText));
check("no per-app point figures stated as fact", pcHits.length === 0, pcHits.map(String).join(", "));

// 5 — the unsupported OS-update range from the Task 25 review blocker must not appear
// (safe wording instead); a first-party-sourced range would be allowed only if labelled
check("no unsupported OS-update 2-7 GB range", !/2[-–]7\s?GB/i.test(allText));
check(
  "safe update-headroom wording present",
  /extra headroom for large app or system updates/i.test(allText),
);

// 6 — supported block types only, schema limits respected
const badTypes = blocks.filter((b) => !supported.has(b.type));
check("supported block types only", badTypes.length === 0, badTypes.map((b) => b.type).join(", "));
const tables = blocks.filter((b) => b.type === "table");
check(
  "tables within schema limits (≤40 rows, ≤8 cols, cells ≤300)",
  tables.every((t) => t.rows.length <= 40 && t.head.length <= 8 && t.rows.every((r) => r.length <= 8) && tables.every((t) => t.rows.flat().every((c) => c.length <= 300))),
  `${tables.length} tables`,
);
check("tables carry the checked date in caption", tables.every((t) => (t.caption ?? "").includes(CHECK_DATE)));

// 7 — evidence classification present where numeric activity guidance is given
check(
  "classification terms present (documented / derived / editorial)",
  /documented/i.test(allText) && /derived/i.test(allText) && /editorial/i.test(allText),
);
check(
  "requirement-vs-consumption caveat present",
  /bandwidth requirement/i.test(allText) && /not (typical|actual) (consumption|usage)|upper (bound|provisioning)/i.test(blockText),
);

// 8 — unlimited/FUP wording must not equate unlimited with unlimited full-speed
check(
  "unlimited ≠ unlimited full-speed distinction made",
  /unlimited (data )?(is |does )?not|doesn'?t mean unlimited (full-speed|data)|fair usage|full-speed allowance|throttl/i.test(allText),
);
check(
  "both providers' FUP terms appear with attribution",
  /3GB per day at 20 Mbps/i.test(blockText) && /5GB\/Day without a speed limit|up to 1 Mbps/i.test(blockText),
);

// 9 — source families required when their numbers appear
const sources = blocks.find((b) => b.type === "sources");
check("sources block exists", !!sources && sources.items.length >= 8, `${sources?.items.length ?? 0} items`);
const srcUrls = new Set((sources?.items ?? []).map((s) => (s.url ?? "").replace(/\/$/, "")));
const srcBlockText = JSON.stringify(sources?.items ?? []);
const families = [
  { name: "netflix", numbers: [/0\.3\s?GB|4 hours per GB|1 GB per 20 minutes/i], url: "help.netflix.com/en/node/87" },
  { name: "spotify", numbers: [/96\s?kbit|320\s?kbit|kbps/i], url: "support.spotify.com/us/article/audio-quality" },
  { name: "zoom", numbers: [/600\s?kbps|Zoom VoIP|zoom.*60.80/i], url: "support.zoom.com" },
  { name: "teams", numbers: [/1,?500\s?kbps|under 1\.5\s?Mbps/i], url: "learn.microsoft.com/en-us/microsoftteams/prepare-network" },
  { name: "apple-low-data", numbers: [/Low Data Mode/i], url: "support.apple.com" },
  { name: "android-data-saver", numbers: [/Data Saver/i], url: "support.google.com/pixelphone/answer/7055392" },
  { name: "airalo-fup", numbers: [/3GB per day at 20 Mbps/i], url: "airalo.com/m/esim/unlimited-packages" },
  { name: "saily-fup", numbers: [/up to 1 Mbps/i], url: "saily.com" },
];
const missingFamilies = [];
for (const f of families) {
  const used = f.numbers.some((r) => r.test(blockText));
  if (!used) continue;
  const present = srcUrls.has(`https://${f.url}`) || srcUrls.has(`https://www.${f.url}`) || srcBlockText.includes(f.url);
  if (!present) missingFamilies.push(f.name);
}
check("every used numeric family has its official source", missingFamilies.length === 0, missingFamilies.join(", ") || "all families covered");

// 10 — external sources carry the checked date (our own pages excluded)
const external = (sources?.items ?? []).filter((s) => !(s.url ?? "").includes("duyanblog.com"));
check(
  "every external source label carries the checked date",
  external.every((s) => s.label.includes(CHECK_DATE)),
  `${external.length} external items`,
);

// 11 — internal links: contextual, no provider recommendation.
// Exact Markdown-link OCCURRENCE counts, not paragraph presence (Task 33/39
// discipline: a duplicate inside one paragraph must fail).
const countMkLinks = (haystack, w) => {
  const re = new RegExp(`\\[[^\\]]+\\]\\(${w}\\)`, "g");
  return [...haystack.matchAll(re)].length;
};
const guideProse = blocks
  .filter((b) => ["paragraph", "callout", "list", "quote"].includes(b.type))
  .map((b) => (Array.isArray(b.items) ? b.items.join("\n") : b.text ?? ""))
  .join("\n");
const vsLinkCount = countMkLinks(guideProse, "/compare/saily-vs-airalo");
const europeLinkCount = countMkLinks(guideProse, "/best/best-esim-for-europe");
check("contextual internal link to /compare/saily-vs-airalo exists", vsLinkCount === 1, `${vsLinkCount} occurrence(s)`);
check(
  "exactly one contextual reverse-backlink to /best/best-esim-for-europe (Task 39)",
  europeLinkCount === 1,
  `${europeLinkCount} occurrence(s)`,
);
check("no provider recommendation wording", !/(we recommend|you should choose|best provider is|choose saily|choose airalo)/i.test(allText));

// 12 — FAQ present with the expected blocking questions
const faq = blocks.find((b) => b.type === "faq");
check("faq block exists", !!faq && faq.items.length >= 4, `${faq?.items?.length ?? 0} items`);

// 13 — hero media: lives in Article.heroImage (not duplicated in body); real file
const images = blocks.filter((b) => b.type === "image");
const missingMedia = images.filter((b) => !existsSync(path.join(ROOT, "public", b.src)));
check("image blocks reference existing local files", missingMedia.length === 0, missingMedia.map((b) => b.src).join(", "));
check(
  "hero metadata present",
  typeof draft.heroImage === "string" && draft.heroImage.length > 0 && existsSync(path.join(ROOT, "public", draft.heroImage ?? "")) &&
    typeof draft.heroAlt === "string" && draft.heroAlt.length > 20 &&
    typeof draft.heroCredit === "string" && draft.heroCredit.length > 3,
  `${draft.heroImage} | alt ${draft.heroAlt?.length ?? 0}ch`,
);

// 14 — derived math is shown at least once (readers can re-derive)
check("derivation math shown (kbps to MB/hour)", /×\s*0\.45|3600.{0,40}8.{0,40}1,?000,?000|kbps.{0,30}0\.45/.test(blockText));

// 15 — author/byline fixed (approved public identity only)
check("author duyan with public byline", draft.authorSlug === "duyan" && draft.authorByline === "Duy An Tran");

// 16 — TRIP-FLOOR ARITHMETIC REGRESSION: every trip-table cell must equal
// (profile daily lower bound) × days, recomputed here independently.
// Regression: the first draft's table included values below lower-bound × days
// (light 7d "1 GB" vs floor 1.4 GB), contradicting the stated rounding rule.
const DAILY_LOWER = { light: 0.2, normal: 0.4, heavy: 1.0 };
const TRIP_DAYS = { "3 days": 3, "7 days": 7, "14 days": 14, "30 days": 30 };
const tripTable = tables.find((t) => /Light floor/i.test(t.head.join("|")));
const floorErrors = [];
for (const row of tripTable?.rows ?? []) {
  const days = TRIP_DAYS[row[0]];
  if (!days) { floorErrors.push(`unknown trip "${row[0]}"`); continue; }
  ["light", "normal", "heavy"].forEach((profile, col) => {
    const expected = DAILY_LOWER[profile] * days;
    const stated = parseFloat(row[col + 1]);
    if (!Number.isFinite(stated) || Math.abs(stated - expected) > 0.051) {
      floorErrors.push(`${row[0]} ${profile}: stated ${row[col + 1]} ≠ floor ${expected}`);
    }
  });
}
check(
  "trip floors = profile lower bound × days (recomputed)",
  tripTable && floorErrors.length === 0,
  floorErrors.join("; ") || "12 cells recomputed",
);
check(
  "trip table presents floors, not package recommendations",
  !!tripTable && /planning floor/i.test(tripTable.caption) && !/round up to the next package/i.test(tripTable.caption),
);

// 17 — ONE buy rule: "next package at least the estimate"; the conflicting
// "one package size above your estimate" rule must not appear anywhere.
check(
  "single consistent buy rule",
  /package.{0,60}(at least (this|that) amount|at least that amount)/i.test(allText) &&
    !/one package size above your estimate/i.test(allText) &&
    !/quality tier more headroom/i.test(allText),
);

// 18 — unsupported magnitude claims stay out
const magnitude = [
  /text is kilobytes/i, /ride-hailing apps are light/i, /consume gigabytes/i, /silently consume/i,
  /massively overestimate messaging/i, /text messaging is essentially free/i, /text messaging uses very little/i,
  /ride-hailing usage is modest/i, /updates, backups and sync all switch on/i,
  /removes the largest recurring map cost entirely/i, /removes \.\.\. map cost entirely/i,
  /behaves like it is on home wi-?fi/i,
];
const magHits = magnitude.filter((r) => r.test(allText));
check("no unsupported magnitude claims", magHits.length === 0, magHits.map(String).join(", "));

// 18b — malformed copy bug must never return
check("no malformed possessive copy bug", !/we cover' own/i.test(allText));

// 19 — Android Unrestricted-data must not be framed as a weak-Wi-Fi assist equivalent
check(
  "no Unrestricted-data-as-assist-equivalent claim",
  !/unrestricted data[^\"]{0,80}(assist|weak wi-fi|connectivity)/i.test(blockText),
);

// 20 — Apple Connectivity Assist must cite its current source (127686), not 109323,
// and any travel-context CA discussion must carry the international-roaming caveat.
// Regression: the feature's documentation states it is NOT used while the iPhone is
// international roaming or cellular Low Data Mode is enabled — omitting that in a
// travel/eSIM article would overstate the roaming drain.
const caUsed = /Connectivity Assist/i.test(blockText);
const caSrc = (sources?.items ?? []).find((s) => (s.url ?? "").includes("127686"));
check(
  "Connectivity Assist claims have the current Apple source",
  !caUsed || (!!caSrc && caSrc.label.includes(CHECK_DATE)),
  caSrc ? "127686 present" : "127686 missing",
);
const caTravel = /Connectivity Assist[\s\S]{0,600}/i.test(blockText) && /travel|roaming|trip/i.test(blockText.match(/Connectivity Assist[\s\S]{0,600}/i)?.[0] ?? "");
check(
  "Connectivity Assist travel discussion carries the roaming caveat",
  !caTravel || /not used while the iPhone is international roaming/i.test(blockText),
  caTravel ? "travel context found — caveat required" : "no travel-context CA discussion",
);

// 21 — Pexels attribution: reader-visible paragraph near the start with the real photo ID
const pexParas = blocks.filter(
  (b) => b.type === "paragraph" && /\[[^\]]+\]\(https:\/\/www\.pexels\.com\/photo\/(\d+)\/\)/.test(b.text),
);
check("reader-visible Pexels paragraph exists", pexParas.length >= 1, `${pexParas.length}`);
check("Pexels photo ID is 35969", pexParas.every((b) => b.text.match(/pexels\.com\/photo\/(\d+)\//)?.[1] === "35969"));
const pexIdx = blocks.findIndex((b) => b.type === "paragraph" && /pexels\.com\/photo\/35969/.test(b.text ?? ""));
check("Pexels attribution near the beginning (within first 6 blocks)", pexIdx >= 0 && pexIdx <= 5, `block ${pexIdx}`);
check(
  "heroCredit plain text (no Markdown/go:)",
  typeof draft.heroCredit === "string" && !/\]\(/.test(draft.heroCredit) && !draft.heroCredit.includes("go:"),
  draft.heroCredit,
);

console.log(failures === 0 ? `\nAll draft integrity checks passed.` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
