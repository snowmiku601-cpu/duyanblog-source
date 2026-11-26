/**
 * Offline integrity gate for the CMY Cubes documented-research roundup.
 * Pattern: test-article-draft-best-phomemo-printers.mjs, with real schema/config
 * imports and adversarial controls. No network, database, or environment files.
 *
 *   node scripts/test-article-draft-best-cmy-cubes.mjs
 *
 * Price pins were reconciled against the saved official rendered-variant and
 * Shopify evidence checked 2026-11-26. The pack has NO captured rendered price.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

const ROOT = process.cwd();
const CHECK_DATE = "2026-11-26";
const HUMAN_DATE = "November 26, 2026";
const STORE = "https://www.cmycubes.com/?ref=duyan";
const HERO = "/images/articles/best-cmy-cubes/hero-cmy-cubes-composite.jpg";
const HERO_ALT = "CMY Cubes Original Cube, The Aether and The Mundus on a warm paper background";
const HERO_CREDIT = "CMY Cubes (cmycubes.com); composite arrangement by Duyan Blog";
const SUPPORTED = new Set([
  "paragraph", "heading", "list", "quote", "callout", "prosCons", "stats",
  "table", "image", "pick", "comparisonEmbed", "offerEmbed", "faq", "sources", "divider",
]);
const PICKS = [
  { name: "The Original Cube", handle: "the-original-cube", row: /Original Cube/i,
    variants: { mini: [18.36, 22.95], original: [27.96, 34.95], mega: [63.96, 79.95] }, price: 27.96 },
  { name: "The Aether", handle: "the-aether", row: /Aether/i,
    variants: { original: [35.96, 44.95], mini: [27.96, 34.95] }, price: 35.96 },
  { name: "The Mundus", handle: "the-mundus", row: /Mundus/i,
    variants: { original: [35.96, 44.95], mini: [27.96, 34.95] }, price: 35.96 },
  { name: "The Aeternus Aenigma - Series Monochromatica", handle: "the-aeternus-aenigma-series-monochromatica", row: /Monochromatica/i,
    variants: { default: [47.96, 59.95] }, price: 47.96 },
  { name: "The Original Pack (Cube + GyroStand)", handle: "the-original-cube-gyrostand", row: /Original Pack/i,
    variants: { default: [null, 57.95] }, price: 57.95 },
];
let failures = 0;
let checks = 0;
const check = (name, ok, detail = "") => {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const textFile = (relative) => readFileSync(path.join(ROOT, relative), "utf8");
const cents = (n) => Math.round(Number(n) * 100);
const equalAmounts = (a, b) => isDeepStrictEqual([...new Set(a.map(cents))].sort((x, y) => x - y), [...new Set(b.map(cents))].sort((x, y) => x - y));
const compact = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const sentences = (text) => compact(text).split(/[.!?](?=\s|$)/).filter(Boolean);
const clauses = (text) => sentences(text).flatMap((s) => s.split(/;|\b(?:while|against|versus)\b/i));

function stringsIn(value, location = "draft") {
  if (typeof value === "string") return [{ location, text: value }];
  if (Array.isArray(value)) return value.flatMap((item, i) => stringsIn(item, `${location}[${i}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => stringsIn(item, `${location}.${key}`));
  return [];
}
function parseUrl(value) {
  try { return new URL(value); } catch { return null; }
}
function isCmyHost(host) {
  return host === "cmycubes.com" || host.endsWith(".cmycubes.com");
}
function isCmyImage(value) {
  const u = parseUrl(value);
  return !!u && u.protocol === "https:" && u.hostname === "www.cmycubes.com" && !u.username && !u.password && !u.port &&
    /^\/cdn\/shop\/(?:files|products)\/.+\.(?:avif|gif|jpe?g|png|webp)$/i.test(u.pathname);
}
function isExactReferral(value) {
  const u = parseUrl(value);
  if (!u || u.protocol !== "https:" || !isCmyHost(u.hostname) || u.username || u.password || u.port) return false;
  const refs = [...u.searchParams].filter(([key]) => key.toLowerCase() === "ref");
  // URLSearchParams rejects substring/fragment tricks; raw query also pins the
  // literal lowercase spelling rather than accepting percent-encoded aliases.
  return refs.length === 1 && refs[0][0] === "ref" && refs[0][1] === "duyan" &&
    u.search.slice(1).split("&").filter((part) => part === "ref=duyan").length === 1;
}
function cmyUrlsIn(value) {
  // Scan every raw field, including fields Zod would strip. Bare and relative
  // merchant navigation is rejected, not silently skipped. A plain credit
  // mentioning only the domain is not a navigation URL.
  const absolute = /(?:https?:)?\/\/[^\s<>"'`)\]]+/gi;
  const bare = /(?:[a-z0-9-]+\.)*cmycubes\.com(?::\d+)?[/?#][^\s<>"'`)\]]*/gi;
  const urls = [...String(value).matchAll(absolute)].map((m) => m[0]).filter((url) => /cmycubes\.com/i.test(url));
  const withoutAbsolute = String(value).replace(absolute, "");
  urls.push(...[...withoutAbsolute.matchAll(bare)].map((m) => m[0]));
  return [...new Set(urls.map((url) => url.replace(/[.,;!]+$/, "")))];
}
function navigationProblems(value) {
  return stringsIn(value).flatMap(({ location, text }) => cmyUrlsIn(text)
    .filter((url) => !isCmyImage(url) && !isExactReferral(url)).map((url) => `${location}: ${url}`));
}
function money(text) {
  return [...String(text).matchAll(/\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/g)]
    .map((m) => ({ value: Number(m[1].replaceAll(",", "")), index: m.index, end: m.index + m[0].length }));
}
function variantOrder(text) {
  return [...text.matchAll(/\b(Mini|Original|Mega)\b(?!\s+(?:Cube|Pack))/gi)].map((m) => m[1].toLowerCase());
}
function scopedPrices(text, variants) {
  const observed = [[], []];
  const errors = [];
  let previousOrder = [];
  for (const clause of clauses(text)) {
    const amounts = money(clause);
    if (!amounts.length) {
      const names = variantOrder(clause);
      if (/\d+\s*mm/i.test(clause) && names.length) previousOrder = names;
      continue;
    }
    const json = /\bJSON\b/i.test(clause);
    const displayed = /\b(?:displayed|rendered)\b/i.test(clause);
    if (json === displayed) { errors.push("ambiguous displayed/JSON price attribution"); continue; }
    const kind = json ? 1 : 0;
    observed[kind].push(...amounts.map((m) => m.value));
    if (Object.keys(variants).length === 1) continue;
    // Both "Original $x" and "$x for Original" work. Parallel "respectively"
    // and "corresponding JSON" lists inherit their immediately preceding order.
    let order = amounts.map((entry, i) => {
      const after = clause.slice(entry.end, amounts[i + 1]?.index ?? clause.length);
      const before = clause.slice(amounts[i - 1]?.end ?? 0, entry.index);
      return /^\s*(?:for\s+(?:the\s+)?)?(Mini|Original|Mega)\b/i.exec(after)?.[1]?.toLowerCase() ??
        /\b(Mini|Original|Mega)(?:\s+(?:\d+mm|size|variant|price|at))*\s*$/i.exec(before)?.[1]?.toLowerCase();
    });
    if (!order.every(Boolean)) order = previousOrder;
    if (order.length !== amounts.length || order.some((name, i) => cents(variants[name]?.[kind]) !== cents(amounts[i].value))) {
      errors.push(`wrong or unscoped ${json ? "JSON" : "displayed"} variant amounts`);
    }
    previousOrder = order;
  }
  for (const kind of [0, 1]) {
    const expected = Object.values(variants).map((pair) => pair[kind]).filter((n) => n !== null);
    if (!equalAmounts(observed[kind], expected)) errors.push(`incorrect ${kind ? "JSON" : "displayed"} amount set`);
  }
  return errors;
}
function priceLeak(text) {
  if (/\bVND\b|₫/i.test(text)) return true;
  const withoutImages = cmyUrlsIn(text).filter(isCmyImage).reduce((out, image) => out.replaceAll(image, ""), text);
  return /\b\d{6,}\b/.test(withoutImages) || [...withoutImages.matchAll(/\b\d{1,3}(?:[,.]\d{3})+\b/g)]
    .some((m) => m[0].replace(/\D/g, "").length >= 6);
}
function isNegated(text, index) {
  const prefix = text.slice(0, index).split(/;|\b(?:but|however|yet)\b/i).at(-1);
  return /\b(?:no|not|nor|never|without|unverified|unproven|cannot|can't|didn't|haven't)\b/i.test(prefix);
}
function affirmativeHits(text, patterns) {
  // Questions are not affirmative claims; their answers are checked separately.
  const assertions = compact(text).split(/(?<=[.!?])\s+/).filter((s) => !s.endsWith("?"));
  return assertions.flatMap((sentence) => patterns.flatMap((pattern) => {
    const matches = [...sentence.matchAll(new RegExp(pattern.source, "gi"))];
    return matches.filter((m) => !isNegated(sentence, m.index) && !/^\s*(?:neither|no|nothing)\b/i.test(sentence.slice(m.index + m[0].length))).map((m) => m[0]);
  }));
}
function affiliateGuarantees(text) {
  // "Does not change the price" is an affirmative guarantee despite its
  // grammatical negation. Only a denial BEFORE that claim should exempt it.
  const patterns = [
    /\b(?:referral|affiliate)(?: code| links?)?[^.!?;]{0,90}\b(?:does not|do not|doesn't|don't|won't|will not|never) (?:change|affect|increase|raise|alter)s?\b[^.!?;]{0,60}\b(?:price|prices|cost|costs)\b/,
    /\b(?:at )?no (?:extra|additional) (?:cost|charge)\b/,
    /\b(?:the )?price (?:you pay )?(?:is|will be|stays|remains) (?:the )?(?:same|unchanged)\b/,
    /\b(?:same price|price unchanged|you (?:will )?pay nothing extra)\b/,
  ];
  return affirmativeHits(text, patterns);
}
function shippingAttribution(text) {
  const parts = clauses(text);
  return parts.some((s) => s.includes("/policies/shipping-policy") && money(s).some((m) => m.value === 150)) &&
    parts.some((s) => s.includes("/pages/shipping-policy") && money(s).some((m) => m.value === 300));
}
function anchors(markup) {
  return [...markup.matchAll(/<a\b([^>]*)>/g)].map((m) => {
    const attrs = Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], a[2].replaceAll("&amp;", "&")]));
    return { ...attrs, rel: (attrs.rel ?? "").split(/\s+/) };
  });
}
function exported(module, predicate) {
  let value = module;
  for (let i = 0; i < 4; i += 1) {
    if (predicate(value)) return value;
    value = value?.default;
  }
  throw new Error("Expected TypeScript export is missing");
}
function readingEstimate(blocks) {
  // Mirrors estimateReadingMinutes in admin-articles.ts without importing its
  // server-only/database dependencies. Labels count; asset/link fields do not.
  const skipKeys = new Set(["url", "href", "src", "alt", "credit", "id", "image"]);
  const visit = (node) => {
    if (typeof node === "string") return node.split(/\s+/).filter(Boolean).length;
    if (Array.isArray(node)) return node.reduce((sum, item) => sum + visit(item), 0);
    if (node && typeof node === "object") return Object.entries(node).reduce((sum, [key, item]) => sum + (skipKeys.has(key) ? 0 : visit(item)), 0);
    return 0;
  };
  const words = visit(blocks);
  return { words, minutes: Math.max(1, Math.min(600, Math.round(words / 200))) };
}
function sectionAt(blocks, index) {
  if (index < 0) return [];
  const next = blocks.findIndex((b, i) => i > index && b.type === "heading" && b.level === 2);
  return blocks.slice(index + 1, next < 0 ? undefined : next);
}
function forbiddenSchema(value) {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, item]) => key === "aggregateRating" || key === "review" ||
    (key === "@type" && [item].flat().some((type) => /^(?:Product|Review|AggregateRating)$/i.test(String(type)))) || forbiddenSchema(item));
}

