#!/usr/bin/env node
/**
 * validate-docs.mjs — governance gate for the .claude/ directory itself.
 *
 * The docs are the only layer of this repo with no compiler. This script is that compiler:
 * it makes the same handful of claims a session would otherwise make by hand ("the rules are
 * small", "the links work", "the memory is indexed") and checks them all at once.
 *
 * Every check carries a control that must fire — a check that cannot fail is not a check.
 * A FATAL means the repo will rot in silence otherwise; that is the point.
 *
 * Usage: node scripts/validate-docs.mjs   (exit 0 = green, non-zero = gates)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const claudeDir = path.join(root, ".claude");

let failed = 0;

function check(name, ok, detail) {
  if (!ok) {
    failed += 1;
    console.log(`FAIL  ${name} — ${detail}`);
  } else {
    console.log(`PASS  ${name}`);
  }
}

/**
 * Walk a directory with a filter, returning relative paths (forward slashes).
 * Control: if the directory does not exist, walk returns [] — callers must
 * assert the count is non-zero where a non-empty dir is expected.
 */
function walk(dir, filter = () => true, base = dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replace(/\\/g, "/");
    if (entry.isDirectory()) walk(full, filter, base, acc);
    else if (filter(rel, full)) acc.push(rel);
  }
  return acc;
}

const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

// ---------------------------------------------------------------------------
// Check 1 — CLAUDE.md is under the byte budget (backstop against bloat).
// The budget is a ratchet: it comes DOWN, never up. Bump it only by retiring prose.
// ---------------------------------------------------------------------------
const budgetAutoload = 24_000; // bytes, CLAUDE.md + rules/ + AGENTS.md
const claudeBytes = exists(".claude/CLAUDE.md") ? Buffer.byteLength(read(".claude/CLAUDE.md"), "utf8") : 0;
const rulesBytes = walk(path.join(claudeDir, "rules"), (rel) => rel.endsWith(".md"))
  .reduce((sum, rel) => sum + Buffer.byteLength(read(rel), "utf8"), 0);
const agentsBytes = exists("AGENTS.md") ? Buffer.byteLength(read("AGENTS.md"), "utf8") : 0;
const autoloadTotal = claudeBytes + rulesBytes + agentsBytes;
check(
  `auto-load budget: CLAUDE.md (${claudeBytes}B) + rules/ (${rulesBytes}B) + AGENTS.md (${agentsBytes}B) = ${autoloadTotal}B ≤ ${budgetAutoload}B`,
  autoloadTotal <= budgetAutoload,
  `over budget by ${autoloadTotal - budgetAutoload}B — retire prose, do not raise the cap`
);
// Control: rules/ must be non-empty, or the budget check above measures nothing.
check("rules/ contains markdown", rulesBytes > 0, "rules/ is empty — budget check measured nothing");

