/**
 * Tiny fixed-window in-memory rate limiter.
 * Sufficient for a single-node editorial site; swap for Redis/edge KV when
 * horizontally scaling (see ARCHITECTURE.md).
 *
 * IP attribution is a security-sensitive input: `X-Forwarded-For` AND
 * `x-real-ip` are both client-supplied headers, and both are forgeable unless
 * the operating proxy/edge is verified to overwrite them. Untrusted by
 * default: the limiter keys on a stable per-process fallback so a rotated
 * forwarding header cannot mint a fresh bucket. Compose per-account /
 * process-global buckets where true client identity is needed.
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
 *   client-supplied forwarding headers): return the first XFF hop. Both
 *   `x-forwarded-for` and `x-real-ip` are client-controlled input headers; a
 *   proxy that sanitizes one must be verified to sanitize the other.
 * - Untrusted (default): NEVER read client-supplied XFF, and NEVER read
 *   `x-real-ip` either — that header is just as forgeable when no proxy
 *   overwrites it. The limiter keys on a stable per-process fallback so it
 *   still works without exposing a forgeable input. Where a true client
 *   identity is needed beyond the process window, compose a per-account /
 *   process-global bucket (see login and newsletter routes).
 */
export function clientIp(request: Request, opts: { trustProxy?: boolean } = {}): string {
  const trust = opts.trustProxy ?? TRUST_PROXY;
  if (trust) {
    const fwd = request.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]!.trim();
    const real = request.headers.get("x-real-ip");
    if (real) return real.trim();
  }
  return "__untrusted__";
}