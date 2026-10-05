#!/usr/bin/env node
/**
 * Minimal smoke test: run against a running server.
 *
 *   npm run test               # checks http://localhost:3000
 *   SMOKE_BASE_URL=http://host:port npm run test
 *
 * Exit code 0 = all checks passed. No test framework — deliberately tiny.
 *
 * NOTE: back-to-back runs can trip the newsletter rate limiter (5 POSTs /
 * 60s / IP) and fail those two checks with 429 — wait a minute and re-run.
 * That limiter working is the feature being protected.
 */
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const PAGES = [
  "/",
  "/reviews",
  "/best",
  "/compare",
  "/guides",
  "/articles",
  "/deals",
  "/search?q=esim",
  "/authors",
  "/about",
  "/contact",
  "/methodology",
  "/editorial-policy",
  "/how-we-make-money",
  "/affiliate-disclosure",
  "/advertising-disclosure",
  "/corrections-policy",
  "/privacy-policy",
  "/cookie-policy",
  "/terms",
  "/software",
  "/travel",
  "/tech",
  "/nonexistent-page-404-check",
];

const checks = [];
for (const path of PAGES) {
  checks.push({ path, expect: path.includes("nonexistent") ? 404 : 200 });
}
checks.push(
  { path: "/sitemap.xml", expect: 200 },
  { path: "/robots.txt", expect: 200 },
  { path: "/feed.xml", expect: 200 },
  { path: "/go/does-not-exist", expect: 302 },
  { path: "/admin", expect: 307 },
  { path: "/admin/subscribers", expect: 307 },
  // Seeded demo redirect must be enforced at runtime by src/proxy.ts.
  // (Present only after `npm run seed:demo`; the check fails politely otherwise.)
  { path: "/old-esim-guide", expect: 302 }
);

let failed = 0;

// Fail-closed indexing semantics (Correction 2): ALLOW_INDEXING is the only
// gate. Unset/absent -> full Disallow (staging/localhost/preview); set=true ->
// allow public content + expose sitemap. Assert semantics, not byte equality.
{
  try {
    const res = await fetch(`${BASE}/robots.txt`, { redirect: "manual" });
    const body = await res.text();
    const allowIndexing = process.env.ALLOW_INDEXING === "true";
    const ok =
      res.status === 200 &&
      (allowIndexing
        ? /Allow:\s*\/$/m.test(body) && /Sitemap:/.test(body)
        : /Disallow:\s*\/$/m.test(body) && !/Sitemap:/.test(body));
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${res.status} robots.txt ${
        allowIndexing ? "indexing allowed (ALLOW_INDEXING=true)" : "indexing blocked (fail-closed, ALLOW_INDEXING unset)"
      }`
    );
    if (!ok) failed += 1;
  } catch (err) {
    console.log(`FAIL  ERR  robots.txt  ${err.message}`);
    failed += 1;
  }
}

// The /go fallback Location must point at the PUBLIC origin, not the upstream
// (request.url behind the Hostinger edge is 0.0.0.0:3000 — regressed once, fixed
// via site.url). Status-only checks would pass a dead-origin redirect.
// When smoke-testing a local server, BASE (localhost) differs from site.url
// (the configured public origin), so accept any 302 whose target is a public
// /deals path on some origin — the invariant is "never the upstream origin".
{
  const res = await fetch(`${BASE}/go/does-not-exist`, { redirect: "manual" });
  const loc = res.headers.get("location") ?? "";
  const target = new URL(loc, BASE);
  const ok =
    res.status === 302 &&
    !loc.includes("0.0.0.0") &&
    !["localhost", "127.0.0.1", "0.0.0.0"].includes(target.hostname) &&
    target.pathname.endsWith("/deals");
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} Location=${loc}  /go/does-not-exist fallback targets public origin`);
  if (!ok) failed += 1;
}

for (const { path, expect } of checks) {
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
    const ok = res.status === expect;
    console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want ${expect})  ${path}`);
    if (!ok) failed += 1;
  } catch (err) {
    console.log(`FAIL  ERR  ${path}  ${err.message}`);
    failed += 1;
  }
}

// POST /api/newsletter with a bad email must 400
try {
  const res = await fetch(`${BASE}/api/newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" }),
  });
  const ok = res.status === 400;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 400)  POST /api/newsletter invalid email`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  POST /api/newsletter  ${err.message}`);
  failed += 1;
}

