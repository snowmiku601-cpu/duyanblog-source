/**
 * Tiny fixed-window in-memory rate limiter.
 * Sufficient for a single-node editorial site; swap for Redis/edge KV when
 * horizontally scaling (see ARCHITECTURE.md).
 *
 * IP attribution is a security-sensitive input: `X-Forwarded-For` AND
 * `x-real-ip` are both client-supplied headers, and both are forgeable unless
 * the operating proxy/edge is verified to overwrite them. Untrusted by
 * default: `clientIp()` returns null (no trusted IP) so routes apply
 * fine-grained per-IP buckets ONLY when a trusted IP exists, and rely on
 * per-account / per-email / process-global buckets otherwise. A model where
 * every anonymous visitor shares one "untrusted" IP bucket would let one
 * visitor 429 all the others — that failure is what null avoids.
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
 * Resolve the client IP for rate-limit keying, if one is TRUSTED.
 *
 * - Trusted proxy (TRUST_PROXY=true AND the edge is verified to overwrite
 *   client-supplied forwarding headers): return the first XFF hop, falling
 *   back to x-real-ip. Both headers are client-controlled; a proxy that
 *   sanitizes one must be verified to sanitize the other.
 * - Untrusted (default): return null. We NEVER read client-supplied XFF or
 *   x-real-ip, so a rotated forging header cannot mint a fresh trusted-IP
 *   bucket. Routes must not apply a per-IP bucket to null — they key on
 *   per-account/per-email + process-global buckets instead.
 */
export function clientIp(request: Request, opts: { trustProxy?: boolean } = {}): string | null {
  const trust = opts.trustProxy ?? TRUST_PROXY;
  if (trust) {
    const fwd = request.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]!.trim();
    const real = request.headers.get("x-real-ip");
    if (real) return real.trim();
  }
  return null;
}