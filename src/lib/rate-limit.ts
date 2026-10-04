/**
 * Tiny fixed-window in-memory rate limiter.
 * Sufficient for a single-node editorial site; swap for Redis/edge KV when
 * horizontally scaling (see ARCHITECTURE.md).
 *
 * IP attribution is a security-sensitive input: a client-supplied
 * `X-Forwarded-For` header is forgeable, so we refuse to trust it unless the
 * operator has explicitly verified that the edge overwrites/sanitizes
 * client-supplied forwarding headers AND set TRUST_PROXY=true. Untrusted by
 * default = a rotated XFF cannot mint a fresh rate-limit bucket.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

const TRUST_PROXY = process.env.TRUST_PROXY === "true";

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/**
 * Resolve the client IP for rate-limit keying.
 *
 * - Trusted proxy (TRUST_PROXY=true AND the edge is verified to overwrite
 *   client-supplied XFF): return the first XFF hop.
 * - Untrusted (default): NEVER read client-supplied XFF. Prefer the
 *   platform-set x-real-ip; if absent, fall back to a stable per-process key
 *   so the limiter still works without exposing a forgeable input.
 */
export function clientIp(request: Request, opts: { trustProxy?: boolean } = {}): string {
  const trust = opts.trustProxy ?? TRUST_PROXY;
  if (trust) {
    const fwd = request.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip") ?? "__local__";
}