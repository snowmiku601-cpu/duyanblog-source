#!/usr/bin/env node
/**
 * slop-scan.mjs — AI-slop detector for duyanblog.com prose.
 *
 * The house voice is "reviews with reasons attached": confident, specific, sourced or openly
 * demo. This scanner finds the tells that survive human review — filler adverbs, unverifiable
 * universals, empty superlatives, binary contrasts, fabricated-specifics, rule-of-three runs.
 *
 * Philosophy (inherited from the sibling projects):
 *   - A scanner whose regexes are broken reports zero and reads exactly like clean writing.
 *     So EVERY pattern carries a selftest: a line that must HIT and one that must MISS.
 *     The selftest prints BEFORE any result — a control that dies means "measured nothing",
 *     which fails the run, not the prose.
 *   - A count you have not read is a rumour with a number attached. Use --rows to read each hit.
 *   - Severity: FATAL = smuggled claim (price/rating/count without demo label) — only when a
 *     claim check is on. WARN = style (tells that date the prose as AI-written).
 *
 * Usage:
 *   node scripts/slop-scan.mjs [--files=LIST] [--rows] [--strict]
 *     --files   comma-separated glob-ish paths; default: prisma/seed.ts + src/content/policies.ts
 *     --rows    print each hit with line + text
 *     --strict  exit non-zero on any WARN too (FATAL always exits non-zero)
 *
 * Exit: 0 = clean (or only WARN without --strict); 1 = FATAL (or WARN with --strict); 2 = selftest failed.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const args = process.argv.slice(2);
const showRows = args.includes("--rows");
const strict = args.includes("--strict");
const fileArg = args.find((a) => a.startsWith("--files="));
const files = fileArg
  ? fileArg.slice("--files=".length).split(",")
  : ["src/content/policies.ts"];

let fatalCount = 0;
let warnCount = 0;
let selftestFailed = 0;

/**
 * A pattern: { id, severity: "FATAL"|"WARN", match: RegExp, hits: "must"|"must-not",
 *              mustHit, mustMiss, label, why, fix }
 * - musHit/mustMiss are literal strings used for the selftest.
 */
