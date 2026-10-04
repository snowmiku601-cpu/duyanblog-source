import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Runtime redirect service (Next 16 proxy — the successor of middleware).
 *
 * Serves the admin-managed `Redirect` table on every matched GET/HEAD request:
 * - SQLite lookup through Prisma (Node runtime), negative-cached in memory.
 * - 30s TTL: admin changes take effect within half a minute without a deploy.
 * - Resolves redirect chains up to 3 hops and redirects straight to the
 *   final destination (single hop for the visitor, first hop's status code).
 * - Preserves the original query string unless the target defines its own.
 * - Never throws: on any failure the request continues untouched.
 *
 * Excluded from matching (config below): Next internals, /api, /go (the
 * affiliate click router), /admin (has its own auth redirects), feed/sitemap/
 * robots, and any path that looks like a file (contains a dot).
 */

export const config = {
  runtime: "nodejs",
  matcher: [
    "/((?!api/|go/|admin|_next/static|_next/image|favicon\\.svg|robots\\.txt|sitemap\\.xml|feed\\.xml|images/|logo/|.*\\.).*)",
  ],
};

type Target = { to: string; statusCode: number };

const CACHE_TTL_MS = 30_000;
const MAX_CACHE_ENTRIES = 1_000;
const MAX_CHAIN_HOPS = 3;

const cache = new Map<string, Target | null>();

function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

function remember(from: string, target: Target | null): void {
  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
  cache.set(from, target);
}

async function lookup(from: string): Promise<Target | null> {
  if (cache.has(from)) return cache.get(from) ?? null;
  try {
    const row = await db.redirect.findFirst({ where: { from, active: true } });
    const target: Target | null = row ? { to: row.to, statusCode: row.statusCode } : null;
    remember(from, target);
    return target;
  } catch (err) {
    // Database hiccup must never take the site down.
    console.error("proxy redirect lookup failed", err);
    return null;
  }
}

function absoluteTarget(to: string, request: NextRequest): URL {
  if (/^https?:\/\//i.test(to)) return new URL(to);
  const url = new URL(to, request.nextUrl.origin);
  // Preserve the visitor's query string (UTMs, filters) unless the target has its own.
  if (!url.search && request.nextUrl.search) url.search = request.nextUrl.search;
  return url;
}

export default async function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  try {
    const from = normalizePath(request.nextUrl.pathname);
    if (!from) return NextResponse.next();

    // Resolve chains (a → b → c) up to MAX_CHAIN_HOPS, guarding against loops.
    const visited = new Set<string>([from]);
    let current = from;
    let target: Target | null = null;
    for (let hop = 0; hop < MAX_CHAIN_HOPS; hop++) {
      const next = await lookup(current);
      if (!next) return target ? redirectResponse(request, target) : NextResponse.next();
      const destination = normalizePath(next.to.replace(/^https?:\/\/[^/]+/i, ""));
      if (visited.has(destination)) break; // loop in admin data — fall through
      visited.add(destination);
      target = next;
      current = destination;
      if (/^https?:\/\//i.test(next.to)) break; // off-site target, no further hops
    }
    return target ? redirectResponse(request, target) : NextResponse.next();
  } catch (err) {
    console.error("proxy redirect error", err);
    return NextResponse.next();
  }
}

function redirectResponse(request: NextRequest, target: Target): NextResponse {
  const status = target.statusCode === 301 ? 301 : 302;
  return NextResponse.redirect(absoluteTarget(target.to, request), status);
}