// Per-category RSS: known category filters the feed, unknown slug 404s.
// (Category slug "software" exists only after `npm run seed:demo`.)
try {
  const res = await fetch(`${BASE}/feed.xml?category=software`, { redirect: "manual" });
  const xml = res.status === 200 ? await res.text() : "";
  const hasChannel =
    xml.includes("Duyan Blog — Software") || xml.includes("<category>"); // filtered channel or per-item category tags
  const ok = res.status === 200 && hasChannel;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 200 + filtered channel)  /feed.xml?category=software`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  /feed.xml?category=software  ${err.message}`);
  failed += 1;
}
try {
  const res = await fetch(`${BASE}/feed.xml?category=does-not-exist`, { redirect: "manual" });
  const ok = res.status === 404;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 404)  /feed.xml?category=does-not-exist`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  /feed.xml?category=does-not-exist  ${err.message}`);
  failed += 1;
}

// Search with a query + section chip filter (unknown category falls back to no filter → 200).
try {
  const res = await fetch(`${BASE}/search?q=esim&cat=software`);
  const ok = res.status === 200;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 200)  /search?q=esim&cat=software`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  /search?q=esim&cat=software  ${err.message}`);
  failed += 1;
}

// Per-tag RSS: known tag filters the feed with a #tag channel, unknown slug 404s,
// and combining ?category= + ?tag= is rejected. (Tag slug "esim" exists after seed:demo.)
// NOTE: with all seeded content isDemo=true, the eSIM feed may legitimately be EMPTY
// (demo content is excluded from feeds per Correction 6) — the channel title is the
// assertion, not a non-empty item list.
try {
  const res = await fetch(`${BASE}/feed.xml?tag=esim`, { redirect: "manual" });
  const xml = res.status === 200 ? await res.text() : "";
  const ok = res.status === 200 && xml.includes("— #eSIM");
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 200 + #eSIM channel${xml.includes("<item>") ? " + items" : "; empty (demo excluded) is correct"})  /feed.xml?tag=esim`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  /feed.xml?tag=esim  ${err.message}`);
  failed += 1;
}
try {
  const res = await fetch(`${BASE}/feed.xml?tag=does-not-exist`, { redirect: "manual" });
  const ok = res.status === 404;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 404)  /feed.xml?tag=does-not-exist`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  /feed.xml?tag=does-not-exist  ${err.message}`);
  failed += 1;
}
try {
  const res = await fetch(`${BASE}/feed.xml?category=software&tag=esim`, { redirect: "manual" });
  const ok = res.status === 400;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 400)  /feed.xml with both category and tag`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  /feed.xml?category=software&tag=esim  ${err.message}`);
  failed += 1;
}

