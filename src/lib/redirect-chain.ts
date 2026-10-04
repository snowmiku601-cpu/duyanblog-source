/**
 * Redirect-chain analysis — the single source of truth for chain rules,
 * shared by the admin form (live feedback) and the POST API (enforcement).
 *
 * The runtime proxy (src/proxy.ts) resolves at most MAX_HOPS hops of
 * active redirects before falling through, so the same rules apply when
 * a redirect is created: duplicates and self-loops are rejected outright,
 * chains longer than MAX_HOPS are rejected, and 2–3 hop chains are allowed
 * but flagged as a warning.
 */

/** The runtime proxy resolves at most 3 hops before falling through to a 404. */
export const MAX_HOPS = 3;

/** Minimal shape the analysis needs — Prisma rows and form drafts both fit. */
export type ChainRow = {
  id: string;
  from: string;
  to: string;
};

export function normalizePath(p: string): string {
  const trimmed = p.trim();
  if (!trimmed.startsWith("/")) return trimmed;
  // strip query/hash for chain matching; collapse trailing slash (except "/")
  const path = trimmed.split("?")[0].split("#")[0];
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** Follow `to` targets through `map` from `start`; looped=true if a path revisits a node. */
export function resolveChain(
  start: string,
  map: Map<string, ChainRow>,
  max: number,
): { chain: ChainRow[]; looped: boolean } {
  const chain: ChainRow[] = [];
  const seen = new Set<string>();
  let cur = start;
  let looped = false;
  while (chain.length < max) {
    if (seen.has(cur)) {
      looped = true;
      break;
    }
    seen.add(cur);
    const row = map.get(cur);
    if (!row) break;
    chain.push(row);
    const next = row.to.startsWith("/") ? normalizePath(row.to) : null;
    if (!next || !next.startsWith("/")) break;
    cur = next;
  }
  return { chain, looped };
}

export type ChainVerdict = {
  blocked: string | null;
  warning: string | null;
  /** Hop count of the longest chain that would involve the new redirect. */
  hops: number;
};

const NEW_ID = "__new";

/**
 * Validate a hypothetical new redirect against the existing rows.
 * `rows` should be the active redirects currently stored (the runtime
 * only serves active rows, so inactive ones must not count as hops).
 */
export function analyzeChain(
  rows: ChainRow[],
  next: { from: string; to: string },
): ChainVerdict {
  const from = normalizePath(next.from);
  const to = normalizePath(next.to);

  if (!from || !to) return { blocked: null, warning: null, hops: 0 };
  if (from === to) {
    return {
      blocked: "That would redirect to itself — visitors would hit a loop.",
      warning: null,
      hops: 0,
    };
  }
  if (rows.some((r) => normalizePath(r.from) === from)) {
    return {
      blocked: `Another redirect already starts at ${from}. Delete or edit that one first.`,
      warning: null,
      hops: 0,
    };
  }

  // Map including the hypothetical new row so chains run through it in both directions.
  const map = new Map<string, ChainRow>();
  for (const r of rows) map.set(normalizePath(r.from), r);
  map.set(from, { id: NEW_ID, from: next.from, to: next.to });

  const preview = (chain: ChainRow[]) =>
    chain.map((c) => normalizePath(c.from)).join(" → ") + " → " + chain[chain.length - 1].to;

  let maxHops = 0;
  let bestPreview = "";

  // Outgoing: the chain that starts at the new redirect itself.
  const out = resolveChain(from, map, MAX_HOPS + 1);
  if (out.looped) {
    return { blocked: "This creates a redirect loop. The runtime would give up and 404.", warning: null, hops: 0 };
  }
  if (out.chain.length > 1) {
    maxHops = out.chain.length;
    bestPreview = preview(out.chain);
  }

  // Incoming: existing chains that flow into the new redirect.
  for (const start of map.keys()) {
    if (start === from) continue;
    const walk = resolveChain(start, map, MAX_HOPS + 1);
    if (!walk.chain.some((c) => c.id === NEW_ID)) continue; // doesn't involve the new row
    if (walk.looped) {
      return { blocked: "This creates a redirect loop. The runtime would give up and 404.", warning: null, hops: 0 };
    }
    if (walk.chain.length > maxHops) {
      maxHops = walk.chain.length;
      bestPreview = preview(walk.chain);
    }
  }

  if (maxHops > MAX_HOPS) {
    return {
      blocked: `This chains ${maxHops} hops (${bestPreview}) — the runtime stops after ${MAX_HOPS}, so visitors would fall through to a 404. Point the redirect at the final destination instead.`,
      warning: null,
      hops: maxHops,
    };
  }
  if (maxHops > 1) {
    return {
      blocked: null,
      warning: `This chains ${maxHops} hops (${bestPreview}). It works, but each hop costs a request — consider pointing at the final destination.`,
      hops: maxHops,
    };
  }
  return { blocked: null, warning: null, hops: maxHops };
}

/** Per-row outgoing hop counts for table badges (looped → -1). */
export function hopCountsFor(rows: ChainRow[]): Map<string, number> {
  const map = new Map(rows.map((r) => [normalizePath(r.from), r]));
  const counts = new Map<string, number>();
  for (const r of rows) {
    const walk = resolveChain(normalizePath(r.from), map, MAX_HOPS + 1);
    counts.set(r.id, walk.looped ? -1 : walk.chain.length);
  }
  return counts;
}
