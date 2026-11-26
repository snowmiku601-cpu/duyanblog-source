/**
 * Offline ProtoArc local-draft gate, modeled on CMY Cubes and Phomemo gates.
 * Imports the real schema, image config and commercial-link components.
 * No network, database, environment files, or product/policy research.
 *   node scripts/test-article-draft-best-protoarc-ergonomic-gear.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

const ROOT = process.cwd();
const DATE = "2026-11-26";
const HUMAN_DATE = "November 26, 2026";
const STORE = "https://www.protoarc.com/?ref=bftbqwpp";
const HERO = "/images/articles/best-protoarc-ergonomic-gear/hero-protoarc-composite.jpg";
const ALT = "ProtoArc EM11 NL, EK01 Plus, EM01 NL and EC200 on a warm paper background";
const CREDIT = "ProtoArc (protoarc.com); composite arrangement by Duyan Blog";
const PICKS = [
  { model: "EM11 NL", name: "ProtoArc EM11 NL Ergonomic Vertical Mouse", handle: "em11-nl-vertical-mouse", color: "Black", sku: "CP014943", price: "20.99", job: /vertical/i, image: "em11-nl-vertical-mouse.webp?v=1767583425&width=240" },
  { model: "EK01 Plus", name: "ProtoArc EK01 Plus Backlit Ergonomic Keyboard", handle: "ek01-plus-ergonomic-split-keyboard", color: "Black", sku: "CP015755", price: "59.49", job: /split.*typing/i, image: "3_73991b88-a596-4009-ba01-b1e05595f8ae.jpg?v=1767779771&width=240" },
  { model: "XK01", name: "ProtoArc XK01 Foldable Keyboard", handle: "xk01-tri-fold-bluetooth-keyboard", color: "Black", sku: "CP011803", price: "35.99", job: /travel.*typing/i, image: "xk01-keyboard-black.webp?v=1767585717&width=240" },
  { model: "EM01 NL", name: "ProtoArc EM01 NL Trackball Ergonomic Mouse", handle: "em01-nl-trackball-mouse", color: "Gray", sku: "CP014935", price: "34.99", job: /stationary.*thumb/i, image: "em01-nl-trackball-mouse-01.webp?v=1767583350&width=240" },
  { model: "EC200", name: "ProtoArc EC200 Ergonomic Office Chair", handle: "ec200-ergonomic-mesh-office-chair", color: "Black", sku: "CP016352", price: "169.99", job: /seating/i, image: "3_88939ad0-c32d-4fcf-bacf-12934e327277.jpg?v=1770956719&width=240" },
];
const INTERNAL = ["/methodology", "/affiliate-disclosure", "/best/best-phomemo-printers", "/best/best-fanttik-tools", "/guides/how-much-esim-data-do-i-need"];
const SUPPORTED = new Set(["paragraph", "heading", "list", "quote", "callout", "prosCons", "stats", "table", "image", "pick", "comparisonEmbed", "offerEmbed", "faq", "sources", "divider"]);
let checks = 0;
let failures = 0;
function check(name, ok, detail = "") {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}
const textFile = (file) => readFileSync(path.join(ROOT, file), "utf8");
function strings(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  return value && typeof value === "object" ? Object.values(value).flatMap(strings) : [];
}
function url(value) { try { return new URL(value); } catch { return null; } }
function exactRef(value) {
  const u = url(value);
  if (!u || u.protocol !== "https:" || !["protoarc.com", "www.protoarc.com"].includes(u.hostname) || u.username || u.password || u.port) return false;
  const refs = [...u.searchParams].filter(([key]) => key.toLowerCase() === "ref");
  return refs.length === 1 && refs[0][0] === "ref" && refs[0][1] === "bftbqwpp" &&
    u.search.slice(1).split("&").filter((part) => part === "ref=bftbqwpp").length === 1;
}
function officialImage(value) {
  const u = url(value);
  return !!u && u.protocol === "https:" && u.hostname === "www.protoarc.com" && !u.username && !u.password && !u.port &&
    /^\/cdn\/shop\/files\/.+\.(?:jpe?g|png|webp|avif)$/i.test(u.pathname);
}
function merchantUrls(text) {
  const absolute = /(?:https?:)?\/\/[^\s<>"'`)\]]+/gi;
  const found = [...text.matchAll(absolute)].map((m) => m[0]).filter((s) => /protoarc\.com/i.test(s));
  const bare = /(?:[a-z0-9-]+\.)*protoarc\.com(?::\d+)?[/?#][^\s<>"'`)\]]*/gi;
  found.push(...[...text.replace(absolute, "").matchAll(bare)].map((m) => m[0]));
  return found.map((s) => s.replace(/[.,;!]+$/, ""));
}
const navigationProblems = (value) => strings(value).flatMap(merchantUrls).filter((u) => !officialImage(u) && !exactRef(u));
function usSelection(picks) {
  return picks.length === 5 && picks.every((p, i) => p.name === PICKS[i].name && !/\b(?:UK|DE|FR|ES|IT|AZERTY|QWERTZ|EM06)\b/.test(p.name));
}
function affirmativeHits(text, patterns) {
  return text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter((s) => !s.endsWith("?")).flatMap((sentence) => patterns.flatMap((pattern) =>
    [...sentence.matchAll(new RegExp(pattern.source, "gi"))].filter((m) => {
      const clausePrefix = sentence.slice(0, m.index).split(/[,;:]|\b(?:but|however|yet)\b/i).at(-1) ?? "";
      const immediatePrefix = clausePrefix.slice(-36);
      const suffix = sentence.slice(m.index + m[0].length);
      return !/\b(?:no|not|nor|never|without|unverified|unproven|cannot|can't|didn't|haven't)\b/i.test(immediatePrefix) && !/^\s*(?:neither|no|nothing)\b/i.test(suffix);
    }).map((m) => m[0])));
}
const FIRSTHAND = [/\b(?:we|I|Duyan|our team)\s+(?:personally\s+|actually\s+)?(?:tested|handled|bought|measured|experienced|used|ordered|assembled|tried)\b/, /\bin our (?:tests|testing|lab)\b/, /\bour (?:benchmark|hands-on testing|test results)\b/];
const MEDICAL = [/\b(?:cure|treat|prevent|heal|relieve|eliminate|reduce)s?\s+(?:(?:your|wrist|back|neck|hand|chronic)\s+)*(?:pain|strain|carpal tunnel|injury|injuries|arthritis|fatigue)\b/, /\bclinically proven\b/, /\bguaranteed (?:comfort|pain relief)\b/];
const GUARANTEES = [/\b(?:referral|affiliate)(?: code| links?)?[^.!?;]{0,90}\b(?:does not|do not|doesn't|don't|won't|will not|never) (?:change|affect|increase|raise|alter)s?\b[^.!?;]{0,60}\b(?:price|prices|cost|costs)\b/, /\b(?:at )?no (?:extra|additional) (?:cost|charge)\b/, /\b(?:the )?price (?:you pay )?(?:is|will be|stays|remains) (?:the )?(?:same|unchanged)\b/];
function forbiddenSchema(value) {
  return !!value && typeof value === "object" && Object.entries(value).some(([key, item]) => key === "aggregateRating" || key === "review" ||
    (key === "@type" && [item].flat().some((type) => /^(?:Product|Review|AggregateRating)$/i.test(String(type)))) || forbiddenSchema(item));
}
function exported(module, predicate) {
  let value = module;
  for (let i = 0; i < 4; i += 1) { if (predicate(value)) return value; value = value?.default; }
  throw new Error("Expected TypeScript export missing");
}
function anchors(markup) {
  return [...markup.matchAll(/<a\b([^>]*)>/g)].map((m) => {
    const attrs = Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], a[2].replaceAll("&amp;", "&")]));
    return { ...attrs, rel: (attrs.rel ?? "").split(/\s+/) };
  });
}
function readingEstimate(value) {
  const skip = new Set(["url", "href", "src", "alt", "credit", "id", "image"]);
  const visit = (node) => typeof node === "string" ? node.split(/\s+/).filter(Boolean).length : Array.isArray(node) ? node.reduce((sum, item) => sum + visit(item), 0) : node && typeof node === "object" ? Object.entries(node).reduce((sum, [key, item]) => sum + (skip.has(key) ? 0 : visit(item)), 0) : 0;
  const words = visit(value);
  return { words, minutes: Math.max(1, Math.min(600, Math.round(words / 200))) };
}
async function main() {
  const draftFile = "content/drafts/best-protoarc-ergonomic-gear.json";
  const ledgerFile = "content/drafts/protoarc-claim-ledger.md";
  check("draft and ledger exist", existsSync(draftFile) && existsSync(ledgerFile));
  if (!existsSync(draftFile) || !existsSync(ledgerFile)) return;
  const draft = JSON.parse(textFile(draftFile));
  const ledger = textFile(ledgerFile);
  const blocks = Array.isArray(draft.blocks) ? draft.blocks : [];
  const picks = blocks.filter((b) => b.type === "pick");
  const sources = blocks.filter((b) => b.type === "sources").flatMap((b) => b.items ?? []);
  const prose = strings(blocks.filter((b) => ["paragraph", "list", "callout", "faq"].includes(b.type)));
  const body = strings(blocks).join("\n");
  const editorial = [draft.title, draft.deck, draft.tldr, ...strings(blocks.filter((b) => b.type !== "sources"))].join("\n");
  check("metadata is non-demo roundup/tech and remains unpublished", draft.type === "roundup" && draft.slug === "best-protoarc-ergonomic-gear" && draft.categoryId === "tech" && draft.isDemo === false && draft.status === "draft" && draft.publishedAt === null);
  check("review date exact", draft.lastReviewedAt === `${DATE}T00:00:00.000Z`);
  check("title at most 60 characters", typeof draft.title === "string" && draft.title.length > 0 && draft.title.length <= 60, `${draft.title?.length} characters`);
  check("deck 130–155 characters", draft.deck?.length >= 130 && draft.deck.length <= 155, `${draft.deck?.length} characters`);
  check("TL;DR is concise and not an overall performance winner", draft.tldr?.length >= 80 && draft.tldr.length <= 400 && !/best overall|wins overall|overall winner/i.test(draft.tldr));
  check("four exact tags", isDeepStrictEqual(draft.tags, ["ProtoArc", "Ergonomic keyboard", "Ergonomic mouse", "Home office"]));
  const reading = readingEstimate(blocks);
  check("reading time matches repo 200-wpm estimator", draft.readingMinutes === reading.minutes, `${reading.words} block words / 200 → ${reading.minutes} minutes`);
  check("supported blocks; no DB embeds/offer IDs", blocks.length > 0 && blocks.every((b) => SUPPORTED.has(b.type) && !["comparisonEmbed", "offerEmbed"].includes(b.type) && !b.offerId));
  const { tsImport } = await import("tsx/esm/api");
  const schema = exported(await tsImport("../src/lib/content-schema.ts", import.meta.url), (m) => typeof m?.serializeBlocks === "function");
  try {
    const serialized = schema.serializeBlocks(blocks);
    const parsed = schema.parseBlocks(serialized);
    check("actual serializeBlocks roundtrip retains 100% of blocks and fields", parsed.length === blocks.length && isDeepStrictEqual(parsed, blocks) && schema.serializeBlocks(parsed) === serialized, `${parsed.length}/${blocks.length} blocks`);
  } catch (error) { check("actual serializeBlocks validation", false, error.message); }
  const valid = { type: "paragraph", text: "Schema positive control." };
  const invalid = { type: "pick", rank: 0, name: "Invalid", blurb: "Invalid rank." };
  let rejected = false;
  try { schema.serializeBlocks([invalid]); } catch { rejected = true; }
  check("schema negative controls reject rank zero and preserve only valid block", rejected && isDeepStrictEqual(schema.parseBlocks(JSON.stringify([valid, invalid])), [valid]) && schema.parseBlocks("not JSON").length === 0);

  const goodRefs = [STORE, "https://www.protoarc.com/pages/faq?ref=bftbqwpp", "https://protoarc.com/pages/faq?currency=USD&ref=bftbqwpp"];
  const badRefs = ["https://www.protoarc.com/?Ref=bftbqwpp", "https://www.protoarc.com/?ref=BFTBQWPP", "https://www.protoarc.com/?ref=Bftbqwpp", "https://www.protoarc.com/", "https://www.protoarc.com/?ref=bftbqwppx", "https://www.protoarc.com/?next=ref=bftbqwpp", "https://www.protoarc.com/#ref=bftbqwpp", "https://www.protoarc.com/?%72ef=bftbqwpp", "https://www.protoarc.com/?ref=bftbqwpp&Ref=bftbqwpp", "https://www.protoarc.com/?ref=bftbqwpp&ref=bftbqwpp", "https://protoarc.com.evil.example/?ref=bftbqwpp", "not a URL"];
  check("case-sensitive referral controls reject wrong key/value case and spoofing", goodRefs.every(exactRef) && badRefs.every((u) => !exactRef(u)));
  check("every pick/source URL has literal exact lowercase ref=bftbqwpp", picks.length === 5 && sources.length >= 12 && [...picks, ...sources].every((item) => exactRef(item.url)));
  check("recursive navigation guard rejects hidden bare/raw/spoofed URLs", navigationProblems({ hidden: badRefs[0] }).length === 1 && navigationProblems({ hidden: "protoarc.com/products/raw" }).length === 1 && navigationProblems({ hidden: badRefs[10] }).length === 1 && navigationProblems({ hidden: STORE }).length === 0);
  check("no invalid merchant navigation in any raw draft field", navigationProblems(draft).length === 0);
  check("zero raw protoarc.com links/domains in paragraph/list/callout/FAQ", prose.every((text) => !/protoarc\.com/i.test(text)));
  check("all five CTAs use exact approved storefront front door", picks.length === 5 && picks.every((p) => p.url === STORE));
  check("five exact US selections ranked 1..5", usSelection(picks) && picks.every((p, i) => p.rank === i + 1));
  check("non-US layout and EM06 negative selection controls", !usSelection(picks.map((p, i) => i === 1 ? { ...p, name: `${p.name} UK` } : p)) && !usSelection(picks.map((p, i) => i === 2 ? { ...p, name: "ProtoArc XK01 QWERTZ DE" } : p)) && !usSelection(picks.map((p, i) => i === 0 ? { ...p, name: "ProtoArc EM06 Customizable Finger Trackball Mouse" } : p)));
  check("five distinct ergonomic jobs, not color variants", new Set(picks.map((p) => p.badge)).size === 5 && picks.every((p, i) => PICKS[i].job.test(p.badge ?? "")));
  check("all five exact official CDN thumbnails at width=240", picks.length === 5 && picks.every((p, i) => officialImage(p.imageUrl) && p.imageUrl === `https://www.protoarc.com/cdn/shop/files/${PICKS[i].image}` && url(p.imageUrl).searchParams.getAll("width").join() === "240"));
  check("thumbnail host/path negative controls", !officialImage("https://www.protoarc.com/products/control.jpg?width=240") && !officialImage("https://evil.example/cdn/shop/files/control.jpg?width=240") && officialImage(picks[0].imageUrl));
  for (const [i, expected] of PICKS.entries()) {
    const blurb = picks[i]?.blurb ?? "";
    check(`${expected.model}: dated displayed USD amount/color/stock`, blurb.includes(`$${expected.price} USD`) && blurb.includes(`${expected.color}'s displayed store price`) && blurb.includes(HUMAN_DATE) && /stock available/.test(blurb));
    const row = ledger.split(/\r?\n/).find((line) => line.startsWith(`| ${expected.model} —`));
    const cells = row?.split("|").map((s) => s.trim());
    check(`${expected.model}: exact ledger displayed/JSON price and selected SKU`, cells?.[2] === `$${expected.price}` && cells?.[3] === `$${expected.price}` && cells?.[4]?.includes(expected.sku) && cells?.[5]?.includes("available=true") && cells?.[5]?.includes("mainInStock=true"));
    check(`${expected.model}: source and og-image thumbnail parity`, sources.some((s) => url(s.url)?.pathname === `/products/${expected.handle}`) && ledger.includes(picks[i].imageUrl) && ledger.includes(picks[i].imageUrl.replace("width=240", "width=2048")));
  }
  check("regional layout and sold-out exclusion are explicit", /US QWERTY/.test(body) && /UK, DE, FR, ES and IT/.test(body) && /EM06 was excluded because it was unavailable/.test(body) && /EM06 excluded: sold out/.test(ledger));
  check("EM11 NL retains fit/DPI/battery/Mac limits, not Pro angle", /under 7\.5 inches/.test(picks[0].blurb) && /1000\/1600\/2400 DPI/.test(picks[0].blurb) && /500 mAh/.test(picks[0].blurb) && /112 g/.test(picks[0].blurb) && /138 × 69\.2 × 68\.1 mm/.test(picks[0].blurb) && /not programmable and do not work on macOS/.test(picks[0].blurb) && /did not verify a numeric grip angle/.test(picks[0].blurb));
  check("EK01 Plus remains fixed-chassis split/117 keys/2000mAh/macOS 10.15", /117 keys/.test(picks[1].blurb) && /500 × 265 × 40 mm/.test(picks[1].blurb) && /2000 mAh/.test(picks[1].blurb) && /macOS 10\.15/.test(picks[1].blurb) && /not independently movable halves/.test(picks[1].blurb));
  check("XK01 remains ordinary Bluetooth folding number-pad model", /105 keys/.test(picks[2].blurb) && /Bluetooth 5\.1/.test(picks[2].blurb) && /215\.50 × 119\.70 × 20\.95 mm/.test(picks[2].blurb) && /386\.39 × 119\.70 × 12\.35 mm/.test(picks[2].blurb) && /297\.72 g/.test(picks[2].blurb) && /210 mAh/.test(picks[2].blurb) && /not the XK01 TP/.test(picks[2].blurb));
  check("EM01 NL thumb hinge/DPI/weight/battery retain separate-model caveat", /0 to 20°/.test(picks[3].blurb) && /200\/400\/800\/1200\/1600 DPI/.test(picks[3].blurb) && /181 g/.test(picks[3].blurb) && /900 mAh/.test(picks[3].blurb) && /not the EM05 NL's fixed 62°/.test(picks[3].blurb));
  check("chair fit/foam/adjustment/weight remain scoped", /5'4"–6'0"/.test(picks[4].blurb) && /90–220 lb/.test(picks[4].blurb) && /55D foam/.test(picks[4].blurb) && /1\.97-inch/.test(picks[4].blurb) && /16\.5 kg/.test(picks[4].blurb) && /no numeric seat-height interval/.test(picks[4].blurb));
  check("chair height conflicts not silently resolved or confused with Pro", /46\.75H/.test(body) && /42\.52–45\.67/.test(body) && /neither is floor-to-seat height/.test(body) && /Do not import the EC200 Pro's/.test(body));
  check("connectivity caveats: charging is not data, switching not file transfer", /USB-C charging does not mean wired USB/.test(body) && /does not establish cross-computer file transfer/.test(body) && /not a shared universal receiver/.test(body));

  check("no affirmative invented hands-on or medical cure claims", affirmativeHits(editorial, [...FIRSTHAND, ...MEDICAL]).length === 0);
  check("claim detector controls allow negatives and reject tests/cures", affirmativeHits("We did not test these devices. We measured neither comfort nor speed. No evidence they cure pain. Did we test them?", [...FIRSTHAND, ...MEDICAL]).length === 0 && affirmativeHits("We tested these devices. They cure pain. Clinically proven. Not cheap, they cure pain. No shipping fee, we tested it.", [...FIRSTHAND, ...MEDICAL]).length >= 5);
  check("research disclosure before first CTA", blocks[0]?.type === "callout" && /documented research/.test(blocks[0].text) && /did not test/.test(blocks[0].text) && /commission/.test(blocks[0].text));
  check('zero banned "list price" phrase', !/\blist price\b/i.test(editorial));
  check("no unconditional affiliate-price guarantee; merchant controls checkout", affirmativeHits(editorial, GUARANTEES).length === 0 && /ProtoArc sets the prices shown at checkout/.test(body) && /we do not control them/.test(body));
  check("affiliate guarantee controls reject old promise, allow denial", affirmativeHits("A referral code does not change the store's listed price. At no extra cost to you.", GUARANTEES).length === 2 && affirmativeHits("We do not promise the price you pay is the same. No price guarantee is made.", GUARANTEES).length === 0);
  const words = editorial.split(/\s+/).filter(Boolean).length;
  const dashes = (editorial.match(/—/g) ?? []).length;
  check("em dash density at most two per 500 editorial words", dashes / words * 500 <= 2, `${dashes} em dashes / ${words} words`);
  const tables = blocks.filter((b) => b.type === "table");
  check("one dated five-row table with at most five columns", tables.length === 1 && tables[0].caption.includes(HUMAN_DATE) && tables[0].head.length <= 5 && tables[0].rows.length === 5 && tables[0].rows.every((row, i) => row.length === tables[0].head.length && row[0] === PICKS[i].model && row.at(-1) === `$${PICKS[i].price} ${PICKS[i].color}`));
  check("all sources dated, exact referrals, required policy coverage", sources.every((s) => s.label.includes(HUMAN_DATE) && exactRef(s.url)) && ["/policies/shipping-policy", "/pages/shipping", "/policies/refund-policy", "/pages/warranty-policy", "/pages/faq", "/pages/about-us"].every((p) => sources.some((s) => url(s.url)?.pathname === p)));
  check("shipping discrepancy/oversize costs and refund clocks explicit", /3–5 business days/.test(body) && /2–3 business days/.test(body) && /conflict is unresolved/.test(body) && /oversized products may incur extra fees/.test(body) && /2–3 business days of arrival/.test(body) && /another 1–3 business days/.test(body));
  check("chair/peripheral warranty scope and buyer-paid change of mind", /two years from delivery/.test(body) && /five years/.test(body) && /structural warranty/.test(body) && /change of mind[^.!?]*buyer-paid/i.test(body));

  const affiliate = exported(await tsImport("../src/components/affiliate/affiliate-link.tsx", import.meta.url), (m) => typeof m?.isReferralUrl === "function");
  const inline = exported(await tsImport("../src/components/editorial/inline-text.tsx", import.meta.url), (m) => typeof m?.InlineText === "function");
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  check("actual isReferralUrl commercial/noncommercial regression controls", affiliate.isReferralUrl(STORE) && !affiliate.isReferralUrl("https://www.protoarc.com/pages/faq") && !affiliate.isReferralUrl(badRefs[0]) && !affiliate.isReferralUrl("not a URL"));
  const rendered = anchors(renderToStaticMarkup(createElement(inline.InlineText, { text: `[Commercial](${STORE}) [Ordinary](https://example.com/research)` })));
  check("actual inline renderer sponsors referrals only", rendered.length === 2 && rendered[0].href === STORE && rendered[0].rel.includes("sponsored") && rendered[0].target === "_blank" && !rendered[1].rel.includes("sponsored") && rendered[1].rel.includes("nofollow"));
  const cta = anchors(renderToStaticMarkup(createElement(affiliate.DirectAffiliateButton, { url: STORE }, "Visit merchant store")));
  check("actual direct CTA is sponsored/noopener/new tab", cta.length === 1 && cta[0].href === STORE && cta[0].rel.includes("sponsored") && cta[0].rel.includes("noopener") && cta[0].target === "_blank");
  const proseLinks = new Set(anchors(prose.map((text) => renderToStaticMarkup(createElement(inline.InlineText, { text }))).join("")).map((a) => a.href));
  const internal = [...proseLinks].filter((u) => u.startsWith("/") && !u.startsWith("//"));
  check("at least four verified-live prose links actually render (all five retained)", internal.length >= 4 && INTERNAL.every((href) => internal.includes(href)) && internal.every((href) => INTERNAL.includes(href)), internal.join(", "));
  check("no link to unpublished CMY Cubes draft", !strings(draft).some((s) => s.includes("/best/best-cmy-cubes")));
  check("internal link controls reject unpublished draft route", !INTERNAL.includes("/best/best-cmy-cubes") && INTERNAL.includes("/best/best-phomemo-printers"));
  const renderer = textFile("src/components/editorial/article-renderer.tsx");
  const sourcesBranch = renderer.slice(renderer.indexOf('case "sources":'), renderer.indexOf('case "divider":'));
  check("sources retain actual sponsored referral-helper branch", /href=\{s\.url\}/.test(sourcesBranch) && /rel=\{isReferralUrl\(s\.url\)\s*\?\s*"sponsored noopener"\s*:\s*"noopener nofollow"\}/.test(sourcesBranch));
  const bestPage = textFile("src/app/best/[slug]/page.tsx");
  check("ItemList duplicate-destination guard retained", /new Set\(items\.map\(\(i\) => i\.url\)\)/.test(bestPage) && /distinct\.size === items\.length && items\.length > 0\s*\?\s*\[itemListJsonLd\(article\.title, items\)\]\s*:\s*\[\]/.test(bestPage));
  check("shared storefront means ItemList suppressed, not five fake destinations", picks.length === 5 && new Set(picks.map((p) => p.url)).size === 1);
  check("no Product/Review/aggregateRating additions", !forbiddenSchema(draft) && !/aggregateRating|\b(?:productJsonLd|reviewJsonLd)\s*\(|["']@type["']\s*:\s*["'](?:Product|Review)["']/i.test(bestPage));
  check("schema prohibition negative controls", forbiddenSchema({ nested: { "@type": "Product" } }) && forbiddenSchema({ aggregateRating: {} }) && forbiddenSchema({ "@type": "Review" }) && !forbiddenSchema({ "@type": "Article" }));

  const config = exported(await tsImport("../next.config.ts", import.meta.url), (m) => !!m?.images);
  const patterns = config.images.remotePatterns ?? [];
  const protoarcPatterns = patterns.filter((p) => /protoarc/i.test(p.hostname ?? ""));
  check("exactly one narrow HTTPS www.protoarc.com /cdn/shop/files/** config entry", protoarcPatterns.length === 1 && protoarcPatterns[0].hostname === "www.protoarc.com" && protoarcPatterns[0].protocol === "https" && protoarcPatterns[0].pathname === "/cdn/shop/files/**" && !protoarcPatterns[0].port && !(config.images.domains ?? []).some((h) => /protoarc/i.test(h)));
  check("no wildcard remote host bypass and both Task 60 paths preserved", patterns.every((p) => p.hostname && !["*", "**"].includes(p.hostname)) && ["/cdn/shop/files/**", "/cdn/shop/products/**"].every((pathname) => patterns.some((p) => p.hostname === "www.cmycubes.com" && p.pathname === pathname && p.protocol === "https")));
  check("hero path/alt/credit exactly match four-product composite, no XK01", draft.heroImage === HERO && draft.heroAlt === ALT && draft.heroCredit === CREDIT && !/XK01/.test(draft.heroAlt) && draft.heroAlt.length <= 125);
  const heroPath = path.join(ROOT, "public", HERO);
  check("hero file exists", existsSync(heroPath));
  if (existsSync(heroPath)) {
    const bytes = readFileSync(heroPath);
    check("hero JPEG magic FF D8 FF and <=200000 bytes", bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) && bytes.length <= 200000, `${bytes.length} bytes`);
    const { default: sharp } = await import("sharp");
    const meta = await sharp(bytes).metadata();
    const decoded = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
    check("actual JPEG fully decodes at 1600x1000", meta.format === "jpeg" && meta.width === 1600 && meta.height === 1000 && decoded.info.width === 1600 && decoded.info.height === 1000);
    const manifest = JSON.parse(textFile("public/images/.media-manifest.json"));
    check("media manifest has matching hero dimensions", manifest[HERO]?.width === 1600 && manifest[HERO]?.height === 1000);
  }
  check("hero never duplicated anywhere in body blocks", !strings(blocks).some((s) => s.includes(HERO)));
  check("ledger exact date, approved Store ID and owner-reported permission", ledger.includes(HUMAN_DATE) && ledger.includes(DATE) && /Store ID\s*\*{0,2}7007740\*{0,2}/.test(ledger) && /approved/.test(ledger) && /OWNER-REPORTED AUTHORIZATION/.test(ledger) && /No written\s+license/.test(ledger) && /deep-link[^.]*unverified/is.test(ledger));
  check("ledger hero parity and four-only scope", ledger.includes(HERO) && ledger.includes(ALT) && ledger.includes(CREDIT) && /EM11 NL, EK01 Plus, EM01 NL and EC200\s+only/.test(ledger.replaceAll("**", "")));
  check("ledger includes six policies, fit limits, stock exclusions and DB skip", ["shipping-policy", "/pages/shipping?", "refund-policy", "warranty-policy", "/pages/faq?", "/pages/about-us?", "CP012684", "CP016353", "220 lb", "local_mysql_tcp_reachable=false", "database_target_is_local_duyanblog_dev=false"].every((s) => ledger.includes(s)));
}
try { await main(); } catch (error) { check("gate execution completed", false, error instanceof Error ? error.stack : String(error)); }
console.log(`\n${failures ? `${failures} failure(s) in ${checks} ProtoArc checks.` : `All ${checks} ProtoArc draft integrity checks passed.`}`);
process.exitCode = failures ? 1 : 0;
