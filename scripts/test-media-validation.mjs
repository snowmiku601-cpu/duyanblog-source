#!/usr/bin/env node
/**
 * Adversarial tests for media upload validation (src/lib/media-validation.ts).
 * The byte signature is authoritative — a client-supplied MIME / Content-Type
 * must never compensate for invalid bytes.
 *
 * Valid PNG / JPEG / WebP / AVIF must pass; a fake .png whose bytes are
 * actually SVG / arbitrary must be REFUSED even when Content-Type lies.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// media-validation.ts is import-free TS — transpile trivially via tsx? Use a
// plain reimplementation check is NOT acceptable; we import the real module.
// tsx is a devDependency; run this script with tsx.
const { validateMediaUpload, extFromName } = await import("../src/lib/media-validation.ts");

const U = (b) => new Uint8Array(b);

// Real PNG bytes (1x1, valid signature)
const REAL_PNG = U(Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63fcff3fc3000004010102a4f23200000000", "hex"));
// SVG-like bytes (fake .png)
const SVG_AS_PNG = Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>");
// Arbitrary bytes (fake .png)
const ARBITRARY = Buffer.from("this is definitely not a png at all, just plain text bytes");
// Real JPEG signature
const REAL_JPG = U([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
// Real WebP signature
const REAL_WEBP = U(Buffer.from("RIFF\x24\x00\x00\x00WEBPVP8 ", "binary"));
// Real AVIF signature
const REAL_AVIF = U(Buffer.concat([Buffer.alloc(4), Buffer.from("ftypavif", "ascii")]));

let passed = 0;
const cases = [
  // [name, filename, type, bytes, expectedOk]
  ["valid png→png accepted", "a.png", "image/png", REAL_PNG, true],
  ["valid jpg→jpg accepted", "a.jpg", "image/jpeg", REAL_JPG, true],
  ["valid webp→webp accepted", "a.webp", "image/webp", REAL_WEBP, true],
  ["valid avif→avif accepted", "a.avif", "image/avif", REAL_AVIF, true],
  ["png ACCEPTS correct MIME on real bytes", "a.png", "image/png", REAL_PNG, true],
  ["svg bytes named .png + MIME image/png → REFUSED", "fake.png", "image/png", SVG_AS_PNG, false],
  ["arbitrary bytes named .png + MIME image/png → REFUSED", "fake.png", "image/png", ARBITRARY, false],
  ["arbitrary bytes named .png, no MIME → REFUSED", "fake.png", "", ARBITRARY, false],
  ["png bytes named .jpg → REFUSED (ext mismatch)", "fake.jpg", "image/png", REAL_PNG, false],
  ["unsupported extension → REFUSED", "a.svg", "image/svg+xml", SVG_AS_PNG, false],
  ["unsupported .gif → REFUSED", "a.gif", "image/gif", U([0x47, 0x49, 0x46, 0x38]), false],
];

for (const [name, filename, type, bytes, expectedOk] of cases) {
  const res = validateMediaUpload(filename, type, U(bytes));
  const ok = res.ok === expectedOk;
  if (!ok) {
    console.error(`FAIL  ${name}: expected ${expectedOk} (ok=${res.ok}) err=${res.error}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS  ${name}`);
    passed++;
  }
}

// MIME-lie control: correct MIME on INVALID bytes must never compensate.
const lie = validateMediaUpload("fake.png", "image/png", U(ARBITRARY));
assert.equal(lie.ok, false, "correct MIME must never rescue invalid bytes");

console.log(`\nAll ${passed} adversarial media cases passed.`);
process.exit(process.exitCode ?? 0);