// Newsletter double opt-in end-to-end: subscribe → dev confirmUrl (or production no-URL) →
// confirm → re-open (idempotent "already confirmed"). Also the bare page and a bogus token.
// In production (NODE_ENV=production) the confirmUrl is NEVER echoed — that is the designed
// security property; the response carries `emailed` instead (email transport may be "none").
try {
  const email = `smoke-${Date.now()}@duyanblog.test`;
  const res = await fetch(`${BASE}/api/newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  const isDev = typeof data.confirmUrl === "string";
  const ok1 = res.status === 200 && data.ok && (isDev || typeof data.emailed === "boolean");
  console.log(`${ok1 ? "PASS" : "FAIL"}  ${res.status} (want 200${isDev ? " + confirmUrl" : "; dev-style confirmUrl absent is correct in prod"})  POST /api/newsletter double opt-in`);
  if (!ok1) failed += 1;

  if (ok1 && isDev) {
    const confirm1 = await fetch(data.confirmUrl, { redirect: "manual" });
    const ok2 = confirm1.status === 200;
    console.log(`${ok2 ? "PASS" : "FAIL"}  ${confirm1.status} (want 200)  GET confirm link (first use)`);
    if (!ok2) failed += 1;

    const confirm2 = await fetch(data.confirmUrl, { redirect: "manual" });
    const ok3 = confirm2.status === 200;
    console.log(`${ok3 ? "PASS" : "FAIL"}  ${confirm2.status} (want 200, idempotent)  GET confirm link (replay)`);
    if (!ok3) failed += 1;
  } else if (ok1) {
    console.log("INFO  production response has no confirmUrl (designed); skipping link replay");
  }
} catch (err) {
  console.log(`FAIL  ERR  newsletter double opt-in flow  ${err.message}`);
  failed += 1;
}
try {
  const res = await fetch(`${BASE}/newsletter/confirm?token=deadbeef`, { redirect: "manual" });
  const ok = res.status === 200;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 200, invalid state)  /newsletter/confirm bogus token`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  /newsletter/confirm  ${err.message}`);
  failed += 1;
}

// JSON Feed 1.1 — mirrors the RSS scopes: site-wide, per-tag, 404/400 guards.
// NOTE: all seeded content is isDemo=true, so the site-wide feed may be EMPTY
// (demo excluded from feeds per Correction 6) — structure is the assertion.
try {
  const res = await fetch(`${BASE}/feed.json`, { redirect: "manual" });
  const ok = res.status === 200;
  let body = {};
  if (ok) body = await res.json();
  const structured =
    ok &&
    body.version === "https://jsonfeed.org/version/1.1" &&
    typeof body.feed_url === "string" &&
    Array.isArray(body.items) && // may be [] (demo excluded)
    body.items.every((it) => typeof it.id === "string" && typeof it.date_published === "string");
  console.log(
    `${structured ? "PASS" : "FAIL"}  ${res.status} (want 200 + valid JSON Feed 1.1${
      body.items?.length ? `, ${body.items.length} item(s)` : "; empty (demo excluded) is correct"
    })  /feed.json`
  );
  if (!structured) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  /feed.json  ${err.message}`);
  failed += 1;
}
try {
  const res = await fetch(`${BASE}/feed.json?tag=esim`, { redirect: "manual" });
  const ok = res.status === 200;
  let body = {};
  if (ok) body = await res.json();
  const tagged = ok && body.title?.includes("— #eSIM") && body.feed_url?.includes("tag=esim");
  console.log(`${tagged ? "PASS" : "FAIL"}  ${res.status} (want 200 + #eSIM scope)  /feed.json?tag=esim`);
  if (!tagged) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  /feed.json?tag=esim  ${err.message}`);
  failed += 1;
}
try {
  const res = await fetch(`${BASE}/feed.json?tag=does-not-exist`, { redirect: "manual" });
  const ok = res.status === 404;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 404)  /feed.json?tag=does-not-exist`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  /feed.json?tag=does-not-exist  ${err.message}`);
  failed += 1;
}
try {
  const res = await fetch(`${BASE}/feed.json?category=software&tag=esim`, { redirect: "manual" });
  const ok = res.status === 400;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 400)  /feed.json with both scopes`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  /feed.json both scopes  ${err.message}`);
  failed += 1;
}

// Media upload endpoint must refuse unauthenticated requests (guardAdmin).
try {
  const res = await fetch(`${BASE}/api/admin/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const ok = res.status === 401 || res.status === 403;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 401/403)  POST /api/admin/media without session`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  POST /api/admin/media  ${err.message}`);
  failed += 1;
}

// Media delete endpoint must refuse unauthenticated requests…
try {
  const res = await fetch(`${BASE}/api/admin/media?path=/images/whatever.png`, { method: "DELETE" });
  const ok = res.status === 401 || res.status === 403;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 401/403)  DELETE /api/admin/media without session`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  DELETE /api/admin/media  ${err.message}`);
  failed += 1;
}

// …and traversal attempts must never succeed (any 4xx is fine: auth may fire
// before path validation — the assertion is that it is never 2xx/3xx).
try {
  const res = await fetch(`${BASE}/api/admin/media?path=${encodeURIComponent("/images/../../.env")}`, {
    method: "DELETE",
  });
  const ok = res.status >= 400 && res.status < 500;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 4xx)  DELETE /api/admin/media traversal refused`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  DELETE /api/admin/media traversal  ${err.message}`);
  failed += 1;
}

// Bulk media delete must refuse unauthenticated requests too.
try {
  const res = await fetch(`${BASE}/api/admin/media/bulk-delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paths: ["/images/whatever.png"] }),
  });
  const ok = res.status === 401 || res.status === 403;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 401/403)  POST /api/admin/media/bulk-delete without session`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  POST /api/admin/media/bulk-delete  ${err.message}`);
  failed += 1;
}

// Admin media page redirects unauthenticated visitors to the login (307).
try {
  const res = await fetch(`${BASE}/admin/media`, { redirect: "manual" });
  const ok = res.status === 307 || res.status === 302;
  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status} (want 307)  /admin/media without session redirects`);
  if (!ok) failed += 1;
} catch (err) {
  console.log(`FAIL  ERR  /admin/media  ${err.message}`);
  failed += 1;
}

console.log(failed === 0 ? "\nAll smoke checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
