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

// 11 — image blocks point at real local files
const images = blocks.filter((b) => b.type === "image");
const missing = images.filter((b) => !existsSync(path.join(ROOT, "public", b.src)));
check("image blocks reference existing local files", missing.length === 0, missing.map((b) => b.src).join(", "));
check("hero image present", images.length >= 1);

// 12 — article meta shape Task 4 imports
check("article meta: versus/slug/isDemo false", draft.type === "versus" && draft.slug === "saily-vs-airalo" && draft.isDemo === false);
check("title ≤ 70 chars", typeof draft.title === "string" && draft.title.length <= 70, `${draft.title?.length}`);
check("deck present", typeof draft.deck === "string" && draft.deck.length > 20);

console.log(failures === 0 ? `\nAll draft integrity checks passed.` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