const PATTERNS = [
  // ---------------------------------------------------------------- FATAL (claim) —
  {
    id: "claim-price",
    severity: "FATAL",
    // only fires on PROSE lines (P(...) / TIP(...) / NOTE(...) / H2/H3 text / policies),
    // never on seed data fields like price: "$32.50" or attributes rows
    match: /(?:P\(|TIP\(|NOTE\(|WARN\(|H2\(|H3\()(?=[^)]*["'][^)]*?\$\s?\d)/i,
    hits: "must",
    mustHit: 'P("Save $50 on the annual plan — our best deal")',
    mustMiss: 'price: "$32.50"',
    label: "Price-like figure in prose",
    why: "A price in editorial prose is a factual claim. It must trace to the seed (labelled demo) or a source — never float.",
    fix: "Attach it to the offer row (go:OFFER_ID) or drop it; demo copy keeps its DemoNotice.",
  },
  {
    id: "claim-rating",
    severity: "FATAL",
    match: /(?:P\(|TIP\(|NOTE\(|WARN\)|H2\(|H3\()(?=[^)]*["'][^)]*?\b(?:score|rating)\s*[:\-]?\s*\d+(?:\.\d+)?\s*\/\s*10\b)/i,
    hits: "must",
    mustHit: 'P("Our score: 8.4 / 10 — subjective, not lab data")',
    mustMiss: "the score dial component",
    label: "Explicit /10 rating in prose",
    why: "A /10 rating is a fabricated metric unless it is the engine's computed score with method shown.",
    fix: "Use the ReviewScore rows (weighted engine output, methodology page) or drop the number.",
  },
  {
    id: "claim-count",
    severity: "FATAL",
    match: /(?:P\(|TIP\(|NOTE\(|WARN\)|H2\(|H3\()(?=[^)]*["'][^)]*?\b(?:tested|reviewed|hours[ of-]*hands?-on|products? tested|tools? tested)\b[^.\n"]*\d{2,})/i,
    hits: "must",
    mustHit: 'P("We hand-tested 24 products over 68 hours for this guide")',
    mustMiss: "recently updated",
    label: "Testing/volume claim with a number",
    why: "'We tested N' is the exact sentence the sibling projects shipped as fiction. Unless the seed labels it demo, it is a lie.",
    fix: "State the method positively ('verified against vendor docs and independent benchmarks, dated') or keep the DemoNotice.",
  },
  // ---------------------------------------------------------------- WARN (style) —
  {
    id: "filler-adverb",
    severity: "WARN",
    match: /\b(?:seamlessly|effortlessly|truly|genuinely|simply|basically|actually|literally|absolutely|remarkably|incredibly|unbelievably)\b/i,
    hits: "must",
    mustHit: "It seamlessly integrates with your workflow",
    mustMiss: "The integration is direct and documented",
    label: "Filler adverb",
    why: "Every one of these is a content-farm tell. The house register is specific; these adverbs are noise.",
    fix: "Delete or replace with the concrete behaviour (which API? which port?).",
  },
  {
    id: "empty-superlative",
    severity: "WARN",
    match: /\b(?:game-?changer|cutting-?edge|state-?of-?the-?art|best-?in-?class|world-?class|revolutionary|unparalleled|industry-?leading?|top-?tier|next-?level)\b/i,
    hits: "must",
    mustHit: "This is a game-changer for content teams",
    mustMiss: "best overall for frequent travel",
    label: "Empty superlative",
    why: "Unsupported claims of excellence read as hype; the review's 'Best overall for X' badge is computed, not prose.",
    fix: "Replace with the measured reason (faster at what, cheaper than whom, by how much).",
  },
  {
    id: "binary-contrast",
    severity: "WARN",
    match: /\b(?:not just|more than just|it's not (?:about|just)|it's more than|beyond (?:just|being))\b/i,
    hits: "must",
    mustHit: "Not just a CRM — it's your whole sales engine",
    mustMiss: "It is a CRM with import filters",
    label: "Binary contrast ('not just X — it's Y')",
    why: "The 'not just... but' frame is a template move that manufactures depth; the house voice states trade-offs instead.",
    fix: "Say what it is and who it fits. The contrast only earns its place with a concrete second claim.",
  },
  {
    id: "rule-of-three",
    severity: "WARN",
    match: /\b(?:fast|powerful|intuitive|easy|flexible|clean|simple|robust|reliable|reliable|scalable|secure)\b(?:,\s*(?:and\s+)?)?\b(?:fast|powerful|intuitive|easy|flexible|clean|simple|robust|reliable|scalable|secure)\b[^.\n]{0,40}\b(?:fast|powerful|intuitive|easy|flexible|clean|simple|robust|reliable|scalable|secure)\b/i,
    hits: "must",
    mustHit: "It is fast, powerful and intuitive to use",
    mustMiss: "It is fast, and the filter UI is documented",
    label: "Adjective rule-of-three",
    why: "Three stacked adjectives with no measurements is the standard filler rhythm.",
    fix: "Keep at most one adjective; attach a number, a behaviour, or a source to each remaining one.",
  },
  {
    id: "unverifiable-universal",
    severity: "WARN",
    match: /\bin today'?s (?:fast-?paced|ever-?evolving|digital|modern) [a-z-]+ world\b|\bin this day and age\b/i,
    hits: "must",
    mustHit: "In today's fast-paced digital world, teams need tooling",
    mustMiss: "Before you buy, check the privacy policy",
    label: "Clichéd temporal frame",
    why: "A throat-clearing 'in today's world' that adds zero information.",
    fix: "Cut it. Start the sentence at the subject.",
  },
  {
    id: "em-dash-run",
    severity: "WARN",
    match: /—[^—\n]{0,80}—[^—\n]{0,80}—/,
    hits: "must",
    mustHit: "the plan — cheap — and the support — slow — worked",
    mustMiss: "one — carefully placed — em dash",
    label: "Two+ em dashes in one sentence",
    why: "House typography: em dash is a spice. Two in a sentence reads breathless.",
    fix: "Split into separate sentences; keep at most one per sentence.",
  },
  {
    id: "question-opener",
    severity: "WARN",
    match: /^\s*(?:wondering|looking for|need|want|ever wonder|thinking about|do you want|are you looking)/im,
    hits: "must",
    mustHit: "Wondering which eSIM to pick? Start here.",
    mustMiss: "The eSIM comparison below is short.",
    label: "Reader-question opener",
    why: "'Wondering which X?' opens read like an ad, not editorial.",
    fix: "Open with the decision, not the search.",
  },
  {
    id: "we-testify",
    severity: "FATAL",
    match: /(?:P\(|TIP\(|NOTE\(|WARN\)|H2\(|H3\()(?=[^)]*["'][^)]*?\bwe (?:tested|measured|bought|subscribed|handled|reviewed|verified|used)\b)/i,
    hits: "must",
    mustHit: 'P("We tested every provider on this list")',
    mustMiss: "We recommend the plan that fits your trip",
    label: "Fabricated testing claim ('we tested')",
    why: "On a demo-seeded editorial site, 'we tested' is the sentence that becomes a lawsuit when the index starts real. The sibling projects shipped 'we tested 247 tools / 68 hours' and none of it happened.",
    fix: "State the method positively — 'verified against vendor docs and independent benchmarks, dated' — or keep the DemoNotice visible on the page.",
  },
];

// ---------------------------------------------------------------------------
// Selftest — every pattern must fire on its mustHit and stay silent on mustMiss.
// A failure here means the scanner itself is broken; fail the run, not the prose.
// ---------------------------------------------------------------------------
console.log("slop-scan selftest");
for (const p of PATTERNS) {
  const hit = p.match.test(p.mustHit);
  const miss = p.match.test(p.mustMiss);
  const ok = p.hits === "must" ? hit : !hit;
  if (!ok || miss) {
    selftestFailed += 1;
    console.log(`  FAIL  ${p.id}: mustHit=${ok ? "ok" : "BROKEN"} mustMiss=${miss ? "BROKEN" : "ok"}`);
  } else {
    console.log(`  pass  ${p.id}`);
  }
}
console.log(selftestFailed === 0 ? "  selftest: all patterns fire correctly" : `  selftest: ${selftestFailed} broken pattern(s)`);

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------
const hits = []; // { file, line, pattern, text }
for (const f of files) {
  const full = path.join(root, f);
  if (!fs.existsSync(full)) {
    console.log(`\nSKIP  ${f} (not found)`);
    continue;
  }
  const lines = fs.readFileSync(full, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const p of PATTERNS) {
      if (p.match.test(line)) hits.push({ file: f, line: i + 1, pattern: p, text: line.trim() });
    }
  });
}

console.log(`\nScanning ${files.join(", ")} — ${hits.length} hit(s)`);
if (showRows) {
  for (const h of hits) {
    console.log(`  [${h.pattern.severity}] ${h.file}:${h.line} (${h.pattern.id})\n      ${h.text.slice(0, 160)}`);
  }
}

// ---------------------------------------------------------------------------
// Tally + exit
// ---------------------------------------------------------------------------
fatalCount = hits.filter((h) => h.pattern.severity === "FATAL").length;
warnCount = hits.filter((h) => h.pattern.severity === "WARN").length;

const verdict = [];
for (const severity of ["FATAL", "WARN"]) {
  const g = hits.filter((h) => h.pattern.severity === severity);
  if (g.length) {
    const byId = {};
    for (const h of g) byId[h.pattern.id] = (byId[h.pattern.id] || 0) + 1;
    verdict.push(`${severity}: ${g.length} (${Object.entries(byId).map(([k, v]) => `${k}×${v}`).join(", ")})`);
  }
}
console.log(verdict.length ? `\n${verdict.join(" · ")}` : "\nNo slop signals found.");

let exit = 0;
if (selftestFailed) exit = 2;
else if (fatalCount) exit = 1;
else if (strict && warnCount) exit = 1;
process.exit(exit);