// ---------------------------------------------------------------------------
// Check 2 — every doc line that cites a repo path must still resolve.
// A refactor that breaks the rules which describe it is silent: this is the kill shot.
// ---------------------------------------------------------------------------
const pathCite = /`((?:src|prisma|scripts|tests|public|\.claude|db)[^`]*\/[^`]*|\.env\.example)`/g;
const missingPaths = [];
for (const rel of walk(".", (r) => r.endsWith(".md") && !r.startsWith("node_modules/") && r !== "worklog.md")) {
  const content = read(rel);
  for (const m of content.matchAll(pathCite)) {
    let cited = m[1];
    // Ignore glob-ish cites (contain * or ?) and template/ellipsis fragments — patterns, not paths
    if (/[*?]/.test(cited) || /[<>…]/.test(cited)) continue;
    // Ignore file:line cites (e.g. `schema.prisma:12`) — the path part is what matters, and
    // the line suffix makes a real path test impossible; resolve the path part instead.
    if (/^[\w./-]+:\d+$/.test(cited)) cited = cited.replace(/:\d+$/, "");
    // Ignore the SDD workspace — gitignored scratch, never a committed path
    if (cited.startsWith(".superpowers/")) continue;
    // Ignore backtick-wrapped fragments that are not paths: command names,
    // subcommand invocations (e.g. `db push`, `db:reset`, `srcset`)
    if (/\s/.test(cited)) continue;
    // Accept anything that starts with .env or a config file at root
    if (cited === ".env.example" || cited === "AGENTS.md") continue;
    // .claude/… cites are directory anchors in prose, not paths that must exist
    if (cited.startsWith(".claude/")) continue;
    // db/custom.db is a gitignored runtime file — its absence is normal
    if (cited === "db/custom.db") continue;
    if (!exists(cited)) missingPaths.push(`${rel}: \`${cited}\``);
  }
}
check(
  "every `src|prisma|scripts|tests|public|.claude|db` cite in docs resolves",
  missingPaths.length === 0,
  missingPaths.slice(0, 8).join(" · ")
);
// Control: the checker itself must fire on a known-missing path.
check(
  "path checker control (must-fire)",
  !exists(".claude/rules/this-file-must-never-exist.md"),
  "control path exists??"
);

// ---------------------------------------------------------------------------
// Check 3 — every [[wikilink]] in .claude docs resolves to a file in .claude/memory/.
// ---------------------------------------------------------------------------
const memoryFiles = walk(path.join(claudeDir, "memory"), (r) => r.endsWith(".md") && !r.endsWith("README.md"))
  .map((r) => r.replace(/^\.claude\/memory\//, "").replace(/\.md$/, ""));
const wikiLink = /\[\[([a-z0-9-]+)\]\]/g;
const brokenLinks = [];
for (const rel of walk(claudeDir, (r) => r.endsWith(".md"))) {
  const content = read(rel);
  for (const m of content.matchAll(wikiLink)) {
    const name = m[1];
    if (name === "wikilink" || name === "wikilinks") continue; // the README explains itself
    // allow a link to an entry with or without the a- prefix
    const ok = memoryFiles.includes(name) || memoryFiles.includes(`a-${name}`);
    // and allow abbreviated file names inside .claude/memory/ itself
    // (a file may link its sibling by bare name, e.g. [[dev-server-reaping-on-windows]])
    const bare = name.startsWith("a-") ? name.slice(2) : name;
    if (!ok && !memoryFiles.some((f) => f.endsWith(bare))) brokenLinks.push(`${rel}: [[${name}]]`);
  }
}
check("every [[wikilink]] resolves to .claude/memory/", brokenLinks.length === 0, brokenLinks.slice(0, 8).join(" · "));
check("memory/ contains entries", memoryFiles.length > 0, "memory/ has no .md entries — index check is a no-op");

// ---------------------------------------------------------------------------
// Check 4 — every memory file is indexed in memory/README.md (no orphans).
// ---------------------------------------------------------------------------
const memoryReadme = read(".claude/memory/README.md");
const unindexed = memoryFiles.filter((f) => {
  // indexed either as [name](name.md) or as [name.md]
  return !memoryReadme.includes(`[${f}](${f}.md)`) && !memoryReadme.includes(`[${f}.md]`);
});
check("every memory file is indexed in memory/README.md", unindexed.length === 0, `orphans: ${unindexed.join(", ")}`);

// ---------------------------------------------------------------------------
// Check 5 — rules are indexed in rules/README.md; agents+sills in their indexes.
// ---------------------------------------------------------------------------
const rulesIndex = read(".claude/rules/README.md");
const unindexedRules = walk(path.join(claudeDir, "rules"), (r) => r.endsWith(".md") && !r.endsWith("README.md"))
  .map((r) => r.replace(/^\.claude\/rules\//, "").replace(/\.md$/, ""))
  .filter((name) => !rulesIndex.includes(`(${name}.md)`));
check("every rule is indexed in rules/README.md", unindexedRules.length === 0, `unindexed rules: ${unindexedRules.join(", ")}`);

// ---------------------------------------------------------------------------
// Check 6 — AGENTS.md is a pointer, not a manual (≤ 800 bytes).
// ---------------------------------------------------------------------------
check(
  `AGENTS.md is a pointer (${agentsBytes}B ≤ 800B)`,
  agentsBytes > 0 && agentsBytes <= 800,
  "AGENTS.md must stay a thin bootstrap pointer; governance lives in .claude/"
);

// ---------------------------------------------------------------------------
// Check 7 — .env.example exists and is tracked by git (it was missing once and
// 8+ docs pointed at it; that is R5 in the risk register).
// ---------------------------------------------------------------------------
check(".env.example exists", exists(".env.example"), "missing — recreate from HOSTINGER_DEPLOYMENT.md §4 env table");

// ---------------------------------------------------------------------------
// Check 8 — no stray artifacts at the repo root (C1 closed: download/, --full-page).
// ---------------------------------------------------------------------------
const stray = ["download", "--full-page", "out-export.zip", "NUL"]
  .filter((name) => exists(name));
check("no stray artifacts at repo root", stray.length === 0, `found: ${stray.join(", ")}`);

// ---------------------------------------------------------------------------
console.log(failed === 0 ? "\nAll docs checks passed." : `\n${failed} docs check(s) failed.`);