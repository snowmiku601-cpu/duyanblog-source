/**
 * Raster-only media upload validation — the byte signature is the single
 * authority. The MIME / Content-Type field is client-controlled and can lie,
 * so it must never compensate for invalid bytes. An upload passes only when:
 *   (a) the extension is a supported raster format, AND
 *   (b) the byte signature matches the declared extension, AND
 *   (c) if a MIME type is present, it also agrees.
 * Kept import-free so the adversarial tests can drive it directly.
 */

/** File signatures for the formats we accept (checked against real bytes). */
const SIGNATURES: Array<{ ext: string; test: (b: Uint8Array) => boolean }> = [
  { ext: "png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "webp",
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    ext: "avif",
    test: (b) =>
      b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 && b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69 && b[11] === 0x66,
  },
];

/** Raster-only formats (SVG removed: stored-XSS vector; GIF removed: no demonstrated need). */
const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function extFromName(name: string): string {
  const m = /\.(png|jpe?g|webp|avif)$/i.exec(name);
  if (!m) return "";
  return m[1].toLowerCase().replace("jpeg", "jpg");
}

export type MediaValidation =
  | { ok: true; ext: string }
  | { ok: false; error: string };

export function validateMediaUpload(
  fileName: string,
  fileType: string,
  bytes: Uint8Array,
): MediaValidation {
  const declared = extFromName(fileName);
  if (!declared) {
    return { ok: false, error: "Unsupported file type — use .png, .jpg, .webp or .avif." };
  }
  const sig = SIGNATURES.find((s) => s.ext === declared);
  const mimeOk = Boolean(fileType) && EXT_BY_MIME[fileType]?.toLowerCase() === declared;
  if (!sig || !sig.test(bytes) || (fileType && !mimeOk)) {
    return {
      ok: false,
      error: `The bytes don't match .${declared} — the file may be misnamed or corrupt. Re-export it as a real .${declared} and try again.`,
    };
  }
  return { ok: true, ext: declared };
}