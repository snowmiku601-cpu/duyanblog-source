/**
 * Offline integrity gate for Task 63's unpublished aosu buying guide.
 * Uses the real schema/config and actual inline/CTA rendering, with hostile controls.
 * No network, database, environment files, production access or mutations.
 *   node scripts/test-article-draft-how-to-choose-aosu-security-cameras.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createHash } from "node:crypto";

const ROOT = process.cwd();
const DATE = "2026-11-26";
const HUMAN_DATE = "November 26, 2026";
const SLUG = "how-to-choose-aosu-security-cameras";
const STORE = "https://www.aosulife.com/?ref=NGUYENTHIDUYAN";
const HERO = `/images/articles/${SLUG}/hero-aosu-composite.jpg`;
const ALT = "aosu Video Doorbell Pro, Floodlight Cam Pro and IndoorCam P1 Pro on a warm paper background";
const CREDIT = "Official aosu product photography; composite by Duyan Blog.";
const PICKS = [
  { model: "SolarCam System", name: "aosu SolarCam System with New aosuBase — 2-Cam Kit", handle: "aosu-solarcam-system-with-new-aosubase", variant: "2-Cam Kit", sku: "C7L-2H", id: 47706762641644, price: "129.99", job: /multi-camera solar perimeter/i, image: "C7L.png?v=1787714762&width=240" },
  { model: "SolarCam P1 Max", name: "aosu SolarCam P1 Max", handle: "solarcam-p1-max", variant: "Default Title", sku: "C8S", id: 46089260597484, price: "99.99", job: /single-camera sunlit outbuilding/i, image: "SolarCamP1Max.png?v=1757680855&width=240" },
  { model: "Video Doorbell Pro", name: "aosu Video Doorbell Pro", handle: "video-doorbell-pro", variant: "Default Title", sku: "V8P", id: 42652737274092, price: "95.99", job: /front-door visitor calls/i, image: "v8p_b200bc42-ac04-4607-aa94-e2a76f9871b9.png?v=1783057101&width=240" },
  { model: "Floodlight Cam Pro", name: "aosu Floodlight Cam Pro", handle: "floodlight-cam-pro", variant: "Floodlight Cam Pro", sku: "L5P", id: 46957081854188, price: "159.99", job: /mains-wired driveway light/i, image: "FloodlightCamPro.png?v=1768548879&width=240" },
  { model: "IndoorCam P1 Pro", name: "aosu IndoorCam P1 Pro", handle: "indoorcam-p1-pro", variant: "Default Title", sku: "C2P", id: 44288361038060, price: "49.99", job: /plug-in shared-room/i, image: "C2P_f7323620-ba09-4465-8b23-6ba1de1b1389.png?v=1786001288&width=240" },
];
const INTERNAL = ["/methodology", "/affiliate-disclosure", "/guides", "/best/best-protoarc-ergonomic-gear", "/guides/how-much-esim-data-do-i-need"];
const POLICY = ["cloud-storage", "shipping-delivery-policy", "return-policy", "warranty-policy", "privacy-policy", "terms-of-use", "aboutus"];
const SUPPORTED = new Set(["paragraph", "heading", "list", "quote", "callout", "prosCons", "stats", "table", "image", "pick", "faq", "sources", "divider"]);
let checks = 0;
let failures = 0;
function check(name, ok, detail = "") {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}
const textFile = (file) => readFileSync(path.join(ROOT, file), "utf8");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function strings(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  return value && typeof value === "object" ? Object.values(value).flatMap(strings) : [];
}
function url(value) { try { return new URL(value); } catch { return null; } }
function exactRef(value) {
  const u = url(value);
  return !!u && u.protocol === "https:" && u.hostname === "www.aosulife.com" && !u.username && !u.password && !u.port && !u.hash &&
    u.search === "?ref=NGUYENTHIDUYAN" && [...u.searchParams].length === 1 && u.searchParams.get("ref") === "NGUYENTHIDUYAN";
}
function officialImage(value) {
  const u = url(value);
  return !!u && u.protocol === "https:" && u.hostname === "www.aosulife.com" && !u.username && !u.password && !u.port && !u.hash &&
    /^\/cdn\/shop\/files\/.+\.(?:png|jpe?g|avif|webp)$/i.test(u.pathname) && !u.searchParams.has("ref");
}
function merchantUrls(text) {
  const absolute = /(?:https?:)?\/\/[^\s<>"'`)\]]+/gi;
  const found = [...text.matchAll(absolute)].map((m) => m[0]).filter((s) => /aosulife\.com/i.test(s));
  const bare = /(?:[a-z0-9-]+\.)*aosulife\.com(?::\d+)?[/?#][^\s<>"'`)\]]*/gi;
  found.push(...[...text.replace(absolute, "").matchAll(bare)].map((m) => m[0]));
  return found.map((s) => s.replace(/[.,;!]+$/, ""));
}
const navigationProblems = (value) => strings(value).flatMap(merchantUrls).filter((u) => !officialImage(u) && !exactRef(u));
function exactSelection(picks) {
  return picks.length === 5 && new Set(picks.map((p) => p.name)).size === 5 && picks.every((p, i) => p.name === PICKS[i].name && p.rank === i + 1 && PICKS[i].job.test(p.badge ?? ""));
}
function affirmativeHits(text, patterns) {
  return text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter((s) => !s.endsWith("?")).flatMap((sentence) => patterns.flatMap((pattern) =>
    [...sentence.matchAll(new RegExp(pattern.source, "gi"))].filter((m) => {
      const boundaries = [...sentence.matchAll(/[,;:]|\b(?:but|however|yet|while)\b|\b(?:and|or)\s+(?=(?:we|I|Duyan|our team|it|they|this camera|the camera)\b)/gi)].filter((boundary) => boundary.index + boundary[0].length <= m.index);
      const lastBoundary = boundaries.at(-1);
      const clauseStart = lastBoundary ? lastBoundary.index + lastBoundary[0].length : 0;
      const prefix = sentence.slice(clauseStart, m.index).replace(/\bnot only\b/gi, "");
      const suffix = sentence.slice(m.index + m[0].length);
      return !/\b(?:no|not|nor|never|without|unverified|unproven|cannot|can't|didn't|haven't)\b/i.test(prefix.slice(-48)) && !/^\s*(?:neither|no|nothing)\b/i.test(suffix);
    }).map((m) => m[0])));
}
const FIRSTHAND = [/\b(?:we|I|Duyan|our team)\s+(?:personally\s+|actually\s+)?(?:tested|handled|bought|measured|experienced|used|ordered|assembled|tried|installed)\b/, /\bin our (?:tests|testing|lab)\b/, /\bour (?:benchmark|hands-on testing|test results)\b/];
const SECURITY = [/\b(?:prevent|stop|eliminate|deter)s?\s+(?:(?:all|any|every|home|property|attempted)\s+)*(?:crime|crimes|theft|burglaries|break-ins|intruders)\b/, /\b(?:guarantees?|guaranteed|ensures?)\s+(?:(?:your|complete|total|home|absolute|family)\s+)*(?:security|safety|privacy|protection)\b/, /\b(?:unhackable|hack-proof|crime-proof|100% secure|never misses? (?:an? )?(?:event|intruder|alert))\b/];
const GUARANTEES = [/\b(?:referral|affiliate)(?: code| links?)?[^.!?;]{0,90}\b(?:does not|do not|doesn't|don't|won't|will not|never) (?:change|affect|increase|raise|alter)s?\b[^.!?;]{0,60}\b(?:price|prices|cost|costs)\b/, /\b(?:at )?no (?:extra|additional) (?:cost|charge)\b/, /\b(?:the )?price (?:you pay )?(?:is|will be|stays|remains) (?:the )?(?:same|unchanged)\b/];
function forbiddenSchema(value) {
  return !!value && typeof value === "object" && Object.entries(value).some(([key, item]) => /^(?:aggregateRating|review)$/i.test(key) ||
    (key === "@type" && [item].flat().some((type) => /^(?:Product|Review|AggregateRating|FAQPage)$/i.test(String(type)))) || forbiddenSchema(item));
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
  const draftFile = `content/drafts/${SLUG}.json`;
  const ledgerFile = "content/drafts/aosu-claim-ledger.md";
  check("draft and dated ledger exist", existsSync(draftFile) && existsSync(ledgerFile));
  if (!existsSync(draftFile) || !existsSync(ledgerFile)) return;
  const draft = JSON.parse(textFile(draftFile));
  const ledger = textFile(ledgerFile);
  const blocks = Array.isArray(draft.blocks) ? draft.blocks : [];
  const picks = blocks.filter((b) => b.type === "pick");
  const sources = blocks.filter((b) => b.type === "sources").flatMap((b) => b.items ?? []);
  const prose = strings(blocks.filter((b) => ["paragraph", "list", "callout", "faq"].includes(b.type)));
  const body = strings(blocks).join("\n");
  const editorial = [draft.title, draft.deck, draft.tldr, ...strings(blocks.filter((b) => b.type !== "sources"))].join("\n");
  check("non-demo guide/tech remains unpublished with exact route slug", draft.type === "guide" && draft.slug === SLUG && draft.categoryId === "tech" && draft.isDemo === false && draft.status === "draft" && draft.publishedAt === null);
  check("review date exact and author uses existing publication identity", draft.lastReviewedAt === `${DATE}T00:00:00.000Z` && draft.authorSlug === "duyan" && draft.authorByline === "Duy An Tran");
  check("declarative title has primary topic near front and <=60 chars", draft.title?.startsWith("How to choose an aosu security camera:") && draft.title.length <= 60, `${draft.title?.length} characters`);
  check("active deck 130–155 chars with exact checked date", draft.deck?.startsWith("Choose an aosu security camera") && draft.deck.length >= 130 && draft.deck.length <= 155 && draft.deck.includes(HUMAN_DATE), `${draft.deck?.length} characters`);
  check("metadata TLDR concise; no invented overall performance winner", draft.tldr?.length >= 80 && draft.tldr.length <= 450 && !/best overall|wins overall|overall winner/i.test(draft.tldr));
  check("four exact tags", isDeepStrictEqual(draft.tags, ["aosu", "Security cameras", "Local storage", "Smart home"]));
  const reading = readingEstimate(blocks);
  check("reading time matches repo 200-wpm estimator", draft.readingMinutes === reading.minutes, `${reading.words} block words / 200 → ${reading.minutes} minutes`);
  check("supported blocks only; no offer IDs/DB embeds", blocks.length > 0 && blocks.every((b) => SUPPORTED.has(b.type) && !b.offerId));
  check("first warning sets research limits and disclosure before any CTA", blocks[0]?.type === "callout" && blocks[0].variant === "warning" && blocks[0].title === "How we put this together — and what we did not do" && /documented research/.test(blocks[0].text) && /did not test/.test(blocks[0].text) && /commission/.test(blocks[0].text));
  check("all five untested performance dimensions named", ["motion detection latency", "night-vision clarity", "Wi-Fi range", "battery winter drain", "weather sealing"].every((s) => blocks[0].text.includes(s)));
  const firstPick = blocks.findIndex((b) => b.type === "pick");
  const before = strings(blocks.slice(0, firstPick)).join("\n");
  check("short-version H2 plus power/storage/network framework precede all picks", ["The short version", "Choose power, storage and network in that order", "Before-you-buy checklist"].every((s) => blocks.slice(0, firstPick).some((b) => b.type === "heading" && b.level === 2 && b.text === s)) && /Plug-in indoor power/.test(before) && /Hardwired outdoor power/.test(before) && /Optional cloud/.test(before));
  check("final in-body source block compensates for GuidePage architecture", blocks.at(-1)?.type === "sources" && blocks.filter((b) => b.type === "sources").length === 1 && sources.length >= 11);
  const { tsImport } = await import("tsx/esm/api");
  const schema = exported(await tsImport("../src/lib/content-schema.ts", import.meta.url), (m) => typeof m?.serializeBlocks === "function");
  try {
    const serialized = schema.serializeBlocks(blocks);
    const parsed = schema.parseBlocks(serialized);
    check("actual serializeBlocks roundtrip retains every block and field", parsed.length === blocks.length && isDeepStrictEqual(parsed, blocks) && schema.serializeBlocks(parsed) === serialized, `${parsed.length}/${blocks.length} blocks`);
  } catch (error) { check("actual schema write validation", false, error.message); }
  const valid = { type: "paragraph", text: "Schema positive control." };
  const invalid = { type: "pick", rank: 0, name: "Invalid", blurb: "Invalid rank." };
  let rejected = false;
  try { schema.serializeBlocks([invalid]); } catch { rejected = true; }
  check("schema controls reject invalid pick and parse-drop malformed block", rejected && isDeepStrictEqual(schema.parseBlocks(JSON.stringify([valid, invalid])), [valid]) && schema.parseBlocks("not JSON").length === 0);
  const goodRefs = [STORE, "https://www.aosulife.com/pages/cloud-storage?ref=NGUYENTHIDUYAN"];
  const badRefs = ["https://www.aosulife.com/?Ref=NGUYENTHIDUYAN", "https://www.aosulife.com/?REF=NGUYENTHIDUYAN", "https://www.aosulife.com/?ref=nguyenthiduyan", "https://www.aosulife.com/?ref=Nguyenthiduyan", "https://www.aosulife.com/", "https://www.aosulife.com/?ref=NGUYENTHIDUYANx", "https://www.aosulife.com/?next=ref=NGUYENTHIDUYAN", "https://www.aosulife.com/#ref=NGUYENTHIDUYAN", "https://www.aosulife.com/?%72ef=NGUYENTHIDUYAN", "https://www.aosulife.com/?ref=NGUYENTHIDUYAN&Ref=NGUYENTHIDUYAN", "https://www.aosulife.com/?ref=NGUYENTHIDUYAN&ref=NGUYENTHIDUYAN", "https://www.aosulife.com.evil.example/?ref=NGUYENTHIDUYAN", "https://aosulife.com/?ref=NGUYENTHIDUYAN", "http://www.aosulife.com/?ref=NGUYENTHIDUYAN", "not a URL"];
  check("exact UPPERCASE referral positive and wrong-key/value-case negative controls", goodRefs.every(exactRef) && badRefs.every((u) => !exactRef(u)));
  check("all five pick URLs are the exact approved storefront", picks.length === 5 && picks.every((p) => p.url === STORE));
  check("all specific official sources dated and exact referral suffixed", sources.length >= 11 && sources.every((s) => s.label.includes(HUMAN_DATE) && exactRef(s.url) && /^\/(?:products|pages|blogs)\//.test(url(s.url).pathname)));
  check("recursive navigation guard rejects hidden/raw/spoofed URLs", navigationProblems({ hidden: badRefs[0] }).length === 1 && navigationProblems({ hidden: "aosulife.com/products/raw" }).length === 1 && navigationProblems({ hidden: badRefs[11] }).length === 1 && navigationProblems({ hidden: STORE }).length === 0);
  check("no invalid merchant navigation in any draft field", navigationProblems(draft).length === 0);
  check("zero raw aosulife.com URLs or domains in paragraph/list/callout/FAQ", prose.every((text) => !/aosulife\.com/i.test(text)));
  check("five distinct exact configurations, sequential ranks and nonoverlapping jobs", exactSelection(picks) && new Set(picks.map((p) => p.badge)).size === 5);
  check("selection controls reject duplicates, bundle substitution and hub-less starter", !exactSelection(picks.map((p, i) => i === 1 ? picks[0] : p)) && !exactSelection(picks.map((p, i) => i === 3 ? { ...p, name: "Floodlight Cam Pro + Doorbell" } : p)) && !exactSelection(picks.map((p, i) => i === 0 ? { ...p, name: "D1 Max 1-Cam(aosuBase not included)" } : p)));
  check("five exact official CDN og-image thumbnails width=240", picks.every((p, i) => officialImage(p.imageUrl) && p.imageUrl === `https://www.aosulife.com/cdn/shop/files/${PICKS[i].image}` && url(p.imageUrl).searchParams.getAll("width").join() === "240"));
  check("thumbnail host/path/spoof negative controls", !officialImage("https://www.aosulife.com/products/control.jpg?width=240") && !officialImage("https://evil.example/cdn/shop/files/control.jpg?width=240") && !officialImage("https://www.aosulife.com.evil.example/cdn/shop/files/x.jpg?width=240") && officialImage(picks[0].imageUrl));
  for (const [i, expected] of PICKS.entries()) {
    const blurb = picks[i]?.blurb ?? "";
    check(`${expected.model}: exact dated displayed USD amount, SKU and saved stock`, blurb.includes(`$${expected.price} USD`) && blurb.includes(expected.sku) && blurb.includes(HUMAN_DATE) && /stock available in the saved variant data/.test(blurb));
    const row = ledger.split(/\r?\n/).find((line) => line.startsWith(`| ${expected.model} —`));
    const cells = row?.split("|").map((s) => s.trim());
    check(`${expected.model}: ledger displayed/JSON amount, exact variant ID and stock parity`, cells?.[2] === `$${expected.price}` && cells?.[3] === `$${expected.price}` && cells?.[4]?.includes(expected.sku) && cells?.[4]?.includes(String(expected.id)) && cells?.[5]?.includes("available=true") && cells?.[5]?.includes("cartEnabled=true"));
    check(`${expected.model}: product source, thumb and original og-image ledger parity`, sources.some((s) => url(s.url)?.pathname === `/products/${expected.handle}`) && ledger.includes(picks[i].imageUrl) && ledger.includes(picks[i].imageUrl.replace("width=240", "width=2048")));
  }
  const tables = blocks.filter((b) => b.type === "table");
  check("one dated comparison table, exactly five columns and five exact price rows", tables.length === 1 && tables[0].caption.includes(HUMAN_DATE) && tables[0].head.length === 5 && tables[0].rows.length === 5 && tables[0].rows.every((row, i) => row.length === 5 && row[0].includes(PICKS[i].sku) && row.at(-1) === `$${PICKS[i].price}`));
  check("C7L hub/storage/resolution and unknown sunlight/network not borrowed", /2K QHD/.test(picks[0].blurb) && /32GB/.test(picks[0].blurb) && /1TB/.test(picks[0].blurb) && /separately sold/.test(picks[0].blurb) && /six cameras/.test(picks[0].blurb) && /uplink method, panel wattage and sunlight-hours threshold were not verified/.test(picks[0].blurb));
  check("P1 microSD/4K/solar and unresolved hub-free/card/band conditions", /4K/.test(picks[1].blurb) && /128GB/.test(picks[1].blurb) && /two hours of direct sunlight/.test(picks[1].blurb) && /does not explicitly settle hub-free operation/.test(picks[1].blurb) && /Confirm direct-to-router use for C8S/.test(picks[1].blurb) && /card's inclusion and the exact Wi-Fi band were not verified/.test(picks[1].blurb));
  const trap = blocks.find((b) => b.type === "callout" && b.title === "The single-camera add-on trap");
  check("aosuBase add-on trap explicitly disclosed before picks without inventing dependency", !!trap && blocks.indexOf(trap) < firstPick && /1-Cam\(aosuBase not included\)/.test(trap.text) && /microSD/.test(trap.text) && /does not settle whether that exact single SKU requires a hub/.test(trap.text) && /P1 Max/.test(trap.text));
  check("doorbell battery/Mini/storage/angle and wired-chime/band gaps retained", /built-in battery and included aosuBase Mini/.test(picks[2].blurb) && /166°/.test(picks[2].blurb) && /133° horizontal and 103° vertical/.test(picks[2].blurb) && /4:3/.test(picks[2].blurb) && /128GB/.test(picks[2].blurb) && /card not included/.test(picks[2].blurb) && /2\.4GHz/.test(picks[2].blurb) && /transformer limits and a separate chime's inclusion were not verified/.test(picks[2].blurb));
  check("floodlight wired/5MP/lumens/PIR/card/siren and exact unknowns scoped", /5MP/.test(picks[3].blurb) && /2,600 lumens/.test(picks[3].blurb) && /three PIR sensors/.test(picks[3].blurb) && /270° of detection/.test(picks[3].blurb) && /continuous local microSD/.test(picks[3].blurb) && /siren/.test(picks[3].blurb) && /Exact AC voltage, Wi-Fi band, maximum card capacity and siren loudness were not verified/.test(picks[3].blurb));
  check("indoor plug-in/4MP/dual-band/card speed and tilt gap scoped", /4MP/.test(picks[4].blurb) && /2\.4GHz and 5GHz/.test(picks[4].blurb) && /8–128GB/.test(picks[4].blurb) && /A1, Class 10/.test(picks[4].blurb) && /keep it plugged in/.test(picks[4].blurb) && /Numeric tilt travel and adapter input\/output ratings were not verified/.test(picks[4].blurb));
  check("aosuCortex not conflated; HomeKit remains unverified", /aosuCortex bundles are different configurations/.test(body) && /We did not verify Apple HomeKit support/.test(body) && /not cellular 5G/.test(body));
  check("D1-specific solar cutoff/events scoped separately", /50 events per day at 20 seconds each/.test(body) && /-5°C \(23°F\)/.test(body) && /not specifications to copy onto the C7L or P1 Max/.test(body));
  check("cloud tiers/14-30 retention/event-only/payment and renewal covered", ["$0.00/month", "$4.99/month", "$8.99/month", "14-day or 30-day", "does not record continuously", "payment authorization", "automatic renewal", "not a one-time purchase"].every((s) => body.includes(s)));
  check("no-free-forever shortcut; cloud features and access conflict visible", !/free forever/i.test(editorial) && /does not clearly settle device allowance/.test(body) && /access may be restricted immediately/.test(body) && /We do not promise post-cancellation access/.test(body));
  check("local recording not confused with zero cloud data", /event-preview thumbnails are uploaded/.test(body) && /Local storage is not the same as no data leaving/.test(body));
  check("US localization caveat and hidden badge interpretation honest", /country selector shows Vietnam/.test(body) && /not a completed US checkout/.test(body) && /Hidden sold-out badge templates/.test(body));
  check("policies have dated sources and ledger URLs", POLICY.every((p) => sources.some((s) => url(s.url)?.pathname === `/pages/${p}`)) && sources.every((s) => ledger.includes(s.url)));
  check("shipping stage distinction and destination conflict retained", /1–2 business days/.test(body) && /2–5 business days/.test(body) && /separate stages/.test(body) && /PO boxes/.test(body) && /Poland, Spain and Japan/.test(body));
  check("return freight and promotion/default warranty conflicts explicit", /return shipping is not covered/.test(body) && /30-Day Free Return/.test(body) && /conflicts with that buyer-paid/.test(body) && /12-month limited commercial/.test(body) && /24 months for EEA/.test(body) && /2-Year Warranty \(Black Friday Special\)/.test(body) && /does not settle eligibility/.test(body));
  check("no affirmative invented hands-on/security-guarantee claims", affirmativeHits(editorial, [...FIRSTHAND, ...SECURITY]).length === 0);
  const allowed = "We did not test these cameras. We measured neither range nor latency. No evidence they prevent crime. They do not guarantee security. Did we test it? We have not verified an unhackable system.";
  const forbidden = "We tested these cameras. We measured range. This camera prevents crime. It guarantees security. Not cheap, it stops burglaries. No shipping fee, we tested it. Not only that, we installed it. We did not test latency, but we tested range. We did not test latency and we tested range.";
  check("clause-scoped detector controls allow negatives and catch unrelated-negation escapes", affirmativeHits(allowed, [...FIRSTHAND, ...SECURITY]).length === 0 && affirmativeHits(forbidden, [...FIRSTHAND, ...SECURITY]).length >= 9);
  check('zero banned "list price" phrase', !/\blist price\b/i.test(editorial));
  check("no unconditional affiliate-price guarantee; merchant controls checkout", affirmativeHits(editorial, GUARANTEES).length === 0 && /aosu sets the prices shown at checkout/.test(body) && /we do not control them/.test(body));
  check("affiliate-price guarantee controls reject promise and allow denial", affirmativeHits("A referral code does not change the store's price. At no extra cost to you.", GUARANTEES).length === 2 && affirmativeHits("We do not promise the price you pay is the same. No price guarantee is made.", GUARANTEES).length === 0);
  const words = editorial.split(/\s+/).filter(Boolean).length;
  const dashes = (editorial.match(/—/g) ?? []).length;
  check("em-dash density <=2 per 500 editorial words", dashes / words * 500 <= 2, `${dashes} em dashes / ${words} words`);
  check("eight FAQs retained, no measured-rank or guarantee shortcut", blocks.filter((b) => b.type === "faq").length === 1 && blocks.find((b) => b.type === "faq")?.items.length === 8);
  const affiliate = exported(await tsImport("../src/components/affiliate/affiliate-link.tsx", import.meta.url), (m) => typeof m?.isReferralUrl === "function");
  const inline = exported(await tsImport("../src/components/editorial/inline-text.tsx", import.meta.url), (m) => typeof m?.InlineText === "function");
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  check("actual isReferralUrl accepts uppercase value but not wrong-case parameter", affiliate.isReferralUrl(STORE) && !affiliate.isReferralUrl("https://www.aosulife.com/pages/cloud-storage") && !affiliate.isReferralUrl(badRefs[0]) && !affiliate.isReferralUrl("not a URL"));
  check("referral helper is not mistaken for case-sensitive commission validation", affiliate.isReferralUrl(badRefs[2]) && !exactRef(badRefs[2]) && sources.every((s) => affiliate.isReferralUrl(s.url)));
  const rendered = anchors(renderToStaticMarkup(createElement(inline.InlineText, { text: `[Commercial](${STORE}) [Ordinary](https://example.com/research)` })));
  check("actual inline renderer sponsors commercial only", rendered.length === 2 && rendered[0].href === STORE && rendered[0].rel.includes("sponsored") && rendered[0].target === "_blank" && !rendered[1].rel.includes("sponsored") && rendered[1].rel.includes("nofollow"));
  const cta = anchors(renderToStaticMarkup(createElement(affiliate.DirectAffiliateButton, { url: STORE }, "Visit merchant store")));
  const disclosure = renderToStaticMarkup(createElement(affiliate.AffiliateDisclosure));
  check("actual direct CTA sponsored/noopener/new-tab with commission disclosure", cta.length === 1 && cta[0].href === STORE && cta[0].rel.includes("sponsored") && cta[0].rel.includes("noopener") && cta[0].target === "_blank" && /may earn a commission/.test(disclosure) && /affiliate-disclosure/.test(disclosure));
  const proseLinks = new Set(anchors(prose.map((text) => renderToStaticMarkup(createElement(inline.InlineText, { text }))).join("")).map((a) => a.href));
  const internal = [...proseLinks].filter((u) => u.startsWith("/") && !u.startsWith("//"));
  check("all five verified-live internal prose links actually render, no extra routes", internal.length === 5 && INTERNAL.every((href) => internal.includes(href)) && internal.every((href) => INTERNAL.includes(href)), internal.join(", "));
  check("all five live-link HTTP/canonical facts retained in ledger", INTERNAL.every((href) => ledger.includes(`| ${href} | 200 | true |`)));
  check("unpublished SONNI24 link and fake offer controls rejected", !strings(draft).some((s) => /sonni24-bathroom-buying-guide|go:|\/go\//.test(s)) && !INTERNAL.includes("/guides/sonni24-bathroom-buying-guide"));
  const renderer = textFile("src/components/editorial/article-renderer.tsx");
  const sourceBranch = renderer.slice(renderer.indexOf('case "sources":'), renderer.indexOf('case "divider":'));
  const pickBranch = renderer.slice(renderer.indexOf('case "pick":'), renderer.indexOf('case "comparisonEmbed":'));
  check("sources preserve isReferralUrl sponsored/noopener branch", /href=\{s\.url\}/.test(sourceBranch) && /rel=\{isReferralUrl\(s\.url\)\s*\?\s*"sponsored noopener"\s*:\s*"noopener nofollow"\}/.test(sourceBranch));
  check("pick branch keeps generic CTA/plain heading and self-contained disclosure", /<DirectAffiliateButton url=\{block\.url\}>Visit merchant store<\/DirectAffiliateButton>/.test(pickBranch) && /<AffiliateDisclosure/.test(pickBranch) && /\{block\.name\}/.test(pickBranch) && !/href=\{block\.url\}/.test(pickBranch));
  const guide = textFile("src/app/guides/[slug]/page.tsx");
  check("GuidePage retains TOC and ArticleRenderer; no separate TLDR/source dependency", /<TableOfContents blocks=\{blocks\}/.test(guide) && /<ArticleRenderer blocks=\{blocks\}/.test(guide) && /dropCap/.test(guide) && !/<TldrBox|<SourcesList/.test(guide));
  check("no Product/Review/aggregateRating/FAQPage schema additions", !forbiddenSchema(draft) && !/aggregateRating|\b(?:productJsonLd|reviewJsonLd|faqJsonLd)\s*\(|["']@type["']\s*:\s*["'](?:Product|Review|FAQPage)["']/i.test(guide));
  check("schema detector controls reject nested and array schema types", forbiddenSchema({ nested: { "@type": "Product" } }) && forbiddenSchema({ aggregateRating: {} }) && forbiddenSchema({ "@type": ["Article", "FAQPage"] }) && forbiddenSchema({ "@type": "Review" }) && !forbiddenSchema({ "@type": "Article" }));
  const seo = textFile("src/lib/seo.ts");
  check("shared SEO retains no aggregateRating policy", /aggregateRating/.test(seo) && !/["']aggregateRating["']\s*:/.test(seo) && !/\baggregateRating\s*:\s*\{/.test(seo));
  const seoModule = exported(await tsImport("../src/lib/seo.ts", import.meta.url), (m) => typeof m?.articleJsonLd === "function");
  const articleSchema = seoModule.articleJsonLd({ type: draft.type, title: draft.title, deck: draft.deck, slug: SLUG, path: `/guides/${SLUG}`, image: HERO, authorName: draft.authorByline, authorSlug: draft.authorSlug, publishedAt: null, updatedAt: new Date(`${DATE}T00:00:00.000Z`), section: "Tech" });
  const crumbs = seoModule.breadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: draft.title, href: `/guides/${SLUG}` }]);
  check("actual shared JSON-LD is Article and BreadcrumbList only, with no draft publish date", articleSchema["@type"] === "Article" && crumbs["@type"] === "BreadcrumbList" && !forbiddenSchema([articleSchema, crumbs]) && articleSchema.datePublished === undefined && articleSchema.url === `https://duyanblog.com/guides/${SLUG}`);
  const config = exported(await tsImport("../next.config.ts", import.meta.url), (m) => !!m?.images);
  const patterns = config.images.remotePatterns ?? [];
  const aosu = patterns.filter((p) => /aosu/i.test(p.hostname ?? ""));
  check("one exact narrow HTTPS www.aosulife.com /cdn/shop/files/** entry", aosu.length === 1 && aosu[0].protocol === "https" && aosu[0].hostname === "www.aosulife.com" && aosu[0].pathname === "/cdn/shop/files/**" && !aosu[0].port && !(config.images.domains ?? []).some((h) => /aosu/i.test(h)));
  const old = [["fanttik.com", "/cdn/shop/files/**"], ["www.ottocast.com", "/cdn/shop/files/**"], ["phomemo.com", "/cdn/shop/files/**"], ["www.cmycubes.com", "/cdn/shop/files/**"], ["www.cmycubes.com", "/cdn/shop/products/**"], ["www.protoarc.com", "/cdn/shop/files/**"]];
  check("all six prior patterns preserved; no wildcard remote hostname", old.every(([host, pathname]) => patterns.some((p) => p.protocol === "https" && p.hostname === host && p.pathname === pathname)) && patterns.every((p) => p.hostname && !p.hostname.includes("*")));
  check("hero exact path/alt/credit names only three actual devices <=125 chars", draft.heroImage === HERO && draft.heroAlt === ALT && draft.heroCredit === CREDIT && draft.heroAlt.length <= 125 && !/SolarCam|aosuBase|D1 Max|P1 Max/.test(draft.heroAlt));
  check("hero not duplicated in body", !strings(blocks).some((s) => s.includes(HERO)));
  const heroPath = path.join(ROOT, "public", HERO);
  check("hero JPEG file exists", existsSync(heroPath));
  if (existsSync(heroPath)) {
    const bytes = readFileSync(heroPath);
    check("JPEG magic FF D8 FF, <=200000 bytes and ledger hash parity", bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) && bytes.length <= 200000 && ledger.includes(sha256(bytes)), `${bytes.length} bytes`);
    const { default: sharp } = await import("sharp");
    const meta = await sharp(bytes).metadata();
    const decoded = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
    check("actual JPEG fully decodes at 1600x1000", meta.format === "jpeg" && meta.width === 1600 && meta.height === 1000 && decoded.info.width === 1600 && decoded.info.height === 1000);
    const channels = decoded.info.channels;
    const pixel = [...decoded.data.subarray(0, channels)].slice(0, 3);
    check("hero corner is flat warm paper #F6F3EC within JPEG tolerance", pixel.every((n, i) => Math.abs(n - [246, 243, 236][i]) <= 3), pixel.join(","));
    const manifest = JSON.parse(textFile("public/images/.media-manifest.json"));
    check("manifest hero dimensions match decoded JPEG", manifest[HERO]?.width === meta.width && manifest[HERO]?.height === meta.height);
  }
  check("ledger exact date/approved Store ID/USD/owner-reported permission", ledger.includes(HUMAN_DATE) && ledger.includes(DATE) && /Store ID 7100712/.test(ledger.replaceAll("**", "")) && /approved/.test(ledger) && /currency \*\*USD/.test(ledger) && /OWNER-REPORTED AUTHORIZATION/.test(ledger) && /No written license/.test(ledger) && /deep-link commission attribution is \*\*unverified/.test(ledger));
  check("ledger hero alt/credit/three-only parity", ledger.includes(HERO) && ledger.includes(ALT) && ledger.includes(CREDIT) && /Video Doorbell Pro, Floodlight Cam Pro and IndoorCam P1 Pro only/.test(ledger.replaceAll("**", "")));
  check("ledger retains model/policy/cloud conflicts and complete local DB skip", ["UNRESOLVED", "1-Cam(aosuBase not included)", "14-day", "30-day", "$4.99", "$8.99"].every((s) => ledger.includes(s)) && /12 months/.test(ledger) && /2-Year Warranty/.test(ledger) && /local_mysql_tcp_reachable=false/.test(ledger) && /database_target_is_local_duyanblog_dev=false/.test(ledger) && /rendered_route_qa_performed=false/.test(ledger) && /No Article\/Merchant\/AffiliateOffer/.test(ledger));
  // Fresh local evidence can be audited offline if present; repository pins above
  // stay reproducible when task-local downloads are not distributed with the draft.
  const cacheFile = "tmp/task-aosu/extracted-evidence.json";
  if (existsSync(cacheFile)) {
    const evidence = JSON.parse(textFile(cacheFile));
    for (const p of PICKS) {
      const entry = evidence.rows.find((r) => r.handle === p.handle);
      const v = entry?.variants.find((item) => item.id === p.id);
      check(`${p.model}: optional raw-cache price/availability/hash reconciliation`, evidence.checkedDate === DATE && entry?.productAvailable === true && v?.available === true && v?.sku === p.sku && v?.title === p.variant && v?.priceUSD === p.price && entry.displayedSale === `Sale price USD $${p.price}` && sha256(readFileSync(`tmp/task-aosu/downloads/${p.handle}.html`)) === entry.htmlSHA256 && sha256(readFileSync(`tmp/task-aosu/downloads/${p.handle}.js.json`)) === entry.jsonSHA256);
    }
  }
  const proofFile = "tmp/task-aosu/asset-and-link-verification.json";
  if (existsSync(proofFile)) {
    const proof = JSON.parse(textFile(proofFile));
    check("optional live-link capture pins all five HTTP 200 + canonical matches", proof.checkedDate === DATE && proof.links.length === 5 && INTERNAL.every((route) => proof.links.some((r) => r.route === route && r.status === 200 && r.canonical === `https://duyanblog.com${route}` && r.notFound === false)));
    check("optional thumbnail capture pins all five exact URLs/HTTP/full-decode size", proof.thumbs.length === 5 && PICKS.every((p, i) => proof.thumbs.some((t) => t.handle === p.handle && t.url === picks[i].imageUrl && t.status === 200 && t.width === 240 && t.height >= 240 && t.bytes < 100000)));
  }
}
try { await main(); } catch (error) { check("gate execution completed", false, error instanceof Error ? error.stack : String(error)); }
console.log(`\n${failures ? `${failures} failure(s) in ${checks} aosu checks.` : `All ${checks} aosu guide draft integrity checks passed.`}`);
process.exitCode = failures ? 1 : 0;