async function main() {
  const draftPath = path.join(ROOT, "content/drafts/best-cmy-cubes.json");
  const ledgerPath = path.join(ROOT, "content/drafts/cmy-cubes-claim-ledger.md");
  check("draft and claim ledger exist", existsSync(draftPath) && existsSync(ledgerPath));
  if (!existsSync(draftPath) || !existsSync(ledgerPath)) return;
  const draft = JSON.parse(readFileSync(draftPath, "utf8"));
  const ledger = readFileSync(ledgerPath, "utf8");
  const blocks = Array.isArray(draft.blocks) ? draft.blocks : [];
  const allStrings = stringsIn(draft);
  const bodyStrings = stringsIn(blocks);
  const bodyText = bodyStrings.map((s) => s.text).join("\n");
  const editorialText = [draft.title, draft.deck, draft.tldr, ...bodyStrings.map((s) => s.text)].join("\n");
  const picks = blocks.filter((b) => b.type === "pick");
  const tables = blocks.filter((b) => b.type === "table");
  const sources = blocks.filter((b) => b.type === "sources").flatMap((b) => b.items ?? []);
  const proseBlocks = blocks.filter((b) => ["paragraph", "list", "callout", "faq"].includes(b.type));
  const proseStrings = proseBlocks.flatMap((b) => stringsIn(b).filter((s) => !s.location.endsWith(".type") && !s.location.endsWith(".variant")));

  // Metadata and the actual production Zod boundary, not a regex approximation.
  check("roundup metadata: slug/category/isDemo", draft.type === "roundup" && draft.slug === "best-cmy-cubes" && draft.categoryId === "tech" && draft.isDemo === false);
  check("required four tags, no duplicates", Array.isArray(draft.tags) && isDeepStrictEqual([...draft.tags].sort(), ["CMY Cubes", "Desk toys", "Optical art", "STEM gifts"].sort()));
  check("title meets metadata 70 and editorial 60 character limits", typeof draft.title === "string" && draft.title.length > 0 && draft.title.length <= 60, `${draft.title?.length ?? 0} characters`);
  check("deck is 130–155 characters", typeof draft.deck === "string" && draft.deck.length >= 130 && draft.deck.length <= 155, `${draft.deck?.length ?? 0} characters`);
  check("TL;DR and reading time present", typeof draft.tldr === "string" && draft.tldr.length > 80 && Number.isInteger(draft.readingMinutes) && draft.readingMinutes > 0);
  const reading = readingEstimate(blocks);
  check("readingMinutes matches the repo's 200-wpm estimate and 12–14 minute brief", draft.readingMinutes === reading.minutes && reading.minutes >= 12 && reading.minutes <= 14, `${reading.words} block words / 200 → ${reading.minutes} minutes`);
  const sectionPatterns = [
    /short version|at a glance|quick (?:answer|summary)/i,
    /buyer.*checklist|buying checklist|what to check/i,
    /(?:five|5).*picks|our picks/i,
    /compar(?:e|ison)/i,
    /cyan|subtractive|color mixing/i,
    /acrylic|care|stand fit/i,
    /how we (?:chose|choose)|selection (?:method|process)/i,
    /before you buy|shipping.*returns|store policies/i,
    /frequently asked|questions|FAQ/i,
  ];
  const sectionIndices = sectionPatterns.map((pattern) => blocks.findIndex((b) => b.type === "heading" && b.level === 2 && pattern.test(b.text ?? "")));
  check("required H2 sections exist in logical reader order", sectionIndices.every((index, i) => index >= 0 && (i === 0 || index > sectionIndices[i - 1])));
  check("opening warning states research limits before the introduction", blocks[0]?.type === "callout" && blocks[0].variant === "warning" && /documented research/i.test(blocks[0].text ?? "") && /did not test/i.test(blocks[0].text ?? ""));
  const checklist = sectionAt(blocks, sectionIndices[1]).find((b) => b.type === "list");
  check("buyer checklist is a real list covering size, geometry, material, stand and recipient", !!checklist && checklist.items.length >= 5 && [/size/i, /geometry|shape/i, /material/i, /stand/i, /recipient|age/i].every((pattern) => checklist.items.some((item) => pattern.test(item))));
  check("both science and care deep dives retain explanatory paragraphs", [4, 5].every((i) => sectionAt(blocks, sectionIndices[i]).filter((b) => b.type === "paragraph" && b.text?.length >= 150).length >= 2));
  const faqBlocks = blocks.filter((b) => b.type === "faq");
  check("one FAQ with six or seven questions follows the links disclosure", faqBlocks.length === 1 && faqBlocks[0].items?.length >= 6 && faqBlocks[0].items.length <= 7 && blocks.some((b, i) => i < blocks.indexOf(faqBlocks[0]) && b.type === "callout" && b.variant === "note" && /about.*links|affiliate|referral/i.test(`${b.title ?? ""} ${b.text ?? ""}`)));
  check("only supported block types", blocks.length > 0 && blocks.every((b) => b && SUPPORTED.has(b.type)));
  check("draft needs no DB-backed embeds or offer lookup", blocks.every((b) => !["comparisonEmbed", "offerEmbed"].includes(b.type) && !b.offerId));
  const { tsImport } = await import("tsx/esm/api");
  const schema = exported(await tsImport("../src/lib/content-schema.ts", import.meta.url), (m) => typeof m?.serializeBlocks === "function");
  try {
    const serialized = schema.serializeBlocks(blocks);
    const parsed = schema.parseBlocks(serialized);
    check("actual serializeBlocks/parseBlocks roundtrip retains every block", parsed.length === blocks.length && isDeepStrictEqual(parsed, blocks) && schema.serializeBlocks(parsed) === serialized, `${parsed.length}/${blocks.length} blocks`);
  } catch (error) {
    check("actual serializeBlocks/parseBlocks validation", false, error.message);
  }
  const valid = { type: "paragraph", text: "Schema positive control." };
  const invalid = { type: "pick", rank: 0, name: "Invalid control", blurb: "Invalid rank." };
  let rejected = false;
  try { schema.serializeBlocks([invalid]); } catch { rejected = true; }
  check("schema controls reject invalid pick and drop only invalid blocks", rejected && isDeepStrictEqual(schema.parseBlocks(JSON.stringify([valid, invalid])), [valid]) && schema.parseBlocks("not JSON").length === 0);

  // Navigation is checked recursively before schema stripping. Images are media,
  // not affiliate navigation, and deliberately do not need a referral parameter.
  const goodRefs = [STORE, "https://cmycubes.com/pages/faq?currency=USD&ref=duyan", "https://www.cmycubes.com/products/the-aether?ref=duyan&currency=USD"];
  const badRefs = [
    "https://www.cmycubes.com/?Ref=duyan", "https://www.cmycubes.com/?ref=Duyan", "https://www.cmycubes.com/",
    "https://www.cmycubes.com/?ref=duyanx", "https://www.cmycubes.com/?next=ref=duyan", "https://www.cmycubes.com/#ref=duyan",
    "https://www.cmycubes.com/?ref=duyan&Ref=duyan", "https://www.cmycubes.com/?ref=duyan&ref=duyan",
    "https://www.cmycubes.com/?%72ef=duyan", "https://cmycubes.com.evil.example/?ref=duyan", "not a URL",
  ];
  check("URL parser controls: exact referral accepted; Ref/Duyan/missing/duyanx and spoofing rejected", goodRefs.every(isExactReferral) && badRefs.every((u) => !isExactReferral(u)));
  const imageControl = "https://www.cmycubes.com/cdn/shop/products/control.jpg?v=1762482606&width=240";
  check("recursive URL controls include hidden fields and exempt only images", navigationProblems({ hidden: { next: badRefs[0] } }).length === 1 && navigationProblems({ hidden: "https://www.cmycubes.com" }).length === 1 && navigationProblems({ hidden: "https://www.cmycubes.com.evil.example/path?ref=duyan" }).length === 1 && navigationProblems({ imageUrl: imageControl }).length === 0 && navigationProblems({ imageUrl: badRefs[2] }).length === 1);
  const badNavigation = navigationProblems(draft);
  check("all CMY navigation, including hidden fields, uses exact ref=duyan", badNavigation.length === 0, badNavigation.slice(0, 3).join(" | "));
  check("zero raw cmycubes.com in paragraph/list/callout/FAQ prose", proseStrings.every((s) => !/cmycubes\.com/i.test(s.text)));
  check("no VND/₫ or six-digit price leakage (image versions exempt)", allStrings.every((s) => !priceLeak(s.text)));
  check("price-leak controls catch currency and large amounts, not image versions", ["VND 500", "₫500", "$999999", "$999,999"].every(priceLeak) && !priceLeak(imageControl) && !priceLeak("USD $27.96; checked 2026-11-26"));

  check("five picks ranked 1..5 in display order with exact selected names", picks.length === 5 && picks.every((p, i) => p.rank === i + 1 && p.name === PICKS[i]?.name));
  check("five distinct nonempty editorial purposes", picks.every((p) => typeof p.badge === "string" && p.badge.trim().length > 5) && new Set(picks.map((p) => p.badge?.trim().toLowerCase())).size === 5);
  check("pick URLs use the approved storefront (no unverified deep-link tracking)", picks.length === 5 && picks.every((p) => p.url === STORE));
  check("all five thumbs are official www CDN images at width=240", picks.length === 5 && picks.every((p) => {
    const u = parseUrl(p.imageUrl);
    return isCmyImage(p.imageUrl) && u.searchParams.getAll("width").join() === "240" && ![...u.searchParams.keys()].some((key) => key.toLowerCase() === "ref");
  }));
  for (const [i, expected] of PICKS.entries()) {
    const errors = scopedPrices(picks[i]?.blurb ?? "", expected.variants);
    check(`${expected.name}: rendered vs JSON prices and variant scopes`, errors.length === 0, errors.join("; "));
  }
  check("price-scope controls reject swapped variants and JSON/display confusion", scopedPrices("Mini 30mm, Original 50mm, Mega 95mm. Displayed prices $18.36, $27.96 and $63.96 respectively; Shopify JSON $22.95, $34.95 and $79.95.", PICKS[0].variants).length === 0 && scopedPrices("Mini 30mm, Original 50mm, Mega 95mm. Displayed prices $27.96, $18.36 and $63.96 respectively; Shopify JSON $22.95, $34.95 and $79.95.", PICKS[0].variants).length > 0 && scopedPrices("Displayed $59.95; Shopify JSON $47.96.", PICKS[3].variants).length > 0);
  const pack = picks[4]?.blurb ?? "";
  const packCaveat = (text) => /(?:rendered[^.!?;]{0,60}(?:not captured|not verified|unverified)|(?:no|not)[^.!?;]{0,35}(?:captured|verified)[^.!?;]{0,30}rendered)/i.test(text);
  check("pack JSON-only exception and checkout confirmation explicit", packCaveat(pack) && /confirm[^.!?;]{0,80}checkout/i.test(pack) && /JSON/i.test(pack) && !/\$46\.36\b/.test(editorialText));
  check("TL;DR price scope matches the selected sizes, with pack exception", equalAmounts(money(draft.tldr).map((m) => m.value), [27.96, 35.96, 47.96, 57.95]) && /50\s*mm/i.test(draft.tldr) && /Original size/i.test(draft.tldr) && packCaveat(draft.tldr) && /JSON/.test(draft.tldr));
  const allowedPrices = [...PICKS.flatMap((p) => Object.values(p.variants).flat().filter((n) => n !== null)), 10, 85, 19, 150, 300, 649.99].map(cents);
  check("every dollar amount is in the dated product/policy evidence", money(editorialText).every((m) => allowedPrices.includes(cents(m.value))));

  const cube = picks[0]?.blurb ?? "";
  check("cube dimensions are Mini 30mm / Original 50mm / Mega 95mm, never 80mm", /30\s*mm/i.test(cube) && /50\s*mm/i.test(cube) && /95\s*mm/i.test(cube) && !/\b80\s*mm\b/i.test(editorialText));
  const aether = picks[1]?.blurb ?? "";
  const mundus = picks[2]?.blurb ?? "";
  check("Aether has eight triangular faces and its own size guide axes", /octahedron/i.test(aether) && /eight triangular faces|8 triangular faces/i.test(aether) && /65mm tip-to-tip/i.test(aether) && /47mm edges?/i.test(aether) && /40mm tip-to-tip/i.test(aether) && /29mm edges?/i.test(aether) && !/\b(?:30|50)mm (?:edges?|tip-to-tip)/i.test(aether));
  check("Mundus has twelve pentagonal faces and axis-specific dimensions", /dodecahedron/i.test(mundus) && /twelve pentagonal faces|12 pentagonal faces/i.test(mundus) && /50mm high/i.test(mundus) && /58mm across/i.test(mundus) && /23mm edges?/i.test(mundus) && /30mm high/i.test(mundus) && /33mm across/i.test(mundus) && /13mm edges?/i.test(mundus));
  const puzzle = picks[3]?.blurb ?? "";
  check("Monochromatica: 500 lenticular pieces, four monochrome states, no borrowed diameter", /500[ -](?:lenticular |monochrome |lenticular monochrome )*pieces/i.test(puzzle) && /four (?:visual|monochrome|monochrome visual) states/i.test(puzzle) && /monochrome/i.test(puzzle) && !/58\s*cm|23[ -]?(?:inch|in\b)|23[″"]/i.test(puzzle));
  check("solid acrylic is scoped to the cube, not all SKUs", proseStrings.some((s) => /CMY Cube[^.!?]{0,50}solid acrylic|solid acrylic[^.!?]{0,50}CMY Cube/i.test(s.text)) && /not establish the material|not assume the puzzle has the cube's construction/i.test(bodyText));
  check("care is dry microfiber, no water/sprays/chemical cleaners", proseStrings.some((s) => /dry microfib(?:er|re)/i.test(s.text) && /(?:no|avoid) water/i.test(s.text) && /chemical cleaners/i.test(s.text)));
  const wetCare = affirmativeHits(editorialText, [/(?:wash|rinse|clean|wipe)\s+(?:the\s+)?cube\s+(?:with|in|under)\s+(?:warm\s+)?(?:water|soap|cleaner)/]);
  check("no affirmative wet-cleaning or waterproof/unbreakable claims", wetCare.length === 0 && affirmativeHits(editorialText, [/\bwaterproof\b/, /\bunbreakable\b/, /\bmoisture-proof\b/]).length === 0);
  const firstHandPatterns = [/\b(?:we|I|Duyan|our team)\s+(?:personally\s+|actually\s+)?(?:tested|handled|bought|measured|experienced|used|ordered|assembled|tried)\b/, /\bin our (?:tests|testing|lab)\b/, /\bour (?:benchmark|hands-on testing|test results)\b/];
  const firstHandHits = affirmativeHits(editorialText, firstHandPatterns);
  check("no affirmative first-hand testing/handling claims", firstHandHits.length === 0, firstHandHits.join(" | "));
  check("bounded documented research and did-not-test wording", /documented research/i.test(bodyText) && /\bdid not test\b/i.test(bodyText));
  const unsupportedClaims = [/\b(?:safe|suitable|perfect|recommended)\s+for\s+(?:all ages|any age|children of all ages)\b/, /\bfor all ages\b/, /\b(?:treat|cure|relieve|reduce|lower|ease)\s+(?:anxiety|ADHD|stress|medical conditions)\b/, /\b(?:improve|boost|increase)\s+(?:focus|concentration|learning outcomes)\b/, /\bclinically proven\b/];
  check("no unsupported all-ages, health or measured learning claims", affirmativeHits(editorialText, unsupportedClaims).length === 0);
  check("claim detector controls allow bounded negatives, reject affirmative tests/therapy", affirmativeHits("We did not test these cubes. We measured neither colors nor learning. We reviewed no independent evidence that they treat anxiety. Did we test these cubes?", [...firstHandPatterns, ...unsupportedClaims]).length === 0 && affirmativeHits("We tested these cubes. They treat anxiety. Safe for all ages.", [...firstHandPatterns, ...unsupportedClaims]).length >= 3);
  check("no unqualified overall winner in TL;DR", !/best overall|overall winner|wins overall/i.test(draft.tldr));

  check("one dated comparison table with five rows and at most five columns", tables.length === 1 && tables[0].head.length <= 5 && tables[0].rows.length === 5 && tables[0].rows.every((row) => row.length === tables[0].head.length) && [CHECK_DATE, HUMAN_DATE].some((d) => tables[0].caption?.includes(d)));
  for (const expected of PICKS) {
    const rows = tables.flatMap((t) => t.rows ?? []).filter((row) => expected.row.test(row[0] ?? ""));
    const rowText = rows[0]?.join("; ") ?? "";
    check(`${expected.name}: comparison row price/source parity`, rows.length === 1 && equalAmounts(money(rowText).map((m) => m.value), [expected.price]) && (expected === PICKS[4] ? /JSON/i.test(rowText) && packCaveat(rowText) && /confirm checkout/i.test(rowText) : /displayed/i.test(rowText)));
  }
  check("at least ten distinct official sources, all dated November 26, 2026", sources.length >= 10 && new Set(sources.map((s) => s.url)).size === sources.length && sources.every((s) => s.label?.includes(HUMAN_DATE) && isExactReferral(s.url) && !isCmyImage(s.url)));
  const sourcePaths = sources.map((s) => parseUrl(s.url)?.pathname);
  const requiredPaths = [...PICKS.map((p) => `/products/${p.handle}`), "/pages/faq", "/pages/the-science", "/policies/shipping-policy", "/pages/shipping-policy", "/policies/refund-policy", "/blogs/cmycubes/what-are-cmy-cubes-made-of-a-peek-inside-the-colorful-creation"];
  check("sources cover each product plus science, materials, care and conflicting policies", requiredPaths.every((required) => sourcePaths.includes(required)));
  check("US Fast discrepancy is attributed: /policies $150 vs /pages $300", proseStrings.some((s) => shippingAttribution(s.text)) && /(?:conflict|disagree|discrepancy)/i.test(bodyText) && /confirm[^.!?]{0,90}checkout/i.test(bodyText));
  check("shipping attribution control rejects reversed thresholds", shippingAttribution("/policies/shipping-policy says $150; /pages/shipping-policy says $300.") && !shippingAttribution("/policies/shipping-policy says $300; /pages/shipping-policy says $150."));
  const firstPickIndex = blocks.findIndex((b) => b.type === "pick");
  check("affiliate disclosure precedes the first merchant CTA", blocks.some((b, i) => i < firstPickIndex && b.type === "callout" && /affiliate|referral/i.test(b.text ?? "") && /commission/i.test(b.text ?? "")));
  check("displayed-store-price wording and price-change caveat", /displayed (?:USD |CMY Cubes )?store price/i.test(bodyText) && /prices?[^.!?]{0,80}(?:can|may) change|(?:prices?|promotions)[^.!?]{0,60}change/i.test(editorialText));
  check('zero banned "list price" phrase', !/\blist price\b/i.test(editorialText));
  check("no unconditional affiliate price guarantee; merchant controls checkout", affiliateGuarantees(bodyText).length === 0 && /CMY Cubes sets the prices shown at checkout/i.test(bodyText) && /we do not control them/i.test(bodyText));
  const unsafeGuarantees = ["A referral code does not change the store's listed price.", "Using a referral link never changes prices.", "At no extra cost to you.", "The price you pay is the same."];
  const safeGuarantees = ["Do the referral links guarantee the same price or free shipping?", "No price guarantee is made here.", "We do not promise the price you pay is the same.", "CMY Cubes sets checkout prices, which can change."];
  check("affiliate guarantee controls reject old promises, allow questions and explicit denials", unsafeGuarantees.every((text) => affiliateGuarantees(text).length > 0) && safeGuarantees.every((text) => affiliateGuarantees(text).length === 0));

  // Render the actual inline/affiliate components offline. ArticleRenderer itself
  // imports db, so its sources branch is pinned below without importing it.
  const affiliate = exported(await tsImport("../src/components/affiliate/affiliate-link.tsx", import.meta.url), (m) => typeof m?.isReferralUrl === "function");
  const inline = exported(await tsImport("../src/components/editorial/inline-text.tsx", import.meta.url), (m) => typeof m?.InlineText === "function");
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  check("actual isReferralUrl helper: commercial positive/noncommercial negative controls", affiliate.isReferralUrl(STORE) && !affiliate.isReferralUrl("https://www.cmycubes.com/pages/faq") && !affiliate.isReferralUrl(badRefs[0]) && !affiliate.isReferralUrl("not a URL"));
  const inlineMarkup = renderToStaticMarkup(createElement(inline.InlineText, { text: `[Commercial](${STORE}) [Ordinary](https://example.com/research)` }));
  const inlineAnchors = anchors(inlineMarkup);
  check("actual inline renderer sponsors referrals, not ordinary citations", inlineAnchors.length === 2 && inlineAnchors[0].href === STORE && inlineAnchors[0].rel.includes("sponsored") && inlineAnchors[0].rel.includes("noopener") && inlineAnchors[0].target === "_blank" && !inlineAnchors[1].rel.includes("sponsored") && inlineAnchors[1].rel.includes("nofollow"));
  const cta = anchors(renderToStaticMarkup(createElement(affiliate.DirectAffiliateButton, { url: STORE }, "Visit merchant store")));
  check("actual direct merchant CTA is sponsored/noopener and opens a new tab", cta.length === 1 && cta[0].href === STORE && cta[0].rel.includes("sponsored") && cta[0].rel.includes("noopener") && cta[0].target === "_blank");
  const proseMarkup = proseStrings.map((s) => renderToStaticMarkup(createElement(inline.InlineText, { text: s.text }))).join("");
  const internalLinks = new Set(anchors(proseMarkup).map((a) => a.href));
  check("all five required internal links actually render", ["/methodology", "/affiliate-disclosure", "/tech", "/best", "/best/best-phomemo-printers"].every((href) => internalLinks.has(href)));
  const articleRenderer = textFile("src/components/editorial/article-renderer.tsx");
  const sourcesBranch = articleRenderer.slice(articleRenderer.indexOf('case "sources":'), articleRenderer.indexOf('case "divider":'));
  check("sources renderer retains actual referral helper and sponsored rel branch", /href=\{s\.url\}/.test(sourcesBranch) && /rel=\{isReferralUrl\(s\.url\)\s*\?\s*"sponsored noopener"\s*:\s*"noopener nofollow"\}/.test(sourcesBranch) && /target="_blank"/.test(sourcesBranch));
  const bestPage = textFile("src/app/best/[slug]/page.tsx");
  check("best page retains duplicate-destination ItemList guard", /new Set\(items\.map\(\(i\) => i\.url\)\)/.test(bestPage) && /distinct\.size === items\.length && items\.length > 0\s*\?\s*\[itemListJsonLd\(article\.title, items\)\]\s*:\s*\[\]/.test(bestPage));
  check("draft uses duplicate storefront destinations, so ItemList remains suppressed", picks.length === 5 && new Set(picks.map((p) => p.url)).size === 1);
  check("no Product/Review/aggregateRating schema additions", !forbiddenSchema(draft) && !/aggregateRating|\b(?:productJsonLd|reviewJsonLd)\s*\(|["']@type["']\s*:\s*["'](?:Product|Review)["']/i.test(bestPage));
  check("schema prohibition controls detect Product/Review/aggregateRating", forbiddenSchema({ nested: { "@type": "Product" } }) && forbiddenSchema({ "@type": "Review" }) && forbiddenSchema({ aggregateRating: {} }) && !forbiddenSchema({ "@type": "Article" }));

  const config = exported(await tsImport("../next.config.ts", import.meta.url), (m) => !!m?.images);
  const patterns = config.images.remotePatterns ?? [];
  const cmyPatterns = patterns.filter((p) => /cmycubes/i.test(p.hostname ?? ""));
  const expectedPaths = ["/cdn/shop/files/**", "/cdn/shop/products/**"];
  check("actual next.config has exactly two narrow www.cmycubes.com CDN entries", cmyPatterns.length === 2 && isDeepStrictEqual(cmyPatterns.map((p) => p.pathname).sort(), expectedPaths.sort()) && cmyPatterns.every((p) => p.protocol === "https" && p.hostname === "www.cmycubes.com" && (!p.port || p.port === "")) && !(config.images.domains ?? []).some((h) => /cmycubes/i.test(h)));
  check("no unrestricted wildcard remote host bypasses the narrow CMY rules", patterns.every((p) => p.hostname && !["*", "**"].includes(p.hostname)));

  check("hero metadata exactly matches the local three-product composite", draft.heroImage === HERO && draft.heroAlt === HERO_ALT && draft.heroCredit === HERO_CREDIT);
  const heroPath = path.join(ROOT, "public", HERO);
  check("hero JPEG file exists", existsSync(heroPath));
  if (existsSync(heroPath)) {
    const bytes = readFileSync(heroPath);
    check("hero JPEG starts FF D8 FF and is at most 200 KiB", bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff && bytes.length <= 200 * 1024, `${bytes.length} bytes`);
    const { default: sharp } = await import("sharp");
    const meta = await sharp(bytes).metadata();
    check("actual hero dimensions are 1600×1000 JPEG", meta.format === "jpeg" && meta.width === 1600 && meta.height === 1000, `${meta.format} ${meta.width}×${meta.height}`);
    const manifest = JSON.parse(textFile("public/images/.media-manifest.json"));
    check("media manifest matches the actual hero dimensions", manifest[HERO]?.width === meta.width && manifest[HERO]?.height === meta.height);
  }
  check("hero is not duplicated as a body image", blocks.filter((b) => b.type === "image").every((b) => b.src !== HERO));

  check("ledger dates are exact in human and ISO forms", ledger.includes(HUMAN_DATE) && ledger.includes(CHECK_DATE));
  check("ledger records owner-reported approved Store ID 133964 and authorization", /Store ID\s*\*{0,2}133964\*{0,2}/i.test(ledger) && /approved/i.test(ledger) && /OWNER-REPORTED AUTHORIZATION/.test(ledger) && /cropping, editing and compositing/i.test(ledger) && /No written license/i.test(ledger));
  check("ledger hero provenance matches shipped alt, credit and three-only scope", ledger.includes(HERO) && ledger.includes(HERO_ALT) && ledger.includes(HERO_CREDIT) && /The Original Cube, The Aether and The Mundus only/.test(ledger));
  const ledgerRows = ledger.split(/\r?\n/).filter((line) => line.startsWith("| ") && !line.startsWith("| Pick"));
  for (const expected of PICKS) {
    const rows = ledgerRows.filter((line) => expected.row.test(line.split("|")[1] ?? ""));
    const pairs = Object.entries(expected.variants);
    const correct = rows.length === pairs.length && pairs.every(([variant, amounts]) => {
      const row = rows.find((line) => variant === "default" || new RegExp(`\\b${variant}\\b`, "i").test(line.split("|")[1] ?? ""));
      if (!row) return false;
      const cells = row.split("|").map((cell) => cell.trim());
      const displayed = money(cells[2]).map((m) => m.value);
      const json = money(cells[3]).map((m) => m.value);
      return equalAmounts(displayed, amounts[0] === null ? [] : [amounts[0]]) && equalAmounts(json, [amounts[1]]) &&
        (amounts[0] !== null || /(?:not captured|empty)/i.test(cells[2]));
    });
    check(`${expected.name}: ledger price parity`, correct);
  }
  check("ledger preserves pack empty rendered evidence and non-checkout JSON caveat", /price:\s*\[\]/.test(ledger) && /\$57\.95/.test(ledger) && /NOT an independently observed|not captured/i.test(ledger) && /confirm checkout|checked at checkout/i.test(ledger));
  check("ledger includes scoped acrylic, dry care and both shipping thresholds", /solid acrylic/i.test(ledger) && /dry microfiber/i.test(ledger) && /Avoid water/i.test(ledger) && shippingAttribution(ledger));
}

try {
  await main();
} catch (error) {
  check("gate execution completed", false, error instanceof Error ? error.message : String(error));
}
console.log(failures === 0 ? `\nAll ${checks} CMY Cubes draft integrity checks passed.` : `\n${failures} of ${checks} CMY Cubes check(s) FAILED.`);
process.exitCode = failures === 0 ? 0 : 1;
